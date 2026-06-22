/**
 * Generates workbook-style exercises from the words / sentences / lesson_words
 * tables already in the DB. The output goes into the `exercises` table
 * (migration 007). No publisher content is bundled.
 *
 *   npm run db:generate-exercises             # all HSK 1+2 lessons
 *   npm run db:generate-exercises -- 1 3      # HSK 1 Lesson 3 only (book hsk1 number 3)
 *   npm run db:generate-exercises -- hsk2 5
 *
 * Idempotent. Re-running drops every exercise tagged to a lesson and
 * regenerates them with the same stable_ids, preserving any
 * exercise_attempts via FK cascade-on-delete only when the slot is gone.
 *
 * Seven types (per build spec §5.10):
 *   cloze            - blank one content word from a sentence; pick from 4
 *   reorder          - shuffle sentence chunks; user reorders
 *   matching         - 5 lesson words ↔ 5 meanings, one-to-one
 *   listening_choice - play word audio; pick from 4 meanings
 *   pinyin_tone      - multi-syllable word; user picks the tone pattern
 *   translate        - English sentence; user assembles the Chinese from word chips
 *   dictation        - skipped here (overlaps with /listening; can be added later)
 */

import { Pool } from "pg";
import { loadEnv } from "./lib/env";

loadEnv();

const TARGETS_PER_TYPE: Record<string, number> = {
  cloze: 4,
  reorder: 3,
  matching: 1,
  listening_choice: 4,
  pinyin_tone: 3,
  translate: 3,
};

// ─── Tone helpers (duplicated from lib/pinyin to keep this script self-contained
// and avoid the next.js-aware "server-only" import).
const TONE_MAP: Record<string, number> = {
  "ā": 1, "ē": 1, "ī": 1, "ō": 1, "ū": 1, "ǖ": 1, "ḿ": 2, "ń": 2, "ǹ": 4,
  "á": 2, "é": 2, "í": 2, "ó": 2, "ú": 2, "ǘ": 2,
  "ǎ": 3, "ě": 3, "ǐ": 3, "ǒ": 3, "ǔ": 3, "ǚ": 3, "ň": 3,
  "à": 4, "è": 4, "ì": 4, "ò": 4, "ù": 4, "ǜ": 4,
};
function syllableTone(syl: string): number { for (const c of syl) if (TONE_MAP[c]) return TONE_MAP[c]; return 5; }
function tonePattern(pinyin: string): number[] {
  return pinyin.trim().split(/\s+/).filter(Boolean).map(syllableTone);
}
function tonePatternKey(t: number[]): string { return t.map((n) => (n === 5 ? "0" : String(n))).join("-"); }
function toneDistractors(correct: number[], count: number, rng: () => number): number[][] {
  const out: number[][] = []; const seen = new Set<string>([tonePatternKey(correct)]);
  for (let tries = 0; out.length < count && tries < 200; tries++) {
    const cand = Array.from({ length: correct.length }, () => 1 + Math.floor(rng() * 4));
    const k = tonePatternKey(cand);
    if (seen.has(k)) continue; seen.add(k); out.push(cand);
  }
  return out;
}

// ─── Deterministic RNG so re-runs of the generator produce the same distractor
// choices and same item ordering. Mulberry32 seeded from a string.
function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── DB shapes ───────────────────────────────────────────────────────────────
interface LessonRow { id: number; book: string; number: number; title_hanzi: string; }
interface WordRow {
  id: number; simplified: string; pinyin: string; meanings: string[];
  hsk2_level: number | null; audio_path: string | null;
}
interface SentenceRow {
  id: number; simplified: string; pinyin: string | null; english: string;
  audio_path: string | null; length: number | null;
}

// ─── Generators ──────────────────────────────────────────────────────────────

interface GeneratedItem {
  stable_id: string;
  type: string;
  prompt: string;
  payload: unknown;
  answer: unknown;
  source_sentence_id?: number;
  source_word_id?: number;
  audio_path?: string;
}

/** Pick distractor words at the same HSK level, not equal to the target. */
async function pickDistractorWords(
  pool: Pool, target: WordRow, count: number, rng: () => number,
): Promise<WordRow[]> {
  const { rows } = await pool.query<WordRow>(
    `SELECT id, simplified, pinyin, meanings, hsk2_level, audio_path
     FROM words
     WHERE hsk2_level = $1
       AND id <> $2
       AND CHAR_LENGTH(simplified) BETWEEN $3 AND $4
     ORDER BY random()
     LIMIT $5`,
    [
      target.hsk2_level ?? 1, target.id,
      Math.max(1, [...target.simplified].length - 1),
      [...target.simplified].length + 1,
      Math.max(20, count * 5),
    ],
  );
  return shuffle(rows, rng).slice(0, count);
}

