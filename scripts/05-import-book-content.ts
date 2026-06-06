/**
 * Imports authored HSK 1+2 lesson content into the database.
 *
 *   npm run db:import-lessons
 *
 * Two outputs:
 * 1. `texts` table — one concatenated lesson per row, used by /reader.
 * 2. `lessons` / `lesson_dialogues` / `dialogue_lines` / `lesson_words` —
 *    structured course tables for the section 5.9 stepper UI.
 *
 * Idempotent: re-running upserts lesson rows by (book, number) and
 * replaces all dependent rows. User-owned `lesson_progress` is preserved
 * because lessons.id is stable across re-imports.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Pool, PoolClient } from "pg";
import { Jieba } from "@node-rs/jieba";
import { loadEnv } from "./lib/env";

loadEnv();

const REPO = process.cwd();
const PUNCT = /^[\s　-〿＀-￯ -⁯.,!?;:'"()/\\…—–\-、。!?？！：；""''《》（）]+$/u;

// ─── Types of the lesson JSON files ─────────────────────────────────────────

interface DialogueLine {
  speaker: string;
  hanzi: string;
  pinyin?: string;
  english?: string;
}

interface NewWord {
  id: string;
  hanzi: string;
  pinyin: string;
  pos?: string;
  english: string;
}

interface LessonText {
  situationNumber: number;
  title?: { hanzi: string; english?: string };
  dialogue: DialogueLine[];
  newWords?: NewWord[];
}

interface Lesson {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  number: number;
  title: { hanzi: string; pinyin?: string; english: string };
  theme?: string;
  texts?: LessonText[];
  stub?: boolean;
}

// ─── Segmenter ───────────────────────────────────────────────────────────────

function makeSegmenter(): Jieba {
  const dictPath = require.resolve("@node-rs/jieba/dict.txt");
  const dictBuf = readFileSync(dictPath);
  return Jieba.withDict(dictBuf);
}

type Segment = { t: string; w?: number; p?: true };

function segmentBody(seg: Jieba, body: string, wordMap: Map<string, number>): Segment[] {
  return seg.cut(body).map((t) => {
    if (PUNCT.test(t)) return { t, p: true } as Segment;
    const id = wordMap.get(t);
    return id ? ({ t, w: id } as Segment) : ({ t } as Segment);
  });
}

// ─── Lesson loader ───────────────────────────────────────────────────────────

function loadLessons(level: 1 | 2): Lesson[] {
  const dir = join(REPO, "data", `hsk${level}`, "lessons");
  if (!existsSync(dir)) return [];
  const out: Lesson[] = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(dir, file), "utf-8")) as Lesson;
      if (!data.stub) out.push(data);
    } catch {
      // skip malformed
    }
  }
  return out;
}

function lessonReaderBody(lesson: Lesson): string {
  // Concatenate dialogues in a readable way:
  //   <situation title>
  //   A: <hanzi>
  //   B: <hanzi>
  //   (blank line between situations)
  const blocks: string[] = [];
  for (const t of lesson.texts ?? []) {
    const header = t.title?.hanzi ?? `情景 ${t.situationNumber}`;
    const lines = t.dialogue.map((d) => `${d.speaker}: ${d.hanzi}`);
    blocks.push([header, ...lines].join("\n"));
  }
  return blocks.join("\n\n");
}

// ─── Course tables (section 5.9) ─────────────────────────────────────────────

/**
 * Upsert the lesson + replace all its child rows. lessons.id stays stable
 * so per-user lesson_progress (FK → lessons.id) is preserved.
 */
