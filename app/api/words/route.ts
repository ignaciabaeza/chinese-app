import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { lookupWord } from "@/lib/reader";

/**
 * GET /api/words?id=123
 * Returns word details + this user's deck/state info for the popover.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) return NextResponse.json({ error: "id required" }, { status: 400 });
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id must be a number" }, { status: 400 });

  const word = await lookupWord(id, auth?.userId ?? null);
  if (!word) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(word);
}