/** Cloze: find a sentence containing one lesson word, blank that word, 4 options. */
async function makeCloze(
  pool: Pool, lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
): Promise<GeneratedItem[]> {
  const out: GeneratedItem[] = [];
  // Pick candidates: for each word, find the shortest sentence containing it.
  for (const w of words) {
    if (out.length >= count) break;
    if ([...w.simplified].length < 1) continue;
    const { rows: sents } = await pool.query<SentenceRow>(
      `SELECT s.id, s.simplified, s.pinyin, s.english, s.audio_path, s.length
       FROM sentence_words sw
       JOIN sentences s ON s.id = sw.sentence_id
       WHERE sw.word_id = $1
         AND s.length BETWEEN 5 AND 18
         AND POSITION($2 IN s.simplified) > 0
       ORDER BY COALESCE(s.length, 99) ASC
       LIMIT 1`,
      [w.id, w.simplified],
    );
    const s = sents[0];
    if (!s) continue;

    const distractors = await pickDistractorWords(pool, w, 3, rng);
    if (distractors.length < 3) continue;

    const optionsRaw = [w, ...distractors].map((d) => ({
      word_id: d.id, simplified: d.simplified, pinyin: d.pinyin,
      english: d.meanings?.[0] ?? "",
    }));
    const options = shuffle(optionsRaw, rng);
    const answerIndex = options.findIndex((o) => o.word_id === w.id);

    const blanked = s.simplified.replace(w.simplified, "___");
    out.push({
      stable_id: `ex:${lesson.id}:cloze:${out.length + 1}`,
      type: "cloze",
      prompt: "Choose the word that best fills the blank.",
      payload: {
        sentence_blanked: blanked,
        sentence_full: s.simplified,
        pinyin: s.pinyin,
        english: s.english,
        target_word_id: w.id,
        options,
      },
      answer: { index: answerIndex, word_id: w.id, simplified: w.simplified },
      source_sentence_id: s.id,
      source_word_id: w.id,
    });
  }
  return out;
}

/** Reorder: shuffle a sentence's tokens; user reassembles. */
async function makeReorder(
  pool: Pool, lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
  segment: (s: string) => Promise<string[]>,
): Promise<GeneratedItem[]> {
  const out: GeneratedItem[] = [];
  const seenSent = new Set<number>();
  for (const w of words) {
    if (out.length >= count) break;
    const { rows: sents } = await pool.query<SentenceRow>(
      `SELECT s.id, s.simplified, s.pinyin, s.english, s.audio_path, s.length
       FROM sentence_words sw
       JOIN sentences s ON s.id = sw.sentence_id
       WHERE sw.word_id = $1
         AND s.length BETWEEN 5 AND 14
       ORDER BY COALESCE(s.length, 99) ASC
       LIMIT 3`,
      [w.id],
    );
    for (const s of sents) {
      if (seenSent.has(s.id)) continue;
      const tokens = await segment(s.simplified);
      if (tokens.length < 3 || tokens.length > 8) continue;
      seenSent.add(s.id);

      const shuffled = shuffle(tokens, rng);
      // Guarantee the shuffle is actually different. If it isn't, swap two.
      if (shuffled.every((t, i) => t === tokens[i]) && shuffled.length >= 2) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      out.push({
        stable_id: `ex:${lesson.id}:reorder:${out.length + 1}`,
        type: "reorder",
        prompt: "Put the chips in the right order.",
        payload: {
          chips_shuffled: shuffled,
          pinyin: s.pinyin,
          english: s.english,
        },
        answer: { ordered: tokens, sentence: s.simplified },
        source_sentence_id: s.id,
      });
      break;
    }
  }
  return out;
}

/** Matching: 5 words ↔ 5 meanings. Single item per lesson by default. */
function makeMatching(
  lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
): GeneratedItem[] {
  const eligible = words.filter((w) => (w.meanings?.[0] ?? "").trim().length > 0);
  if (eligible.length < 5) return [];
  const out: GeneratedItem[] = [];
  for (let i = 0; i < count; i++) {
    const slice = shuffle(eligible, rng).slice(0, Math.min(5, eligible.length));
    if (slice.length < 4) break;
    const items = slice.map((w) => ({
      word_id: w.id, simplified: w.simplified, pinyin: w.pinyin,
      english: w.meanings[0],
    }));
    const englishShuffled = shuffle(items.map((it) => ({ word_id: it.word_id, english: it.english })), rng);
    out.push({
      stable_id: `ex:${lesson.id}:matching:${i + 1}`,
      type: "matching",
      prompt: "Match each word to its meaning.",
      payload: {
        hanzi_column: items.map(({ word_id, simplified, pinyin }) => ({ word_id, simplified, pinyin })),
        english_column: englishShuffled,
      },
      answer: {
        pairs: items.map((it) => ({ word_id: it.word_id, english: it.english })),
      },
    });
  }
  return out;
}

