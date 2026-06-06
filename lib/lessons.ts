// Server-only helpers for the section-5.9 course module. Reads from the
// new lessons / lesson_dialogues / dialogue_lines / lesson_words tables
// populated by scripts/05-import-book-content.ts. Grammar is still read
// from authored JSON via lib/grammar.ts since there's no grammar_points
// DB table.

import "server-only";
import { pool } from "@/lib/db";
import { getAllGrammar } from "@/lib/content";
import type { HSKLevel, GrammarPoint } from "@/lib/types";

export type StepKey = "listen" | "read" | "vocab" | "grammar" | "done";

export const STEP_ORDER: StepKey[] = ["listen", "read", "vocab", "grammar", "done"];

export interface LessonRow {
  id: number;
  book: string;
  number: number;
  title_hanzi: string;
  title_english: string | null;
  theme: string | null;
}

export interface DialogueLine {
  id: number;
  position: number;
  speaker: string | null;
  simplified: string;
  pinyin: string | null;
  english: string | null;
  audio_path: string | null;
}

export interface Dialogue {
  id: number;
  position: number;
  title_hanzi: string | null;
  title_english: string | null;
  lines: DialogueLine[];
}

export interface LessonWord {
  word_id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  audio_path: string | null;
  /** Card state for this user, or 'unseen' if not in deck. */
  state: "unseen" | "new" | "learning" | "review" | "mature";
}

export interface LessonGrammar {
  gpId: string;        // composite "hskN-lM-..."
  title_hanzi: string;
  title_english: string;
  pattern: string | null;
  point: GrammarPoint;
}

export interface LessonDetail {
  lesson: LessonRow;
  dialogues: Dialogue[];
  words: LessonWord[];
  grammar: LessonGrammar[];
  prev: { level: number; number: number; title: string } | null;
  next: { level: number; number: number; title: string } | null;
}

