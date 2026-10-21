// Server-only FSRS card scheduler + queue helpers built on `ts-fsrs`.
// Do not import into client components.

import "server-only";
import { fsrs, createEmptyCard, type Card, type RecordLogItem, type Grade } from "ts-fsrs";
import { pool } from "@/lib/db";
import { getUserDay } from "@/lib/user-time";

const scheduler = fsrs();

export type CardType = "recognition" | "recall" | "listening" | "writing" | "cloze";
export type GradeRating = 1 | 2 | 3 | 4;
export type CardState = 0 | 1 | 2 | 3; // new | learning | review | relearning

/** A card joined with its underlying word for review display. */
export interface ReviewCard {
  id: number;
  word_id: number;
  card_type: CardType;
  due: string;
  state: CardState;
  reps: number;
  lapses: number;

  // FSRS state (may be null for fresh cards)
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  last_review: string | null;

  // Joined word fields
  simplified: string;
  traditional: string | null;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
  audio_path: string | null;
}

/** Reconstruct a ts-fsrs Card from DB columns. */
function dbToCard(row: {
  due: string;
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
}): Card {
  return {
    due: new Date(row.due),
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Create one card per HSK 1–2 word for the requested type. Always runs the
 * INSERT and leans on ON CONFLICT — that way listening cards get created
 * retroactively for words whose audio_path was populated after the first
 * seed. New cards default to state=0 due=now.
 *
 * Listening seeding is gated on audio_path IS NOT NULL so we don't queue
 * cards that can't actually be reviewed.
 */
export async function ensureSeeded(
  userId: string,
  cardType: CardType = "recognition",
): Promise<number> {
  const where =
    cardType === "listening"
      ? "hsk2_level IN (1, 2) AND audio_path IS NOT NULL"
      : "hsk2_level IN (1, 2)";
  const result = await pool.query(
    `INSERT INTO cards (user_id, word_id, card_type, due)
     SELECT $1, id, $2, NOW()
     FROM words
     WHERE ${where}
     ON CONFLICT DO NOTHING`,
    [userId, cardType],
  );
  return result.rowCount ?? 0;
}

/**
 * Seed every modality the app currently supports — recognition, listening
 * and writing. Returns per-type insert counts. Called on every /review
 * queue fetch so new audio + new words drop in retroactively.
 */
export async function ensureSeededAll(
  userId: string,
): Promise<{ recognition: number; listening: number; writing: number }> {
  const [recognition, listening, writing] = await Promise.all([
    ensureSeeded(userId, "recognition"),
    ensureSeeded(userId, "listening"),
    ensureSeeded(userId, "writing"),
  ]);
  return { recognition, listening, writing };
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export interface QueueOptions {
  cardType?: CardType;
  newPerDay?: number;
  limit?: number;
  /** Restrict to a specific HSK 2.0 level (1 or 2). Null = all levels. */
  hskLevel?: 1 | 2 | null;
}

/**
 * Build the review queue. Order:
 *   1. learning (state 1, 3) — overdue first
 *   2. review (state 2) — overdue first
 *   3. new (state 0) — up to newPerDay cap, ordered by hsk → frequency
 *
 * Today's already-reviewed new-card count is subtracted from the cap so the
 * user can't blow past the daily new-card quota across multiple sessions.
 */
export async function getDueQueue(
  userId: string,
  { cardType = "recognition", newPerDay = 15, limit = 30, hskLevel = null }: QueueOptions = {},
): Promise<ReviewCard[]> {
  // Count new cards introduced today (first-ever review since the user's
  // local midnight).
  const { todayStart } = await getUserDay(userId);
  const { rows: todayRows } = await pool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM (
       SELECT rl.card_id
       FROM review_log rl
       JOIN cards c ON c.id = rl.card_id
       WHERE c.user_id = $1 AND c.card_type = $2
       GROUP BY rl.card_id
       HAVING MIN(rl.reviewed_at) >= $3
     ) first_today`,
    [userId, cardType, todayStart],
  );
  const reviewedNewToday = todayRows[0]?.n ?? 0;
  const remainingNewSlots = Math.max(0, newPerDay - reviewedNewToday);

  // Listening cards are only playable if the word has audio — exclude any
  // card whose word.audio_path got cleared or was never populated.
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";
  // HSK level filter: pull only words at the requested level. null = all.
  const levelFilter = hskLevel === 1 || hskLevel === 2 ? "AND w.hsk2_level = $5" : "";
  const params: unknown[] = [userId, cardType, remainingNewSlots, limit];
  if (levelFilter) params.push(hskLevel);

  const { rows } = await pool.query<ReviewCard>(
    `WITH due_ranked AS (
       SELECT c.*, w.simplified, w.traditional, w.pinyin, w.meanings,
              w.hsk2_level, w.hsk3_level, w.audio_path,
              CASE
                WHEN c.state IN (1, 3) THEN 0     -- learning / relearning first
                ELSE                        1     -- review second
              END AS bucket,
              ROW_NUMBER() OVER (ORDER BY c.due) AS ord   -- most overdue first
       FROM cards c
       JOIN words w ON w.id = c.word_id
       WHERE c.user_id = $1
         AND c.card_type = $2
         AND (c.state != 0 AND c.due <= NOW())
         ${audioFilter}
         ${levelFilter}
     ),
     new_cards AS (
       SELECT c.*, w.simplified, w.traditional, w.pinyin, w.meanings,
              w.hsk2_level, w.hsk3_level, w.audio_path,
              2 AS bucket,
              ROW_NUMBER() OVER (
                ORDER BY COALESCE(w.hsk2_level, 99),
                         COALESCE(w.frequency_rank, 999999),
                         w.simplified
              ) AS ord
       FROM cards c
       JOIN words w ON w.id = c.word_id
       WHERE c.user_id = $1
         AND c.card_type = $2
         AND c.state = 0
         ${audioFilter}
         ${levelFilter}
       ORDER BY COALESCE(w.hsk2_level, 99),
                COALESCE(w.frequency_rank, 999999),
                w.simplified
       LIMIT $3
     )
     SELECT * FROM due_ranked
     UNION ALL
     SELECT * FROM new_cards
     ORDER BY bucket, ord
     LIMIT $4`,
    params,
  );
  return rows;
}

// ─── Grading ─────────────────────────────────────────────────────────────────

export interface GradeResult {
  cardId: number;
  rating: GradeRating;
  next: {
    due: string;
    state: CardState;
    stability: number | null;
    difficulty: number | null;
    scheduled_days: number;
  };
}

export class CardNotFoundError extends Error {}
/** The same card was graded moments ago — almost certainly a double tap. */
export class DuplicateGradeError extends Error {}

const DUPLICATE_WINDOW_MS = 2000;

/**
 * Apply a rating to a card. Locks the card row, asks FSRS for the next
 * state, persists the new state + a review_log row, and returns the new
 * schedule. Concurrent grades of the same card serialize on the row lock.
 */
export async function gradeCard(
  userId: string,
  cardId: number,
  rating: GradeRating,
  elapsedMs?: number,
): Promise<GradeResult> {
  const client = await pool.connect();
  let nextCard: Card;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, due, stability, difficulty, elapsed_days, scheduled_days,
              learning_steps, reps, lapses, state, last_review
       FROM cards
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [cardId, userId],
    );
    if (rows.length === 0) throw new CardNotFoundError(`card ${cardId} not found`);
    const row = rows[0];

    const now = new Date();
    if (row.last_review && now.getTime() - new Date(row.last_review).getTime() < DUPLICATE_WINDOW_MS) {
      throw new DuplicateGradeError(`card ${cardId} was just graded`);
    }

    const result: RecordLogItem = scheduler.next(dbToCard(row), now, rating as Grade);
    nextCard = result.card;

    await client.query(
      `UPDATE cards
       SET due = $1, stability = $2, difficulty = $3,
           elapsed_days = $4, scheduled_days = $5, learning_steps = $6,
           reps = $7, lapses = $8, state = $9, last_review = $10
       WHERE id = $11 AND user_id = $12`,
      [
        nextCard.due,
        nextCard.stability || null,
        nextCard.difficulty || null,
        nextCard.elapsed_days,
        nextCard.scheduled_days,
        nextCard.learning_steps,
        nextCard.reps,
        nextCard.lapses,
        nextCard.state,
        nextCard.last_review,
        cardId,
        userId,
      ],
    );
    await client.query(
      `INSERT INTO review_log (card_id, rating, reviewed_at, elapsed_ms)
       VALUES ($1, $2, $3, $4)`,
      [cardId, rating, now, elapsedMs ?? null],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    cardId,
    rating,
    next: {
      due: nextCard.due.toISOString(),
      state: nextCard.state as CardState,
      stability: nextCard.stability || null,
      difficulty: nextCard.difficulty || null,
      scheduled_days: nextCard.scheduled_days,
    },
  };
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface ReviewStats {
  due_now: number;        // ready to study right now (state != 0 and due <= now)
  new_total: number;      // never-seen cards available
  learning: number;       // state 1 or 3
  mature: number;         // state 2 with stability >= 21 days
  total_cards: number;
  reviewed_today: number;
}

export async function getReviewStats(
  userId: string,
  cardType: CardType = "recognition",
  hskLevel: 1 | 2 | null = null,
): Promise<ReviewStats> {
  // Need the join when filtering on word-side columns (audio or level).
  const needsWordJoin = cardType === "listening" || hskLevel === 1 || hskLevel === 2;
  const join = needsWordJoin ? "JOIN words w ON w.id = c.word_id" : "";
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";
  const levelFilter = hskLevel === 1 || hskLevel === 2 ? "AND w.hsk2_level = $4" : "";
  const { todayStart } = await getUserDay(userId);
  const params: unknown[] = [userId, cardType, todayStart];
  if (levelFilter) params.push(hskLevel);

  const { rows } = await pool.query<ReviewStats>(
    `SELECT
       COUNT(*) FILTER (WHERE c.state != 0 AND c.due <= NOW())::int        AS due_now,
       COUNT(*) FILTER (WHERE c.state = 0)::int                            AS new_total,
       COUNT(*) FILTER (WHERE c.state IN (1, 3))::int                      AS learning,
       COUNT(*) FILTER (WHERE c.state = 2 AND c.stability >= 21)::int      AS mature,
       COUNT(*)::int                                                       AS total_cards,
       (SELECT COUNT(*)::int FROM review_log rl
          JOIN cards c2 ON c2.id = rl.card_id
          WHERE c2.user_id = $1 AND c2.card_type = $2
            AND rl.reviewed_at >= $3)                                      AS reviewed_today
     FROM cards c
     ${join}
     WHERE c.user_id = $1 AND c.card_type = $2
       ${audioFilter}
       ${levelFilter}`,
    params,
  );
  return rows[0] ?? { due_now: 0, new_total: 0, learning: 0, mature: 0, total_cards: 0, reviewed_today: 0 };
}

// Avoid unused-warning when only re-exporting.
void createEmptyCard;
