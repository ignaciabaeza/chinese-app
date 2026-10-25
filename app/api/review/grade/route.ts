import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  CARD_TYPES,
  CardNotFoundError,
  DuplicateGradeError,
  gradeCard,
  gradeSubject,
  type CardType,
} from "@/lib/leitner";

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

/**
 * POST /api/review/grade
 *   body: { cardId, rating: 1|3, elapsedMs? }
 *     or  { wordId | deckCardId, cardType, rating: 1|3, elapsedMs? }
 * rating 1 = "Don't know", 3 = "Know it". The second form grades a word's card
 * of that type, creating it if needed (flashcards, tone drill).
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { cardId?: unknown; wordId?: unknown; deckCardId?: unknown; cardType?: unknown; rating?: unknown; elapsedMs?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { cardId, wordId, deckCardId, cardType, rating, elapsedMs } = body;
  if (rating !== 1 && rating !== 3) return NextResponse.json({ error: "rating must be 1 or 3" }, { status: 400 });
  const known = rating === 3;
  const elapsed = typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs >= 0
    ? Math.min(Math.round(elapsedMs), 3_600_000)
    : undefined;

  try {
    if (isId(cardId)) return NextResponse.json(await gradeCard(auth.userId, cardId, known, elapsed));
    if (!CARD_TYPES.includes(cardType as CardType)) return NextResponse.json({ error: "cardType required" }, { status: 400 });
    const subject = isId(wordId) ? { wordId } : isId(deckCardId) ? { deckCardId } : null;
    if (!subject) return NextResponse.json({ error: "cardId, wordId or deckCardId required" }, { status: 400 });
    return NextResponse.json(await gradeSubject(auth.userId, subject, cardType as CardType, known, elapsed));
  } catch (err) {
    if (err instanceof CardNotFoundError) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    if (err instanceof DuplicateGradeError) {
      return NextResponse.json({ error: "Already graded" }, { status: 409 });
    }
    console.error("Grade error:", err);
    return NextResponse.json({ error: "Could not save your answer" }, { status: 500 });
  }
}