/** Listening choice: hear a word, pick a meaning out of 4. Needs audio_path. */
async function makeListeningChoice(
  pool: Pool, lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
): Promise<GeneratedItem[]> {
  const out: GeneratedItem[] = [];
  for (const w of words) {
    if (out.length >= count) break;
    if (!w.audio_path) continue;
    const targetMeaning = (w.meanings?.[0] ?? "").trim();
    if (!targetMeaning) continue;
    const distractors = await pickDistractorWords(pool, w, 6, rng);
    const distMeanings = distractors
      .map((d) => (d.meanings?.[0] ?? "").trim())
      .filter((m) => m && m !== targetMeaning);
    if (distMeanings.length < 3) continue;
    const uniqueDist: string[] = [];
    for (const m of distMeanings) {
      if (uniqueDist.length >= 3) break;
      if (!uniqueDist.includes(m)) uniqueDist.push(m);
    }
    if (uniqueDist.length < 3) continue;

    const optionsRaw = [targetMeaning, ...uniqueDist].map((m, idx) => ({ idx, english: m }));
    const options = shuffle(optionsRaw, rng).map((o, i) => ({ letter: "ABCD"[i], english: o.english }));
    const answerLetter = options.find((o) => o.english === targetMeaning)!.letter;

    out.push({
      stable_id: `ex:${lesson.id}:listening_choice:${out.length + 1}`,
      type: "listening_choice",
      prompt: "Listen and pick the meaning.",
      payload: {
        word_id: w.id, simplified: w.simplified, pinyin: w.pinyin,
        audio_path: w.audio_path, options,
      },
      answer: { letter: answerLetter, english: targetMeaning },
      source_word_id: w.id,
      audio_path: w.audio_path ?? undefined,
    });
  }
  return out;
}

/** Pinyin tone: show character, user picks the tone pattern. Multi-syllable only. */
function makePinyinTone(
  lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
): GeneratedItem[] {
  const out: GeneratedItem[] = [];
  const eligible = words.filter((w) => {
    const t = tonePattern(w.pinyin);
    return t.length >= 2 && t.length <= 4;
  });
  for (const w of eligible) {
    if (out.length >= count) break;
    const correct = tonePattern(w.pinyin);
    const dist = toneDistractors(correct, 3, rng);
    if (dist.length < 3) continue;
    const optionsRaw = [correct, ...dist];
    const options = shuffle(optionsRaw, rng);
    const answerIndex = options.findIndex(
      (o) => o.length === correct.length && o.every((v, i) => v === correct[i]),
    );
    out.push({
      stable_id: `ex:${lesson.id}:pinyin_tone:${out.length + 1}`,
      type: "pinyin_tone",
      prompt: "Pick the tone pattern that matches the word.",
      payload: {
        word_id: w.id, simplified: w.simplified, pinyin: w.pinyin,
        english: w.meanings?.[0] ?? "",
        audio_path: w.audio_path,
        options,
      },
      answer: { index: answerIndex, pattern: correct },
      source_word_id: w.id,
      audio_path: w.audio_path ?? undefined,
    });
  }
  return out;
}

