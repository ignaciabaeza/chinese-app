import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { removeCard } from "@/lib/decks";

/** DELETE /api/decks/[id]/cards/[cardId] → { ok: true } */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, cardId } = await params;
  if (!/^\d{1,9}$/.test(id) || !/^\d{1,9}$/.test(cardId)) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  if (!(await removeCard(auth.userId, Number(id), Number(cardId)))) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
