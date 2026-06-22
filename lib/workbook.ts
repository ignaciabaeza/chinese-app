// Server-only helpers for /workbook. Reads from the exercises +
// exercise_attempts tables created by migration 007 and populated by
// scripts/06-generate-exercises.ts.

import "server-only";
import { pool } from "@/lib/db";

export type ExerciseType =
  | "cloze"
  | "reorder"
  | "matching"
  | "listening_choice"
  | "pinyin_tone"
  | "translate"
  | "dictation";

export interface Exercise {
  id: number;
  stable_id: string;
  type: ExerciseType;
  prompt: string;
  payload: unknown;
  answer: unknown;
  audio_path: string | null;
  source_sentence_id: number | null;
  source_word_id: number | null;
  hsk_level: number | null;
}

export interface ExerciseSetSummary {
  lesson_id: number;
  book: string;
  number: number;
  title_hanzi: string;
  title_english: string | null;
  item_count: number;
  type_counts: Record<string, number>;
  /** Most recent attempt timestamp across all items in this set, for this user. */
  last_attempted: string | null;
  /** Across attempts in the last 30 days (this user, this set). */
  recent_attempts: number;
  recent_correct: number;
}

/** List exercise sets (one per authored lesson with generated items). */
export async function listExerciseSets(userId: string | null): Promise<ExerciseSetSummary[]> {
  const { rows } = await pool.query<{
    lesson_id: number; book: string; number: number;
    title_hanzi: string; title_english: string | null;
    item_count: number; type_counts: Record<string, number>;
    last_attempted: string | null;
    recent_attempts: number; recent_correct: number;
  }>(
    `WITH per_lesson AS (
       SELECT l.id AS lesson_id, l.book, l.number, l.title_hanzi, l.title_english,
              COUNT(e.id)::int AS item_count,
              jsonb_object_agg(e.type, t_count) FILTER (WHERE e.id IS NOT NULL) AS type_counts
       FROM lessons l
       LEFT JOIN exercises e ON e.lesson_id = l.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS t_count
         FROM exercises e2
         WHERE e2.lesson_id = l.id AND e2.type = e.type
       ) ON TRUE
       GROUP BY l.id
     ),
     attempts AS (
       SELECT e.lesson_id,
              MAX(a.attempted_at) AS last_attempted,
              COUNT(*) FILTER (WHERE a.attempted_at > NOW() - INTERVAL '30 days')::int AS recent_attempts,
              COUNT(*) FILTER (WHERE a.attempted_at > NOW() - INTERVAL '30 days' AND a.correct)::int AS recent_correct
       FROM exercise_attempts a
       JOIN exercises e ON e.id = a.exercise_id
       WHERE $1::text IS NOT NULL AND a.user_id = $1
       GROUP BY e.lesson_id
     )
     SELECT pl.lesson_id, pl.book, pl.number, pl.title_hanzi, pl.title_english,
            pl.item_count,
            COALESCE(pl.type_counts, '{}'::jsonb) AS type_counts,
            at.last_attempted,
            COALESCE(at.recent_attempts, 0) AS recent_attempts,
            COALESCE(at.recent_correct, 0) AS recent_correct
     FROM per_lesson pl
     LEFT JOIN attempts at ON at.lesson_id = pl.lesson_id
     WHERE pl.item_count > 0
     ORDER BY pl.book, pl.number`,
    [userId],
  );
  return rows.map((r) => ({
    lesson_id: r.lesson_id,
    book: r.book,
    number: r.number,
    title_hanzi: r.title_hanzi,
    title_english: r.title_english,
    item_count: r.item_count,
    type_counts: r.type_counts ?? {},
    last_attempted: r.last_attempted,
    recent_attempts: r.recent_attempts,
    recent_correct: r.recent_correct,
  }));
}

export interface ExerciseSet {
  lesson: { id: number; book: string; number: number; title_hanzi: string; title_english: string | null };
  exercises: Exercise[];
}

export async function getExerciseSet(book: string, number: number): Promise<ExerciseSet | null> {
  const { rows: lessonRows } = await pool.query<{
    id: number; book: string; number: number; title_hanzi: string; title_english: string | null;
  }>(
    "SELECT id, book, number, title_hanzi, title_english FROM lessons WHERE book = $1 AND number = $2",
    [book, number],
  );
  const lesson = lessonRows[0];
  if (!lesson) return null;

  const { rows } = await pool.query<{
    id: number; stable_id: string; type: ExerciseType; prompt: string;
    payload: unknown; answer: unknown; audio_path: string | null;
    source_sentence_id: number | null; source_word_id: number | null; hsk_level: number | null;
  }>(
    `SELECT id, stable_id, type, prompt, payload, answer, audio_path,
            source_sentence_id, source_word_id, hsk_level
     FROM exercises
     WHERE lesson_id = $1
     ORDER BY type, id`,
    [lesson.id],
  );
  if (rows.length === 0) return null;
  return { lesson, exercises: rows };
}

export async function recordAttempt(
  userId: string, exerciseId: number, correct: boolean, userAnswer: unknown,
): Promise<void> {
  await pool.query(
    `INSERT INTO exercise_attempts (exercise_id, user_id, correct, user_answer)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [exerciseId, userId, correct, JSON.stringify(userAnswer ?? null)],
  );
}
