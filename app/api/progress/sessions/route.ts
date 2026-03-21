import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { randomUUID } from "crypto";

// GET /api/progress/sessions — fetch study sessions for current user
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    "SELECT id, date, cards_studied, correct, incorrect, level, created_at FROM study_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
    [auth.userId]
  );

  const sessions = rows.map((r) => ({
    id: r.id,
    date: r.date,
    cardsStudied: r.cards_studied,
    correct: r.correct,
    incorrect: r.incorrect,
    level: r.level,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ sessions });
}

// POST /api/progress/sessions — save a study session
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session } = await request.json() as {
    session: {
      date: string;
      cardsStudied: number;
      correct: number;
      incorrect: number;
      level: string;
    };
  };

  if (!session || !session.date) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { rows } = await pool.query(
    "INSERT INTO study_sessions (id, user_id, date, cards_studied, correct, incorrect, level, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
    [randomUUID(), auth.userId, session.date, session.cardsStudied, session.correct, session.incorrect, String(session.level)]
  );

  return NextResponse.json({ ok: true, session: rows[0] });
}
