// Server-only FSRS card scheduler + queue helpers built on `ts-fsrs`.
// Do not import into client components.

import "server-only";
import { fsrs, createEmptyCard, type Card, type RecordLogItem, type Grade } from "ts-fsrs";
import { pool } from "@/lib/db";

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
 * Seed every modality the app currently supports — recognition + listening.
 * Returns per-type insert counts. Called on every /review queue fetch so new
 * audio drops in retroactively.
 */
export async function ensureSeededAll(
  userId: string,
): Promise<{ recognition: number; listening: number }> {
  const [recognition, listening] = await Promise.all([
    ensureSeeded(userId, "recognition"),
    ensureSeeded(userId, "listening"),
  ]);
  return { recognition, listening };
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export interface QueueOptions {
  cardType?: CardType;
  newPerDay?: number;
  limit?: number;
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
  { cardType = "recognition", newPerDay = 15, limit = 30 }: QueueOptions = {},
): Promise<ReviewCard[]> {
  // Count new cards already reviewed today, in local time. We count cards
  // whose state has been moved out of "new" today.
  const { rows: todayRows } = await pool.query<{ n: number }>(
    `SELECT COUNT(DISTINCT rl.card_id)::int AS n
     FROM review_log rl
     JOIN cards c ON c.id = rl.card_id
     WHERE c.user_id = $1
       AND c.card_type = $2
       AND rl.reviewed_at >= date_trunc('day', NOW())
       AND rl.id IN (
         SELECT MIN(id) FROM review_log GROUP BY card_id
       )`,
    [userId, cardType],
  );
  const reviewedNewToday = todayRows[0]?.n ?? 0;
  const remainingNewSlots = Math.max(0, newPerDay - reviewedNewToday);

  // Listening cards are only playable if the word has audio — exclude any
  // card whose word.audio_path got cleared or was never populated.
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";

  const { rows } = await pool.query<ReviewCard>(
    `WITH due_ranked AS (
       SELECT c.*, w.simplified, w.traditional, w.pinyin, w.meanings,
              w.hsk2_level, w.hsk3_level, w.audio_path,
              CASE
                WHEN c.state IN (1, 3) THEN 0     -- learning / relearning first
                WHEN c.state = 2       THEN 1     -- review second
                ELSE                        2     -- new last
              END AS bucket
       FROM cards c
       JOIN words w ON w.id = c.word_id
       WHERE c.user_id = $1
         AND c.card_type = $2
         AND (c.state != 0 AND c.due <= NOW())
         ${audioFilter}
       ORDER BY bucket, c.due
     ),
     new_cards AS (
       SELECT c.*, w.simplified, w.traditional, w.pinyin, w.meanings,
              w.hsk2_level, w.hsk3_level, w.audio_path,
              2 AS bucket
       FROM cards c
       JOIN words w ON w.id = c.word_id
       WHERE c.user_id = $1
         AND c.card_type = $2
         AND c.state = 0
         ${audioFilter}
       ORDER BY COALESCE(w.hsk2_level, 99),
                COALESCE(w.frequency_rank, 999999),
                w.simplified
       LIMIT $3
     )
     SELECT * FROM due_ranked
     UNION ALL
     SELECT * FROM new_cards
     ORDER BY bucket
     LIMIT $4`,
    [userId, cardType, remainingNewSlots, limit],
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

/**
 * Apply a rating to a card. Looks up the card, asks FSRS for the next state,
 * persists the new state + a review_log row, and returns the new schedule.
 */
export async function gradeCard(
  userId: string,
  cardId: number,
  rating: GradeRating,
  elapsedMs?: number,
): Promise<GradeResult> {
  const { rows } = await pool.query(
    `SELECT id, due, stability, difficulty, elapsed_days, scheduled_days,
            learning_steps, reps, lapses, state, last_review
     FROM cards
     WHERE id = $1 AND user_id = $2`,
    [cardId, userId],
  );
  if (rows.length === 0) throw new Error(`card ${cardId} not found for user`);
  const row = rows[0];
  const card = dbToCard(row);

  const now = new Date();
  const result: RecordLogItem = scheduler.next(card, now, rating as Grade);
  const nextCard = result.card;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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

export async function getReviewStats(userId: string, cardType: CardType = "recognition"): Promise<ReviewStats> {
  // For listening, only count cards backed by a word with audio_path.
  const join = cardType === "listening" ? "JOIN words w ON w.id = c.word_id" : "";
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";

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
            AND rl.reviewed_at >= date_trunc('day', NOW()))                AS reviewed_today
     FROM cards c
     ${join}
     WHERE c.user_id = $1 AND c.card_type = $2
       ${audioFilter}`,
    [userId, cardType],
  );
  return rows[0] ?? { due_now: 0, new_total: 0, learning: 0, mature: 0, total_cards: 0, reviewed_today: 0 };
}

// Avoid unused-warning when only re-exporting.
void createEmptyCard;
