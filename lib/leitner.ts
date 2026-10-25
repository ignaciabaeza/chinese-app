// Server-only Leitner scheduler: seeding, queues, grading and stats over
// `cards` + `review_log`. The rules themselves live in lib/leitner-rules.ts.
// Do not import into client components.

import "server-only";
import { pool } from "@/lib/db";
import { getUserDay } from "@/lib/user-time";
import { nextBox, TOP_BOX } from "@/lib/leitner-rules";

export type CardType = "recognition" | "listening" | "writing";
export const CARD_TYPES: CardType[] = ["recognition", "listening", "writing"];

/** A card joined with its word (dictionary word or custom deck word). */
export interface ReviewCard {
  id: number;
  word_id: number | null;
  deck_card_id: number | null;
  card_type: CardType;
  box: number;
  due: string;
  reps: number;
  lapses: number;
  last_review: string | null;

  simplified: string;
  traditional: string | null;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
  audio_path: string | null;
}

/** Which cards a queue or stats call covers. */
export interface Scope {
  cardType: CardType;
  /** Only words at this HSK 2.0 level. */
  hskLevel?: 1 | 2 | null;
  /** Only the words of this user deck (ownership is checked by the caller). */
  deckId?: number | null;
}

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Create the cards of one type for every HSK 1–2 word and every word in the
 * user's decks. Idempotent (ON CONFLICT), so it runs on every queue fetch and
 * picks up new words, new audio and new deck entries. Listening cards need
 * audio, so custom deck words get none; writing cards need a Chinese character.
 */
export async function ensureSeeded(userId: string, cardType: CardType): Promise<number> {
  const listening = cardType === "listening";
  const hsk = await pool.query(
    `INSERT INTO cards (user_id, word_id, card_type, due)
     SELECT $1, id, $2, NOW()
     FROM words
     WHERE hsk2_level IN (1, 2) ${listening ? "AND audio_path IS NOT NULL" : ""}
     ON CONFLICT DO NOTHING`,
    [userId, cardType],
  );
  const deckWords = await pool.query(
    `INSERT INTO cards (user_id, word_id, card_type, due)
     SELECT DISTINCT $1, dc.word_id, $2, NOW()
     FROM user_deck_cards dc
     JOIN user_decks d ON d.id = dc.deck_id
     JOIN words w ON w.id = dc.word_id
     WHERE d.user_id = $1 ${listening ? "AND w.audio_path IS NOT NULL" : ""}
     ON CONFLICT DO NOTHING`,
    [userId, cardType],
  );
  let custom = 0;
  if (!listening) {
    const r = await pool.query(
      `INSERT INTO cards (user_id, deck_card_id, card_type, due)
       SELECT $1, dc.id, $2, NOW()
       FROM user_deck_cards dc
       JOIN user_decks d ON d.id = dc.deck_id
       WHERE d.user_id = $1 AND dc.word_id IS NULL
         ${cardType === "writing" ? "AND dc.simplified ~ '[一-鿿]'" : ""}
       ON CONFLICT DO NOTHING`,
      [userId, cardType],
    );
    custom = r.rowCount ?? 0;
  }
  return (hsk.rowCount ?? 0) + (deckWords.rowCount ?? 0) + custom;
}

export async function ensureSeededAll(userId: string): Promise<Record<CardType, number>> {
  const [recognition, listening, writing] = await Promise.all(CARD_TYPES.map((t) => ensureSeeded(userId, t)));
  return { recognition, listening, writing };
}

// ─── Queue ───────────────────────────────────────────────────────────────────

/** FROM/WHERE shared by the queue and the stats. Params: $1 user, $2 type, $3 level, $4 deck. */
const SCOPED_CARDS = `
  FROM cards c
  LEFT JOIN words w ON w.id = c.word_id
  LEFT JOIN user_deck_cards dc ON dc.id = c.deck_card_id
  WHERE c.user_id = $1 AND c.card_type = $2
    AND ($2 <> 'listening' OR w.audio_path IS NOT NULL)
    AND ($3::int IS NULL OR w.hsk2_level = $3)
    AND ($4::int IS NULL
         OR c.word_id IN (SELECT word_id FROM user_deck_cards WHERE deck_id = $4)
         OR c.deck_card_id IN (SELECT id FROM user_deck_cards WHERE deck_id = $4))`;

function scopeParams(userId: string, s: Scope): unknown[] {
  return [userId, s.cardType, s.hskLevel ?? null, s.deckId ?? null];
}

