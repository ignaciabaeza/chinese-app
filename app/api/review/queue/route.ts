import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import {
  CARD_TYPES,
  ensureSeededAll,
  getDueQueue,
  getReviewStats,
  type CardType,
} from "@/lib/leitner";

/**
 * GET /api/review/queue?type=recognition&limit=30&level=1&deck=12
 *
 * Up to `limit` cards to study now for one card type, optionally limited to an
 * HSK 2.0 level or to one of the user's decks (deck wins). Every call re-seeds
 * all card types idempotently, so new words, audio and deck entries get cards.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const requested = (url.searchParams.get("type") ?? "recognition") as CardType;
  const cardType: CardType = CARD_TYPES.includes(requested) ? requested : "recognition";
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const newPerDay = Math.max(0, Math.min(100, parseInt(url.searchParams.get("newPerDay") ?? "15", 10) || 15));
  const levelParam = url.searchParams.get("level");
  const deckParam = url.searchParams.get("deck");

  let deck: { id: number; name: string } | null = null;
  if (deckParam) {
    const found = /^\d{1,9}$/.test(deckParam) ? await getDeck(auth.userId, Number(deckParam)) : null;
    if (!found) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    deck = { id: found.id, name: found.name };
  }
  const hskLevel: 1 | 2 | null = deck ? null : levelParam === "1" ? 1 : levelParam === "2" ? 2 : null;
  const scope = { cardType, hskLevel, deckId: deck?.id ?? null };

  const seededByType = await ensureSeededAll(auth.userId);
  const [queue, stats] = await Promise.all([
    getDueQueue(auth.userId, { ...scope, limit, newPerDay }),
    getReviewStats(auth.userId, scope),
  ]);

  const seeded = seededByType.recognition + seededByType.listening + seededByType.writing;
  return NextResponse.json({ queue, stats, seeded, seededByType, cardType, hskLevel, deck });
}
