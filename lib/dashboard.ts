// Server-only dashboard aggregation. Builds the snapshot rendered at `/`:
// per-card-type review stats, streak, HSK coverage, and weakest words.

import "server-only";
import { pool } from "@/lib/db";
import { getUserDay, type UserDay } from "@/lib/user-time";
import { TOP_BOX } from "@/lib/leitner-rules";

export interface TypeStats {
  due_now: number;
  new_total: number;    // box 0
  boxes: number[];      // cards in boxes 1–5 (index 0 = box 1)
  total: number;
  reviewed_today: number;
}

export interface CoverageBlock {
  mature: number;       // recognition cards in the top box at this level
  studied: number;      // any recognition card at this level past box 0
  total: number;        // total words at this level in the DB
  pct: number;          // mature / total, rounded
}

export interface WeakestWord {
  word_id: number;
  simplified: string;
  pinyin: string;
  hsk2_level: number | null;
  lapses: number;
  card_type: string;
}

export interface DashboardData {
  recognition: TypeStats;
  listening: TypeStats;
  writing: TypeStats;
  streak: number;
  reviews_today: number;
  coverage: {
    hsk1: CoverageBlock;
    hsk2: CoverageBlock;
  };
  weakest: WeakestWord[];
}

/** "COUNT(*) FILTER (WHERE c.box = 1), …" for boxes 1–5. */
const BOX_COUNTS = Array.from({ length: TOP_BOX }, (_, i) => `COUNT(*) FILTER (WHERE c.box = ${i + 1})`).join(", ");

async function getTypeStats(userId: string, cardType: string, day: UserDay): Promise<TypeStats> {
  // Listening cards are tied to audio_path. Recognition cards aren't.
  const join = cardType === "listening" ? "JOIN words w ON w.id = c.word_id" : "";
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";

  const { rows } = await pool.query<Omit<TypeStats, "boxes"> & { boxes: number[] | null }>(
    `SELECT
       COUNT(*) FILTER (WHERE c.box > 0 AND c.due <= NOW())::int                   AS due_now,
       COUNT(*) FILTER (WHERE c.box = 0)::int                                      AS new_total,
       ARRAY[${BOX_COUNTS}]::int[]                                                 AS boxes,
       COUNT(*)::int                                                               AS total,
       (SELECT COUNT(*)::int FROM review_log rl
          JOIN cards c2 ON c2.id = rl.card_id
          WHERE c2.user_id = $1 AND c2.card_type = $2
            AND rl.reviewed_at >= $3)                                              AS reviewed_today
     FROM cards c
     ${join}
     WHERE c.user_id = $1 AND c.card_type = $2
       ${audioFilter}`,
    [userId, cardType, day.todayStart],
  );
  const r = rows[0];
  return r
    ? { ...r, boxes: r.boxes ?? Array(TOP_BOX).fill(0) }
    : { due_now: 0, new_total: 0, boxes: Array(TOP_BOX).fill(0), total: 0, reviewed_today: 0 };
}

/**
 * Consecutive local days with at least one review. A streak that ran through
 * yesterday is still alive today until the user's local midnight, so the
 * count doesn't drop to 0 every morning before the first review.
 */
async function getStreak(userId: string, day: UserDay): Promise<number> {
  const { rows } = await pool.query<{ d: string }>(
    `SELECT DISTINCT (rl.reviewed_at AT TIME ZONE $2)::date::text AS d
     FROM review_log rl
     JOIN cards c ON c.id = rl.card_id
     WHERE c.user_id = $1
     ORDER BY d DESC
     LIMIT 366`,
    [userId, day.tz],
  );
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.d));
  // Calendar arithmetic on the local date string, done in UTC so DST can't skew it.
  const cursor = new Date(`${day.today}T00:00:00Z`);
  if (!days.has(day.today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function getCoverage(userId: string): Promise<DashboardData["coverage"]> {
  const { rows } = await pool.query<{
    hsk2_level: number;
    mature: number;
    studied: number;
    total: number;
  }>(
    `SELECT
       w.hsk2_level,
       COUNT(*) FILTER (WHERE c.box = ${TOP_BOX})::int AS mature,
       COUNT(*) FILTER (WHERE c.box > 0)::int AS studied,
       COUNT(*)::int AS total
     FROM words w
     LEFT JOIN cards c
       ON c.word_id = w.id
      AND c.user_id = $1
      AND c.card_type = 'recognition'
     WHERE w.hsk2_level IN (1, 2)
     GROUP BY w.hsk2_level`,
    [userId],
  );
  const blank: CoverageBlock = { mature: 0, studied: 0, total: 0, pct: 0 };
  const out = { hsk1: { ...blank }, hsk2: { ...blank } };
  for (const r of rows) {
    const block: CoverageBlock = {
      mature: r.mature,
      studied: r.studied,
      total: r.total,
      pct: r.total > 0 ? Math.round((r.mature / r.total) * 100) : 0,
    };
    if (r.hsk2_level === 1) out.hsk1 = block;
    else if (r.hsk2_level === 2) out.hsk2 = block;
  }
  return out;
}

async function getWeakest(userId: string, limit = 8): Promise<WeakestWord[]> {
  const { rows } = await pool.query<WeakestWord>(
    `SELECT c.word_id, w.simplified, w.pinyin, w.hsk2_level, c.lapses, c.card_type
     FROM cards c
     JOIN words w ON w.id = c.word_id
     WHERE c.user_id = $1 AND c.lapses > 0
     ORDER BY c.lapses DESC, c.reps DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows;
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const day = await getUserDay(userId);
  const [recognition, listening, writing, streak, coverage, weakest] = await Promise.all([
    getTypeStats(userId, "recognition", day),
    getTypeStats(userId, "listening", day),
    getTypeStats(userId, "writing", day),
    getStreak(userId, day),
    getCoverage(userId),
    getWeakest(userId),
  ]);
  const reviews_today = recognition.reviewed_today + listening.reviewed_today + writing.reviewed_today;
  return { recognition, listening, writing, streak, reviews_today, coverage, weakest };
}
