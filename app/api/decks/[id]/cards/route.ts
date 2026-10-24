import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  addCard, MAX_CARDS_PER_DECK, MAX_CUSTOM_HANZI, MAX_CUSTOM_MEANING, MAX_CUSTOM_PINYIN,
  type AddCardInput,
} from "@/lib/decks";

/**
 * POST /api/decks/[id]/cards
 *   body: { wordId: number }                                 dictionary word
 *      or { simplified: string, pinyin?: string, meaning: string }  custom word
 * → { card: DeckCard }. 409 if the word is already in the deck or the deck is full.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  let body: { wordId?: unknown; simplified?: unknown; pinyin?: unknown; meaning?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  let input: AddCardInput;
  if (body.wordId !== undefined) {
    if (typeof body.wordId !== "number" || !Number.isInteger(body.wordId)) {
      return NextResponse.json({ error: "wordId must be an integer" }, { status: 400 });
    }
    input = { wordId: body.wordId };
  } else {
    const simplified = typeof body.simplified === "string" ? body.simplified.trim() : "";
    const pinyin = typeof body.pinyin === "string" ? body.pinyin.trim() : "";
    const meaning = typeof body.meaning === "string" ? body.meaning.trim() : "";
    if (!simplified || !meaning) {
      return NextResponse.json({ error: "A custom word needs the characters and a meaning." }, { status: 400 });
    }
    if (simplified.length > MAX_CUSTOM_HANZI || pinyin.length > MAX_CUSTOM_PINYIN || meaning.length > MAX_CUSTOM_MEANING) {
      return NextResponse.json({ error: "That word is too long." }, { status: 400 });
    }
    input = { simplified, pinyin, meaning };
  }

  const result = await addCard(auth.userId, Number(id), input);
  if (result.ok) return NextResponse.json({ card: result.card });
  switch (result.reason) {
    case "not_found":    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    case "unknown_word": return NextResponse.json({ error: "Word not found" }, { status: 400 });
    case "duplicate":    return NextResponse.json({ error: "That word is already in this deck." }, { status: 409 });
    case "full":         return NextResponse.json({ error: `A deck can hold up to ${MAX_CARDS_PER_DECK} words.` }, { status: 409 });
  }
}