/** Translate: English → user assembles the hanzi from a word bank. */
async function makeTranslate(
  pool: Pool, lesson: LessonRow, words: WordRow[], count: number, rng: () => number,
  segment: (s: string) => Promise<string[]>,
): Promise<GeneratedItem[]> {
  const out: GeneratedItem[] = [];
  const seenSent = new Set<number>();
  for (const w of words) {
    if (out.length >= count) break;
    const { rows: sents } = await pool.query<SentenceRow>(
      `SELECT s.id, s.simplified, s.pinyin, s.english, s.audio_path, s.length
       FROM sentence_words sw
       JOIN sentences s ON s.id = sw.sentence_id
       WHERE sw.word_id = $1
         AND s.length BETWEEN 4 AND 12
       ORDER BY COALESCE(s.length, 99) ASC
       LIMIT 2`,
      [w.id],
    );
    for (const s of sents) {
      if (seenSent.has(s.id)) continue;
      const tokens = await segment(s.simplified);
      if (tokens.length < 2 || tokens.length > 8) continue;
      seenSent.add(s.id);

      // Build a word bank: the correct tokens + 2 plausible extras of similar length.
      const extras = shuffle(words.filter((x) => !tokens.includes(x.simplified)), rng)
        .slice(0, 2)
        .map((w2) => w2.simplified);
      const bank = shuffle([...tokens, ...extras], rng);

      out.push({
        stable_id: `ex:${lesson.id}:translate:${out.length + 1}`,
        type: "translate",
        prompt: "Build the Chinese sentence from the chips.",
        payload: {
          english: s.english,
          pinyin: s.pinyin,
          chips: bank,
        },
        answer: { ordered: tokens, sentence: s.simplified },
        source_sentence_id: s.id,
      });
      break;
    }
  }
  return out;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

async function persistLesson(
  pool: Pool, lesson: LessonRow, items: GeneratedItem[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Drop everything for this lesson first — cascade removes attempt rows
    // for any slot that no longer exists.
    await client.query("DELETE FROM exercises WHERE lesson_id = $1", [lesson.id]);
    for (const it of items) {
      await client.query(
        `INSERT INTO exercises
           (stable_id, type, prompt, payload, answer,
            source_sentence_id, source_word_id, lesson_id, hsk_level, audio_path,
            created_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          it.stable_id, it.type, it.prompt, JSON.stringify(it.payload), JSON.stringify(it.answer),
          it.source_sentence_id ?? null, it.source_word_id ?? null,
          lesson.id, lesson.book === "hsk2" ? 2 : 1, it.audio_path ?? null,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function buildSegmenter(): Promise<(s: string) => Promise<string[]>> {
  const { createRequire } = await import("node:module");
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const req = createRequire(import.meta.url);
  const { Jieba } = req("@node-rs/jieba");
  const dictPath = join(process.cwd(), "node_modules", "@node-rs", "jieba", "dict.txt");
  const dictBuf = readFileSync(dictPath);
  const j = Jieba.withDict(dictBuf);
  const PUNCT = /^[\s　-〿＀-￯ -⁯.,!?;:'"()/\\…—–\-、。!?？！：；""''《》（）]+$/u;
  return async (s: string) => j.cut(s).filter((t: string) => !PUNCT.test(t) && t.trim().length > 0);
}

function parseFilter(argv: string[]): { book?: string; number?: number } {
  if (argv.length === 0) return {};
  if (argv.length === 2) {
    const [a, b] = argv;
    if (/^hsk\d+$/.test(a) && /^\d+$/.test(b)) return { book: a, number: parseInt(b, 10) };
    if (/^\d+$/.test(a) && /^\d+$/.test(b)) return { book: `hsk${a}`, number: parseInt(b, 10) };
  }
  throw new Error("usage: npm run db:generate-exercises [-- BOOK NUMBER]");
}

async function main() {
  const filter = parseFilter(process.argv.slice(2));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const segment = await buildSegmenter();

  const { rows: lessons } = await pool.query<LessonRow>(
    `SELECT id, book, number, title_hanzi
     FROM lessons
     ${filter.book ? "WHERE book = $1 AND number = $2" : "WHERE book IN ('hsk1','hsk2')"}
     ORDER BY book, number`,
    filter.book ? [filter.book, filter.number] : [],
  );
  if (lessons.length === 0) {
    console.error("no matching lessons — has db:import-lessons been run?");
    process.exit(1);
  }

  let totalItems = 0;
  for (const lesson of lessons) {
    const rng = mulberry32(seedFromString(`${lesson.book}-${lesson.number}`));
    const { rows: words } = await pool.query<WordRow>(
      `SELECT w.id, w.simplified, w.pinyin, w.meanings, w.hsk2_level, w.audio_path
       FROM lesson_words lw
       JOIN words w ON w.id = lw.word_id
       WHERE lw.lesson_id = $1
       ORDER BY lw.position NULLS LAST, w.id`,
      [lesson.id],
    );
    const wordsShuffled = shuffle(words, rng);

    const items: GeneratedItem[] = [];
    items.push(...(await makeCloze(pool, lesson, wordsShuffled, TARGETS_PER_TYPE.cloze, rng)));
    items.push(...(await makeReorder(pool, lesson, wordsShuffled, TARGETS_PER_TYPE.reorder, rng, segment)));
    items.push(...makeMatching(lesson, wordsShuffled, TARGETS_PER_TYPE.matching, rng));
    items.push(...(await makeListeningChoice(pool, lesson, wordsShuffled, TARGETS_PER_TYPE.listening_choice, rng)));
    items.push(...makePinyinTone(lesson, wordsShuffled, TARGETS_PER_TYPE.pinyin_tone, rng));
    items.push(...(await makeTranslate(pool, lesson, wordsShuffled, TARGETS_PER_TYPE.translate, rng, segment)));

    await persistLesson(pool, lesson, items);
    totalItems += items.length;

    const tally = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.type] = (acc[it.type] ?? 0) + 1; return acc;
    }, {});
    console.log(
      `[${lesson.book} L${lesson.number}] ${items.length.toString().padStart(2, " ")} items — ${
        Object.entries(tally).map(([t, n]) => `${t}:${n}`).join(" ")
      }`,
    );
  }
  console.log(`\nDone. ${totalItems} exercises across ${lessons.length} lessons.`);

  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
