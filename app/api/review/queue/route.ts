import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { ensureSeeded, getDueQueue, getReviewStats, type CardType } from "@/lib/fsrs";

/**
 * GET /api/review/queue?type=recognition&limit=30
 *
 * Returns up to `limit` cards ready to study now (learning → review → new),
 * plus an aggregate stats block. On the user's first call this also seeds
 * one card per HSK 1–2 word.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const cardType = (url.searchParams.get("type") ?? "recognition") as CardType;
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const newPerDay = Math.max(0, Math.min(100, parseInt(url.searchParams.get("newPerDay") ?? "15", 10) || 15));

  const seeded = await ensureSeeded(auth.userId, cardType);
  const [queue, stats] = await Promise.all([
    getDueQueue(auth.userId, { cardType, limit, newPerDay }),
    getReviewStats(auth.userId, cardType),
  ]);

  return NextResponse.json({ queue, stats, seeded, cardType });
}
