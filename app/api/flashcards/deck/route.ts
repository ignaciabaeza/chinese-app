import { NextRequest, NextResponse } from "next/server";
import { getFlashcardDeck, type DeckLevel, type DeckSize } from "@/lib/flashcards";

/**
 * GET /api/flashcards/deck?level=1&size=10
 *
 *   level = "all" | "1" | "2"   default "all"
 *   size  = "10" | "20" | "all" default "10"
 *
 * Returns a shuffled deck. No auth required — flashcards are stateless.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const levelParam = url.searchParams.get("level") ?? "all";
  const sizeParam = url.searchParams.get("size") ?? "10";

  const level: DeckLevel = levelParam === "1" ? 1 : levelParam === "2" ? 2 : "all";
  const size: DeckSize =
    sizeParam === "all" ? "all"
    : sizeParam === "20" ? 20
    : sizeParam === "10" ? 10
    : Math.max(1, Math.min(500, parseInt(sizeParam, 10) || 10));

  const deck = await getFlashcardDeck(level, size);
  return NextResponse.json({ level, size, deck });
}
