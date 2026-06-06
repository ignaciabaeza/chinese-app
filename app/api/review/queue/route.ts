import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  ensureSeededAll,
  getDueQueue,
  getReviewStats,
  type CardType,
} from "@/lib/fsrs";

const ALLOWED_TYPES: CardType[] = ["recognition", "listening"];

/**
 * GET /api/review/queue?type=recognition&limit=30
 *
 * Returns up to `limit` cards ready to study now for the requested card type,
 * plus an aggregate stats block. Every call re-seeds both recognition and
 * listening cards (idempotent via ON CONFLICT) so audio added later wires up
 * listening cards retroactively.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const requested = (url.searchParams.get("type") ?? "recognition") as CardType;
  const cardType: CardType = ALLOWED_TYPES.includes(requested) ? requested : "recognition";
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const newPerDay = Math.max(0, Math.min(100, parseInt(url.searchParams.get("newPerDay") ?? "15", 10) || 15));

  const seededByType = await ensureSeededAll(auth.userId);
  const [queue, stats] = await Promise.all([
    getDueQueue(auth.userId, { cardType, limit, newPerDay }),
    getReviewStats(auth.userId, cardType),
  ]);

  // Back-compat: legacy callers read `seeded` as a total count.
  const seeded = seededByType.recognition + seededByType.listening;

  return NextResponse.json({ queue, stats, seeded, seededByType, cardType });
}
