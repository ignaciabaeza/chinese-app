import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { randomUUID } from "crypto";

// GET /api/progress — fetch all card progress for current user
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    "SELECT word_id, ease_factor, interval, repetitions, next_review, last_review, correct, incorrect FROM card_progress WHERE user_id = $1",
    [auth.userId]
  );

  const progress: Record<string, object> = {};
  for (const row of rows) {
    progress[row.word_id] = {
      wordId: row.word_id,
      easeFactor: parseFloat(row.ease_factor),
      interval: row.interval,
      repetitions: row.repetitions,
      nextReview: Number(row.next_review),
      lastReview: Number(row.last_review),
      correct: row.correct,
      incorrect: row.incorrect,
    };
  }

  return NextResponse.json({ progress });
}

// POST /api/progress — bulk upsert card progress
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { progress } = await request.json() as {
    progress: Record<string, {
      wordId: string;
      easeFactor: number;
      interval: number;
      repetitions: number;
      nextReview: number;
      lastReview: number;
      correct: number;
      incorrect: number;
    }>;
  };

  if (!progress || typeof progress !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const entries = Object.values(progress);
  if (entries.length === 0) return NextResponse.json({ ok: true });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const entry of entries) {
      await client.query(
        `INSERT INTO card_progress (id, user_id, word_id, ease_factor, interval, repetitions, next_review, last_review, correct, incorrect, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (user_id, word_id) DO UPDATE SET
           ease_factor = EXCLUDED.ease_factor,
           interval = EXCLUDED.interval,
           repetitions = EXCLUDED.repetitions,
           next_review = EXCLUDED.next_review,
           last_review = EXCLUDED.last_review,
           correct = EXCLUDED.correct,
           incorrect = EXCLUDED.incorrect,
           updated_at = NOW()`,
        [randomUUID(), auth.userId, entry.wordId, entry.easeFactor, entry.interval,
         entry.repetitions, entry.nextReview, entry.lastReview, entry.correct, entry.incorrect]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true, synced: entries.length });
}
