// Server-only dashboard aggregation. Builds the snapshot rendered at `/`:
// per-card-type review stats, streak, HSK coverage, and weakest words.

import "server-only";
import { pool } from "@/lib/db";

export interface TypeStats {
  due_now: number;
  new_total: number;
  learning: number;     // state 1 or 3
  review: number;       // state 2 with stability < 21
  mature: number;       // state 2 with stability >= 21
  total: number;
  reviewed_today: number;
}

export interface CoverageBlock {
  mature: number;       // mature recognition cards in this level
  studied: number;      // any recognition card in this level (not state 0)
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
  streak: number;
  reviews_today: number;
  coverage: {
    hsk1: CoverageBlock;
    hsk2: CoverageBlock;
  };
  weakest: WeakestWord[];
}

async function getTypeStats(userId: string, cardType: string): Promise<TypeStats> {
  // Listening cards are tied to audio_path. Recognition cards aren't.
  const join = cardType === "listening" ? "JOIN words w ON w.id = c.word_id" : "";
  const audioFilter = cardType === "listening" ? "AND w.audio_path IS NOT NULL" : "";

  const { rows } = await pool.query<TypeStats>(
    `SELECT
       COUNT(*) FILTER (WHERE c.state != 0 AND c.due <= NOW())::int                AS due_now,
       COUNT(*) FILTER (WHERE c.state = 0)::int                                    AS new_total,
       COUNT(*) FILTER (WHERE c.state IN (1, 3))::int                              AS learning,
       COUNT(*) FILTER (WHERE c.state = 2 AND c.stability < 21)::int               AS review,
       COUNT(*) FILTER (WHERE c.state = 2 AND c.stability >= 21)::int              AS mature,
       COUNT(*)::int                                                               AS total,
       (SELECT COUNT(*)::int FROM review_log rl
          JOIN cards c2 ON c2.id = rl.card_id
          WHERE c2.user_id = $1 AND c2.card_type = $2
            AND rl.reviewed_at >= date_trunc('day', NOW()))                        AS reviewed_today
     FROM cards c
     ${join}
     WHERE c.user_id = $1 AND c.card_type = $2
       ${audioFilter}`,
    [userId, cardType],
  );
  return rows[0] ?? {
    due_now: 0, new_total: 0, learning: 0, review: 0, mature: 0, total: 0, reviewed_today: 0,
  };
}

/** Consecutive days ending today with at least one review_log entry. */
async function getStreak(userId: string): Promise<number> {
  const { rows } = await pool.query<{ d: string }>(
    `SELECT DISTINCT DATE(rl.reviewed_at AT TIME ZONE 'UTC')::text AS d
     FROM review_log rl
     JOIN cards c ON c.id = rl.card_id
     WHERE c.user_id = $1
     ORDER BY d DESC
     LIMIT 365`,
    [userId],
  );
  if (rows.length === 0) return 0;
  // Walk back from today (UTC) one day at a time, counting consecutive days.
  const days = new Set(rows.map((r) => r.d));
  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (days.has(iso)) streak++;
    else break;
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
       COUNT(*) FILTER (WHERE c.state = 2 AND c.stability >= 21)::int AS mature,
       COUNT(*) FILTER (WHERE c.state IS NOT NULL AND c.state != 0)::int AS studied,
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
  const [recognition, listening, streak, coverage, weakest] = await Promise.all([
    getTypeStats(userId, "recognition"),
    getTypeStats(userId, "listening"),
    getStreak(userId),
    getCoverage(userId),
    getWeakest(userId),
  ]);
  const reviews_today = recognition.reviewed_today + listening.reviewed_today;
  return { recognition, listening, streak, reviews_today, coverage, weakest };
}
