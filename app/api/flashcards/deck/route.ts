import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDeckFlashcards } from "@/lib/decks";
import {
  getFlashcardDeck,
  getLessonFlashcardDeck,
  type DeckLevel,
  type DeckSize,
} from "@/lib/flashcards";

/**
 * GET /api/flashcards/deck
 *
 *   ?deck=12                 one of the signed-in user's own decks (shuffled)
 *   ?lesson=hsk1-3           lesson-scoped deck (all of that lesson's vocab)
 *   ?level=1|2|all&size=...  general deck (default level=all, size=10)
 *
 * deck > lesson > general. Only ?deck= needs auth.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const deckParam = url.searchParams.get("deck");

  if (deckParam) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Sign in to study your decks." }, { status: 401 });
    const result = /^\d{1,9}$/.test(deckParam) ? await getDeckFlashcards(auth.userId, Number(deckParam)) : null;
    if (!result) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    return NextResponse.json({ scope: "user_deck", userDeck: result.deck, deck: result.cards });
  }

  const lessonParam = url.searchParams.get("lesson");

  if (lessonParam) {
    const m = /^hsk(\d+)-(\d+)$/.exec(lessonParam);
    if (!m) return NextResponse.json({ error: "lesson must look like hsk1-3" }, { status: 400 });
    const book = `hsk${m[1]}`;
    const number = parseInt(m[2], 10);
    const result = await getLessonFlashcardDeck(book, number);
    if (!result) return NextResponse.json({ error: "Lesson not found — run db:import-lessons" }, { status: 404 });
    return NextResponse.json({
      scope: "lesson",
      lesson: result.lesson,
      deck: result.deck,
    });
  }

  const levelParam = url.searchParams.get("level") ?? "all";
  const sizeParam = url.searchParams.get("size") ?? "10";
  const level: DeckLevel = levelParam === "1" ? 1 : levelParam === "2" ? 2 : "all";
  const size: DeckSize =
    sizeParam === "all" ? "all"
    : sizeParam === "20" ? 20
    : sizeParam === "10" ? 10
    : Math.max(1, Math.min(500, parseInt(sizeParam, 10) || 10));

  const deck = await getFlashcardDeck(level, size);
  return NextResponse.json({ scope: "general", level, size, deck });
}