export interface LessonProgress {
  steps_completed: StepKey[];
  last_studied: string | null;
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export async function getLessonRow(level: HSKLevel, number: number): Promise<LessonRow | null> {
  const { rows } = await pool.query<LessonRow>(
    "SELECT id, book, number, title_hanzi, title_english, theme FROM lessons WHERE book = $1 AND number = $2",
    [`hsk${level}`, number],
  );
  return rows[0] ?? null;
}

export async function getLessonDetail(
  level: HSKLevel,
  number: number,
  userId: string | null,
): Promise<LessonDetail | null> {
  const lesson = await getLessonRow(level, number);
  if (!lesson) return null;

  // Pull dialogues + lines in two queries.
  const { rows: dialogueRows } = await pool.query<{
    id: number; position: number; title_hanzi: string | null; title_english: string | null;
  }>(
    "SELECT id, position, title_hanzi, title_english FROM lesson_dialogues WHERE lesson_id = $1 ORDER BY position",
    [lesson.id],
  );
  let lines: DialogueLine[] = [];
  if (dialogueRows.length > 0) {
    const dialogueIds = dialogueRows.map((d) => d.id);
    const { rows } = await pool.query<DialogueLine & { dialogue_id: number }>(
      `SELECT id, dialogue_id, position, speaker, simplified, pinyin, english, audio_path
       FROM dialogue_lines
       WHERE dialogue_id = ANY($1::int[])
       ORDER BY dialogue_id, position`,
      [dialogueIds],
    );
    lines = rows as DialogueLine[];
  }
  const dialogues: Dialogue[] = dialogueRows.map((d) => ({
    id: d.id,
    position: d.position,
    title_hanzi: d.title_hanzi,
    title_english: d.title_english,
    lines: lines.filter((l) => (l as DialogueLine & { dialogue_id: number }).dialogue_id === d.id),
  }));

  // Lesson words + user card state.
  const { rows: wordRows } = await pool.query<{
    word_id: number;
    simplified: string;
    pinyin: string;
    meanings: string[];
    hsk2_level: number | null;
    audio_path: string | null;
    card_state: number | null;
    card_stability: number | null;
  }>(
    `SELECT lw.word_id, w.simplified, w.pinyin, w.meanings, w.hsk2_level, w.audio_path,
            c.state AS card_state, c.stability AS card_stability
     FROM lesson_words lw
     JOIN words w ON w.id = lw.word_id
     LEFT JOIN cards c
       ON c.word_id = w.id
      AND c.card_type = 'recognition'
      AND c.user_id = $2
     WHERE lw.lesson_id = $1
     ORDER BY lw.position NULLS LAST, w.simplified`,
    [lesson.id, userId],
  );
  const words: LessonWord[] = wordRows.map((w) => {
    let state: LessonWord["state"] = "unseen";
    if (w.card_state !== null && w.card_state !== undefined) {
      if (w.card_state === 0) state = "new";
      else if (w.card_state === 1 || w.card_state === 3) state = "learning";
      else if (w.card_state === 2 && (w.card_stability ?? 0) >= 21) state = "mature";
      else state = "review";
    }
    return {
      word_id: w.word_id,
      simplified: w.simplified,
      pinyin: w.pinyin,
      meanings: w.meanings,
      hsk2_level: w.hsk2_level,
      audio_path: w.audio_path,
      state,
    };
  });

  // Grammar — still read from JSON.
  const grammar: LessonGrammar[] = getAllGrammar(level)
    .filter((g) => g.lessonNumber === number)
    .map((g) => ({
      gpId: `hsk${level}-l${number}-${g.id}`,
      title_hanzi: g.title.hanzi,
      title_english: g.title.english,
      pattern: g.patternTable?.columns.join(" + ") ?? null,
      point: g,
    }));

  // Prev/next links (within the same book, by number).
  const { rows: neighbors } = await pool.query<{ number: number; title_hanzi: string }>(
    "SELECT number, title_hanzi FROM lessons WHERE book = $1 ORDER BY number",
    [lesson.book],
  );
  const idx = neighbors.findIndex((n) => n.number === number);
  const prev = idx > 0 ? { level, number: neighbors[idx - 1].number, title: neighbors[idx - 1].title_hanzi } : null;
  const next = idx >= 0 && idx < neighbors.length - 1
    ? { level, number: neighbors[idx + 1].number, title: neighbors[idx + 1].title_hanzi }
    : null;

  return { lesson, dialogues, words, grammar, prev, next };
}

// ─── Progress ────────────────────────────────────────────────────────────────

export async function getLessonProgress(userId: string, lessonId: number): Promise<LessonProgress> {
  const { rows } = await pool.query<{ steps_completed: StepKey[]; last_studied: string | null }>(
    "SELECT steps_completed, last_studied FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2",
    [userId, lessonId],
  );
  if (rows.length === 0) return { steps_completed: [], last_studied: null };
  return { steps_completed: rows[0].steps_completed ?? [], last_studied: rows[0].last_studied };
}

export async function markStepComplete(userId: string, lessonId: number, step: StepKey): Promise<StepKey[]> {
  // jsonb's @> "contains" handles dedup: if the row already has this step,
  // keep steps_completed unchanged; otherwise append it.
  const stepJson = JSON.stringify([step]);
  const { rows } = await pool.query<{ steps_completed: StepKey[] }>(
    `INSERT INTO lesson_progress (user_id, lesson_id, steps_completed, last_studied)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id, lesson_id) DO UPDATE
       SET steps_completed = CASE
             WHEN lesson_progress.steps_completed @> EXCLUDED.steps_completed
               THEN lesson_progress.steps_completed
             ELSE lesson_progress.steps_completed || EXCLUDED.steps_completed
           END,
           last_studied = NOW()
     RETURNING steps_completed`,
    [userId, lessonId, stepJson],
  );
  return rows[0].steps_completed ?? [];
}

/** Add lesson words to the user's recognition deck. Returns rows inserted. */
export async function seedLessonWordsForUser(userId: string, lessonId: number): Promise<number> {
  const { rowCount } = await pool.query(
    `INSERT INTO cards (user_id, word_id, card_type, due)
     SELECT $1, lw.word_id, 'recognition', NOW()
     FROM lesson_words lw
     WHERE lw.lesson_id = $2
     ON CONFLICT (user_id, word_id, card_type) DO NOTHING`,
    [userId, lessonId],
  );
  return rowCount ?? 0;
}