export interface QueueOptions extends Scope {
  /** New cards per local day; ignored for a deck (you picked those words). */
  newPerDay?: number;
  limit?: number;
}

/**
 * Today's queue: due cards (lowest box first, then most overdue), then new
 * cards in HSK → frequency order, up to what's left of the daily new-card
 * quota. In a deck every new card is fair game.
 */
export async function getDueQueue(userId: string, opts: QueueOptions): Promise<ReviewCard[]> {
  const { newPerDay = 15, limit = 30 } = opts;
  let newSlots = limit;
  if (!opts.deckId) {
    const { todayStart } = await getUserDay(userId);
    const { rows } = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM (
         SELECT rl.card_id
         FROM review_log rl
         JOIN cards c ON c.id = rl.card_id
         WHERE c.user_id = $1 AND c.card_type = $2
         GROUP BY rl.card_id
         HAVING MIN(rl.reviewed_at) >= $3
       ) first_today`,
      [userId, opts.cardType, todayStart],
    );
    newSlots = Math.max(0, newPerDay - (rows[0]?.n ?? 0));
  }

  const { rows } = await pool.query<ReviewCard>(
    `WITH scoped AS (
       SELECT c.id, c.word_id, c.deck_card_id, c.card_type, c.box, c.due,
              c.reps, c.lapses, c.last_review,
              COALESCE(w.simplified, dc.simplified) AS simplified,
              w.traditional,
              COALESCE(w.pinyin, dc.pinyin, '') AS pinyin,
              COALESCE(w.meanings, jsonb_build_array(dc.meaning)) AS meanings,
              w.hsk2_level, w.hsk3_level, w.audio_path, w.frequency_rank
       ${SCOPED_CARDS}
     ),
     due_now AS (
       SELECT s.*, 0 AS bucket, ROW_NUMBER() OVER (ORDER BY s.box, s.due) AS ord
       FROM scoped s
       WHERE s.box > 0 AND s.due <= NOW()
     ),
     fresh AS (
       SELECT s.*, 1 AS bucket,
              ROW_NUMBER() OVER (ORDER BY COALESCE(s.hsk2_level, 99),
                                          COALESCE(s.frequency_rank, 999999), s.simplified) AS ord
       FROM scoped s
       WHERE s.box = 0
       ORDER BY COALESCE(s.hsk2_level, 99), COALESCE(s.frequency_rank, 999999), s.simplified
       LIMIT $5
     )
     SELECT id, word_id, deck_card_id, card_type, box, due, reps, lapses, last_review,
            simplified, traditional, pinyin, meanings, hsk2_level, hsk3_level, audio_path
     FROM (SELECT * FROM due_now UNION ALL SELECT * FROM fresh) q
     ORDER BY bucket, ord
     LIMIT $6`,
    [...scopeParams(userId, opts), newSlots, limit],
  );
  return rows;
}

// ─── Grading ─────────────────────────────────────────────────────────────────

export interface GradeResult {
  cardId: number;
  known: boolean;
  /** Box before and after; equal when the card wasn't due yet. */
  from: number;
  to: number;
  moved: boolean;
  due: string;
}

export class CardNotFoundError extends Error {}
/** The same card was graded moments ago — almost certainly a double tap. */
export class DuplicateGradeError extends Error {}

const DUPLICATE_WINDOW_MS = 2000;

/**
 * Apply "Know it" / "Don't know" to a card. Locks the row so concurrent
 * grades serialize, moves it between boxes (lib/leitner-rules.ts), logs the
 * review and returns where it went. Due dates land on the start of a local
 * day (users.timezone), so "due in 2 days" means the day after tomorrow.
 */
export async function gradeCard(
  userId: string,
  cardId: number,
  known: boolean,
  elapsedMs?: number,
): Promise<GradeResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ box: number; is_due: boolean; last_review: Date | null }>(
      `SELECT box, due <= NOW() AS is_due, last_review
       FROM cards WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [cardId, userId],
    );
    const row = rows[0];
    if (!row) throw new CardNotFoundError(`card ${cardId} not found`);
    if (row.last_review && Date.now() - new Date(row.last_review).getTime() < DUPLICATE_WINDOW_MS) {
      throw new DuplicateGradeError(`card ${cardId} was just graded`);
    }

    const move = nextBox(row.box, known, row.is_due);
    const { rows: updated } = move
      ? await client.query<{ due: Date }>(
          `UPDATE cards
           SET box = $3,
               due = CASE WHEN $4::int = 0 THEN NOW() ELSE
                       (date_trunc('day', NOW() AT TIME ZONE u.timezone) + make_interval(days => $4::int))
                         AT TIME ZONE u.timezone
                     END,
               reps = reps + 1,
               lapses = lapses + CASE WHEN $5 AND box >= 2 THEN 1 ELSE 0 END,
               last_review = NOW()
           FROM users u
           WHERE cards.id = $1 AND cards.user_id = $2 AND u.id = cards.user_id
           RETURNING cards.due`,
          [cardId, userId, move.box, move.days, !known],
        )
      : await client.query<{ due: Date }>(
          `UPDATE cards SET reps = reps + 1, last_review = NOW()
           WHERE id = $1 AND user_id = $2
           RETURNING due`,
          [cardId, userId],
        );
    await client.query(
      `INSERT INTO review_log (card_id, rating, reviewed_at, elapsed_ms)
       VALUES ($1, $2, NOW(), $3)`,
      [cardId, known ? 3 : 1, elapsedMs ?? null],
    );
    await client.query("COMMIT");
    return {
      cardId,
      known,
      from: row.box,
      to: move ? move.box : row.box,
      moved: move !== null,
      due: new Date(updated[0].due).toISOString(),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Grade by word instead of card id (flashcards, tone drill): creates the card if needed. */
export type GradeSubject = { wordId: number } | { deckCardId: number };

export async function gradeSubject(
  userId: string,
  subject: GradeSubject,
  cardType: CardType,
  known: boolean,
  elapsedMs?: number,
): Promise<GradeResult> {
  let rows: { id: number }[];
  if ("wordId" in subject) {
    ({ rows } = await pool.query<{ id: number }>(
      `WITH ins AS (
         INSERT INTO cards (user_id, word_id, card_type, due)
         SELECT $1, w.id, $3, NOW() FROM words w WHERE w.id = $2
         ON CONFLICT DO NOTHING
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM cards WHERE user_id = $1 AND word_id = $2 AND card_type = $3`,
      [userId, subject.wordId, cardType],
    ));
  } else {
    ({ rows } = await pool.query<{ id: number }>(
      `WITH ins AS (
         INSERT INTO cards (user_id, deck_card_id, card_type, due)
         SELECT $1, dc.id, $3, NOW()
         FROM user_deck_cards dc JOIN user_decks d ON d.id = dc.deck_id
         WHERE dc.id = $2 AND d.user_id = $1
         ON CONFLICT DO NOTHING
         RETURNING id
       )
       SELECT id FROM ins
       UNION ALL
       SELECT id FROM cards WHERE user_id = $1 AND deck_card_id = $2 AND card_type = $3`,
      [userId, subject.deckCardId, cardType],
    ));
  }
  if (rows.length === 0) throw new CardNotFoundError("word not found");
  return gradeCard(userId, rows[0].id, known, elapsedMs);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface ReviewStats {
  due_now: number;
  new_total: number;
  /** Cards in boxes 1–5 (index 0 = box 1). */
  boxes: number[];
  total_cards: number;
  reviewed_today: number;
}

export async function getReviewStats(userId: string, scope: Scope): Promise<ReviewStats> {
  const { todayStart } = await getUserDay(userId);
  const boxCols = Array.from({ length: TOP_BOX }, (_, i) =>
    `COUNT(*) FILTER (WHERE c.box = ${i + 1})::int AS b${i + 1}`).join(",\n       ");
  const { rows } = await pool.query<Record<string, number>>(
    `SELECT
       COUNT(*) FILTER (WHERE c.box > 0 AND c.due <= NOW())::int AS due_now,
       COUNT(*) FILTER (WHERE c.box = 0)::int AS new_total,
       ${boxCols},
       COUNT(*)::int AS total_cards,
       (SELECT COUNT(*)::int FROM review_log rl
          JOIN cards c2 ON c2.id = rl.card_id
          WHERE c2.user_id = $1 AND c2.card_type = $2
            AND rl.reviewed_at >= $5) AS reviewed_today
     ${SCOPED_CARDS}`,
    [...scopeParams(userId, scope), todayStart],
  );
  const r = rows[0] ?? {};
  return {
    due_now: r.due_now ?? 0,
    new_total: r.new_total ?? 0,
    boxes: Array.from({ length: TOP_BOX }, (_, i) => r[`b${i + 1}`] ?? 0),
    total_cards: r.total_cards ?? 0,
    reviewed_today: r.reviewed_today ?? 0,
  };
}
