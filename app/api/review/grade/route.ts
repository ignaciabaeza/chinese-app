import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { gradeCard, CardNotFoundError, DuplicateGradeError, type GradeRating } from "@/lib/fsrs";

/**
 * POST /api/review/grade
 *   body: { cardId: number, rating: 1|2|3|4, elapsedMs?: number }
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { cardId?: number; rating?: number; elapsedMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { cardId, rating, elapsedMs } = body;
  if (typeof cardId !== "number" || !Number.isInteger(cardId)) return NextResponse.json({ error: "cardId required" }, { status: 400 });
  if (rating !== 1 && rating !== 2 && rating !== 3 && rating !== 4) {
    return NextResponse.json({ error: "rating must be 1-4" }, { status: 400 });
  }

  const elapsed = typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs >= 0
    ? Math.min(Math.round(elapsedMs), 3_600_000)
    : undefined;

  try {
    const result = await gradeCard(auth.userId, cardId, rating as GradeRating, elapsed);
    return NextResponse.json(result);
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
