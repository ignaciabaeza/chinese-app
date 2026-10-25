import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import { pickDictationSentence } from "@/lib/listening";

/**
 * GET /api/listening/dictation/next?exclude=123&deck=12
 * A random sentence with audio for dictation: HSK 1–2, or one that uses a
 * word from one of the signed-in user's decks.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeId = excludeParam ? parseInt(excludeParam, 10) : undefined;
  const deckParam = url.searchParams.get("deck");
  let deckId: number | null = null;
  if (deckParam) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Sign in to study your decks." }, { status: 401 });
    const deck = /^\d{1,9}$/.test(deckParam) ? await getDeck(auth.userId, Number(deckParam)) : null;
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    deckId = deck.id;
  }
  const sentence = await pickDictationSentence(excludeId, deckId);
  if (!sentence) {
    return NextResponse.json(
      { error: deckId ? "No sentences with audio use this deck's words yet." : "No audio sentences available" },
      { status: 404 },
    );
  }
  return NextResponse.json(sentence);
}
