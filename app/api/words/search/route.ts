import { NextRequest, NextResponse } from "next/server";
import { searchWordsForDeck } from "@/lib/decks";

/**
 * GET /api/words/search?q=...
 * Dictionary lookup for the deck editor: hanzi, pinyin (tone marks or
 * numbers) or English. → { results: WordSearchResult[] } (max 20).
 */
export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 50);
  return NextResponse.json({ results: await searchWordsForDeck(q) });
}
