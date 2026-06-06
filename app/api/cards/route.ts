import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { addWordToDeck } from "@/lib/reader";

/**
 * POST /api/cards
 *   body: { wordId: number }
 * Lazily creates a recognition card for this user + word. Idempotent.
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { wordId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.wordId !== "number") {
    return NextResponse.json({ error: "wordId required" }, { status: 400 });
  }
  const result = await addWordToDeck(auth.userId, body.wordId);
  return NextResponse.json(result);
}
