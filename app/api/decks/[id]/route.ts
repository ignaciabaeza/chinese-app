import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { deleteDeck, getDeck, MAX_DECK_NAME, renameDeck } from "@/lib/decks";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET    /api/decks/[id]          → DeckDetail (cards newest first)
 * PATCH  /api/decks/[id] { name } → { ok: true }
 * DELETE /api/decks/[id]          → { ok: true }
 * Someone else's deck is a 404, same as a missing one.
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deckId = parseId((await params).id);
  if (deckId == null) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  const deck = await getDeck(auth.userId, deckId);
  if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  return NextResponse.json(deck);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deckId = parseId((await params).id);
  if (deckId == null) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  let body: { name?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Give your deck a name." }, { status: 400 });
  if (name.length > MAX_DECK_NAME) {
    return NextResponse.json({ error: `Deck names are limited to ${MAX_DECK_NAME} characters.` }, { status: 400 });
  }

  if (!(await renameDeck(auth.userId, deckId, name))) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deckId = parseId((await params).id);
  if (deckId == null) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

  if (!(await deleteDeck(auth.userId, deckId))) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function parseId(raw: string): number | null {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : null;
}
