import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createDeck, listDecks, MAX_DECKS_PER_USER, MAX_DECK_NAME } from "@/lib/decks";

/**
 * GET  /api/decks          → { decks: DeckSummary[] } for the signed-in user
 * POST /api/decks { name } → { id } (409 at MAX_DECKS_PER_USER)
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ decks: await listDecks(auth.userId) });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Give your deck a name." }, { status: 400 });
  if (name.length > MAX_DECK_NAME) {
    return NextResponse.json({ error: `Deck names are limited to ${MAX_DECK_NAME} characters.` }, { status: 400 });
  }

  const id = await createDeck(auth.userId, name);
  if (id == null) {
    return NextResponse.json({ error: `You can have up to ${MAX_DECKS_PER_USER} decks.` }, { status: 409 });
  }
  return NextResponse.json({ id });
}
