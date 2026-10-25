import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import { pickToneWord } from "@/lib/listening";

/**
 * GET /api/listening/tones/next?exclude=42&deck=12
 * A word with audio plus four tone-pattern options (correct + 3 distractors,
 * shuffled): a multi-syllable HSK 1–2 word, or a word from one of the
 * signed-in user's decks. Words whose listening card is due come first.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeId = excludeParam ? parseInt(excludeParam, 10) : undefined;
  const auth = getAuthFromRequest(request);
  const deckParam = url.searchParams.get("deck");
  let deckId: number | null = null;
  if (deckParam) {
    if (!auth) return NextResponse.json({ error: "Sign in to study your decks." }, { status: 401 });
    const deck = /^\d{1,9}$/.test(deckParam) ? await getDeck(auth.userId, Number(deckParam)) : null;
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    deckId = deck.id;
  }
  const drill = await pickToneWord(excludeId, { userId: auth?.userId ?? null, deckId });
  if (!drill) {
    return NextResponse.json(
      { error: deckId ? "None of this deck's words have audio yet." : "No words available" },
      { status: 404 },
    );
  }
  return NextResponse.json(drill);
}
