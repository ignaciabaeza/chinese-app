import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { randomUUID } from "crypto";
import type { StudySession } from "@/lib/types";

// GET /api/progress/sessions — fetch study sessions for current user
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, date, cards_studied, correct, incorrect, scope, card_type, card_ids, created_at
     FROM study_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 60`,
    [auth.userId]
  );

  const sessions: StudySession[] = rows.map((r) => ({
    date: r.date,
    cardsStudied: r.cards_studied,
    correct: r.correct,
    incorrect: r.incorrect,
    scope: r.scope,
    cardType: r.card_type,
    cardIds: r.card_ids ?? [],
  }));

  return NextResponse.json({ sessions });
}

// POST /api/progress/sessions — save a study session
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session } = (await request.json()) as { session: StudySession };

  if (!session || !session.date || !session.scope) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO study_sessions
      (id, user_id, date, cards_studied, correct, incorrect, scope, card_type, card_ids, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      randomUUID(),
      auth.userId,
      session.date,
      session.cardsStudied,
      session.correct,
      session.incorrect,
      session.scope,
      session.cardType,
      session.cardIds ?? [],
    ]
  );

  return NextResponse.json({ ok: true });
}
