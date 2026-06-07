import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  ensureSeededAll,
  getDueQueue,
  getReviewStats,
  type CardType,
} from "@/lib/fsrs";

const ALLOWED_TYPES: CardType[] = ["recognition", "listening", "writing"];

/**
 * GET /api/review/queue?type=recognition&limit=30&level=1
 *
 * Returns up to `limit` cards ready to study now for the requested card type,
 * optionally filtered to a single HSK 2.0 level. Every call re-seeds all
 * supported card types (recognition + listening + writing) idempotently so
 * audio added later wires up listening cards retroactively and any added
 * words get all three modalities.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const requested = (url.searchParams.get("type") ?? "recognition") as CardType;
  const cardType: CardType = ALLOWED_TYPES.includes(requested) ? requested : "recognition";
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const newPerDay = Math.max(0, Math.min(100, parseInt(url.searchParams.get("newPerDay") ?? "15", 10) || 15));
  const levelParam = url.searchParams.get("level");
  const hskLevel: 1 | 2 | null = levelParam === "1" ? 1 : levelParam === "2" ? 2 : null;

  const seededByType = await ensureSeededAll(auth.userId);
  const [queue, stats] = await Promise.all([
    getDueQueue(auth.userId, { cardType, limit, newPerDay, hskLevel }),
    getReviewStats(auth.userId, cardType, hskLevel),
  ]);

  const seeded = seededByType.recognition + seededByType.listening + seededByType.writing;

  return NextResponse.json({ queue, stats, seeded, seededByType, cardType, hskLevel });
}
