import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

// GET /api/progress — fetch all card progress for current user
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.cardProgress.findMany({
    where: { userId: auth.userId },
  });

  // Convert BigInt fields to Number for JSON serialization
  const progress: Record<string, object> = {};
  for (const row of rows) {
    progress[row.wordId] = {
      wordId: row.wordId,
      easeFactor: row.easeFactor,
      interval: row.interval,
      repetitions: row.repetitions,
      nextReview: Number(row.nextReview),
      lastReview: Number(row.lastReview),
      correct: row.correct,
      incorrect: row.incorrect,
    };
  }

  return NextResponse.json({ progress });
}

// POST /api/progress — bulk upsert card progress (full sync)
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

  // Upsert all records in a transaction
  await prisma.$transaction(
    entries.map((entry) =>
      prisma.cardProgress.upsert({
        where: { userId_wordId: { userId: auth.userId, wordId: entry.wordId } },
        create: {
          userId: auth.userId,
          wordId: entry.wordId,
          easeFactor: entry.easeFactor,
          interval: entry.interval,
          repetitions: entry.repetitions,
          nextReview: BigInt(entry.nextReview),
          lastReview: BigInt(entry.lastReview),
          correct: entry.correct,
          incorrect: entry.incorrect,
        },
        update: {
          easeFactor: entry.easeFactor,
          interval: entry.interval,
          repetitions: entry.repetitions,
          nextReview: BigInt(entry.nextReview),
          lastReview: BigInt(entry.lastReview),
          correct: entry.correct,
          incorrect: entry.incorrect,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, synced: entries.length });
}