async function upsertCourseLesson(
  client: PoolClient,
  level: 1 | 2,
  lesson: Lesson,
  wordMap: Map<string, number>,
): Promise<{ lessonId: number; words: number; lines: number }> {
  const book = `hsk${level}`;
  const { rows: lessonRows } = await client.query<{ id: number }>(
    `INSERT INTO lessons (book, number, title_hanzi, title_english, theme)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (book, number) DO UPDATE
       SET title_hanzi   = EXCLUDED.title_hanzi,
           title_english = EXCLUDED.title_english,
           theme         = EXCLUDED.theme
     RETURNING id`,
    [book, lesson.number, lesson.title.hanzi, lesson.title.english ?? null, lesson.theme ?? null],
  );
  const lessonId = lessonRows[0].id;

  // Wipe content children. CASCADE clears dialogue_lines via lesson_dialogues.
  await client.query("DELETE FROM lesson_dialogues WHERE lesson_id = $1", [lessonId]);
  await client.query("DELETE FROM lesson_words WHERE lesson_id = $1", [lessonId]);

  // Dialogues and lines.
  let lineCount = 0;
  for (const text of lesson.texts ?? []) {
    const { rows: dialogueRows } = await client.query<{ id: number }>(
      `INSERT INTO lesson_dialogues (lesson_id, position, title_hanzi, title_english)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [lessonId, text.situationNumber, text.title?.hanzi ?? null, text.title?.english ?? null],
    );
    const dialogueId = dialogueRows[0].id;
    for (let i = 0; i < text.dialogue.length; i++) {
      const line = text.dialogue[i];
      await client.query(
        `INSERT INTO dialogue_lines (dialogue_id, position, speaker, simplified, pinyin, english)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [dialogueId, i + 1, line.speaker ?? null, line.hanzi, line.pinyin ?? null, line.english ?? null],
      );
      lineCount++;
    }
  }

  // Lesson words — only insert ones we can map back to the master `words`
  // table. Orphans (e.g. proper nouns) are silently skipped; the lesson
  // page will still render them from JSON if needed.
  let wordCount = 0;
  let position = 0;
  const seen = new Set<number>();
  for (const text of lesson.texts ?? []) {
    for (const nw of text.newWords ?? []) {
      const wordId = wordMap.get(nw.hanzi);
      if (!wordId || seen.has(wordId)) continue;
      seen.add(wordId);
      position++;
      await client.query(
        `INSERT INTO lesson_words (lesson_id, word_id, position)
         VALUES ($1, $2, $3)
         ON CONFLICT (lesson_id, word_id) DO NOTHING`,
        [lessonId, wordId, position],
      );
      wordCount++;
    }
  }

  return { lessonId, words: wordCount, lines: lineCount };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (expected in .env)");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Loading word index from DB…");
  const { rows: words } = await pool.query<{ id: number; simplified: string }>(
    "SELECT id, simplified FROM words",
  );
  const wordMap = new Map<string, number>();
  for (const w of words) wordMap.set(w.simplified, w.id);
  console.log(`  ${wordMap.size.toLocaleString()} known words`);

  console.log("Initializing jieba…");
  const seg = makeSegmenter();

  for (const level of [1, 2] as const) {
    const lessons = loadLessons(level);
    if (lessons.length === 0) {
      console.log(`HSK ${level}: no authored lessons found`);
      continue;
    }
    console.log(`HSK ${level}: importing ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}…`);

    for (const lesson of lessons) {
      const title = `HSK ${level} · 第${lesson.number}课 ${lesson.title.hanzi}`;
      const body = lessonReaderBody(lesson);
      if (!body.trim()) {
        console.log(`  - ${title}: empty body, skipped`);
        continue;
      }

      // ── Reader text (Phase 5 behavior, unchanged) ────────────────────────
      const segments = segmentBody(seg, body, wordMap);
      const source = `hsk${level}-book`;
      // Delete-then-insert so re-runs don't accumulate duplicates.
      await pool.query("DELETE FROM texts WHERE source = $1 AND title = $2 AND user_id IS NULL", [source, title]);
      await pool.query(
        `INSERT INTO texts (title, body, hsk_level, source, segments)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [title, body, level, source, JSON.stringify(segments)],
      );

      // ── Course tables (section 5.9) ──────────────────────────────────────
      const client = await pool.connect();
      let courseResult;
      try {
        await client.query("BEGIN");
        courseResult = await upsertCourseLesson(client, level, lesson, wordMap);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      console.log(
        `  + ${title}  (text: ${body.length}c/${segments.length}seg · course: ${courseResult.lines} lines, ${courseResult.words} words)`,
      );
    }
  }

  const { rows: textSummary } = await pool.query<{ source: string; n: number }>(
    "SELECT source, COUNT(*)::int AS n FROM texts WHERE user_id IS NULL GROUP BY source ORDER BY source",
  );
  console.log("\nReader texts (shared):");
  console.table(textSummary);

  const { rows: courseSummary } = await pool.query<{ book: string; lessons: number; lines: number; words: number }>(
    `SELECT
       l.book,
       COUNT(DISTINCT l.id)::int                          AS lessons,
       COUNT(DISTINCT dl.id)::int                         AS lines,
       (SELECT COUNT(*) FROM lesson_words lw WHERE lw.lesson_id IN (SELECT id FROM lessons l2 WHERE l2.book = l.book))::int AS words
     FROM lessons l
     LEFT JOIN lesson_dialogues d ON d.lesson_id = l.id
     LEFT JOIN dialogue_lines dl  ON dl.dialogue_id = d.id
     GROUP BY l.book
     ORDER BY l.book`,
  );
  console.log("\nCourse tables:");
  console.table(courseSummary);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
