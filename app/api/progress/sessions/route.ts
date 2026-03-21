import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

// GET /api/progress/sessions — fetch study sessions for current user
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.studySession.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

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

  const created = await prisma.studySession.create({
    data: {
      userId: auth.userId,
      date: session.date,
      cardsStudied: session.cardsStudied,
      correct: session.correct,
      incorrect: session.incorrect,
      level: String(session.level),
    },
  });

  return NextResponse.json({ ok: true, session: created });
}
