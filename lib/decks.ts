// Server-only helpers for user-made flashcard decks ("Your decks" on
// /flashcards). Every function takes the owner's userId and scopes its query
// by it, so another user's deck id behaves exactly like a missing one.

import "server-only";
import { pool } from "@/lib/db";
import { attachExamples, type Flashcard } from "@/lib/flashcards";

export const MAX_DECKS_PER_USER = 100;
export const MAX_CARDS_PER_DECK = 1000;
export const MAX_DECK_NAME = 80;
export const MAX_CUSTOM_HANZI = 40;
export const MAX_CUSTOM_PINYIN = 120;
export const MAX_CUSTOM_MEANING = 300;

export interface DeckSummary {
  id: number;
  name: string;
  card_count: number;
  updated_at: string;
}

export interface DeckCard {
  id: number;
  word_id: number | null;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  custom: boolean;
}

export interface DeckDetail {
  id: number;
  name: string;
  cards: DeckCard[];
}

export interface WordSearchResult {
  id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
}

export async function listDecks(userId: string): Promise<DeckSummary[]> {
  const { rows } = await pool.query<DeckSummary>(
    `SELECT d.id, d.name, COUNT(c.id)::int AS card_count, d.updated_at
     FROM user_decks d
     LEFT JOIN user_deck_cards c ON c.deck_id = d.id
     WHERE d.user_id = $1
     GROUP BY d.id
     ORDER BY d.updated_at DESC`,
    [userId],
  );
  return rows;
}

/** Returns the new deck's id, or null when the user is at MAX_DECKS_PER_USER. */
export async function createDeck(userId: string, name: string): Promise<number | null> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO user_decks (user_id, name)
     SELECT $1, $2
     WHERE (SELECT COUNT(*) FROM user_decks WHERE user_id = $1) < $3
     RETURNING id`,
    [userId, name, MAX_DECKS_PER_USER],
  );
  return rows[0]?.id ?? null;
}

export async function renameDeck(userId: string, deckId: number, name: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE user_decks SET name = $3, updated_at = NOW() WHERE id = $2 AND user_id = $1",
    [userId, deckId, name],
  );
  return (rowCount ?? 0) > 0;
}

export async function deleteDeck(userId: string, deckId: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM user_decks WHERE id = $2 AND user_id = $1",
    [userId, deckId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getDeck(userId: string, deckId: number): Promise<DeckDetail | null> {
  const { rows: deckRows } = await pool.query<{ id: number; name: string }>(
    "SELECT id, name FROM user_decks WHERE id = $2 AND user_id = $1",
    [userId, deckId],
  );
  const deck = deckRows[0];
  if (!deck) return null;

  const { rows } = await pool.query<{
    id: number; word_id: number | null;
    w_simplified: string | null; w_pinyin: string | null; w_meanings: string[] | null; hsk2_level: number | null;
    simplified: string | null; pinyin: string | null; meaning: string | null;
  }>(
    `SELECT c.id, c.word_id,
            w.simplified AS w_simplified, w.pinyin AS w_pinyin, w.meanings AS w_meanings, w.hsk2_level,
            c.simplified, c.pinyin, c.meaning
     FROM user_deck_cards c
     LEFT JOIN words w ON w.id = c.word_id
     WHERE c.deck_id = $1
     ORDER BY c.added_at DESC, c.id DESC`,
    [deckId],
  );
  return {
    id: deck.id,
    name: deck.name,
    cards: rows.map((r) => r.word_id != null
      ? {
          id: r.id, word_id: r.word_id, simplified: r.w_simplified ?? "", pinyin: r.w_pinyin ?? "",
          meanings: r.w_meanings ?? [], hsk2_level: r.hsk2_level, custom: false,
        }
      : {
          id: r.id, word_id: null, simplified: r.simplified ?? "", pinyin: r.pinyin ?? "",
          meanings: r.meaning ? [r.meaning] : [], hsk2_level: null, custom: true,
        }),
  };
}

export type AddCardInput =
  | { wordId: number }
  | { simplified: string; pinyin: string; meaning: string };

export type AddCardResult =
  | { ok: true; card: DeckCard }
  | { ok: false; reason: "not_found" | "duplicate" | "full" | "unknown_word" };

/**
 * Adds a dictionary word or a custom word to a deck. Locks the deck row so two
 * concurrent adds can't both slip under MAX_CARDS_PER_DECK.
 */
export async function addCard(userId: string, deckId: number, input: AddCardInput): Promise<AddCardResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: deckRows } = await client.query(
      "SELECT id FROM user_decks WHERE id = $2 AND user_id = $1 FOR UPDATE",
      [userId, deckId],
    );
    if (deckRows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not_found" };
    }
    const { rows: countRows } = await client.query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM user_deck_cards WHERE deck_id = $1",
      [deckId],
    );
    if ((countRows[0]?.n ?? 0) >= MAX_CARDS_PER_DECK) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "full" };
    }

    let card: DeckCard;
    if ("wordId" in input) {
      const { rows: wordRows } = await client.query<WordSearchResult>(
        "SELECT id, simplified, pinyin, meanings, hsk2_level FROM words WHERE id = $1",
        [input.wordId],
      );
      const word = wordRows[0];
      if (!word) {
        await client.query("ROLLBACK");
        return { ok: false, reason: "unknown_word" };
      }
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO user_deck_cards (deck_id, word_id) VALUES ($1, $2)
         ON CONFLICT (deck_id, word_id) WHERE word_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [deckId, word.id],
      );
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return { ok: false, reason: "duplicate" };
      }
      card = {
        id: rows[0].id, word_id: word.id, simplified: word.simplified, pinyin: word.pinyin,
        meanings: word.meanings, hsk2_level: word.hsk2_level, custom: false,
      };
    } else {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO user_deck_cards (deck_id, simplified, pinyin, meaning)
         VALUES ($1, $2, NULLIF($3, ''), $4)
         RETURNING id`,
        [deckId, input.simplified, input.pinyin, input.meaning],
      );
      card = {
        id: rows[0].id, word_id: null, simplified: input.simplified, pinyin: input.pinyin,
        meanings: [input.meaning], hsk2_level: null, custom: true,
      };
    }

    await client.query("UPDATE user_decks SET updated_at = NOW() WHERE id = $1", [deckId]);
    await client.query("COMMIT");
    return { ok: true, card };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function removeCard(userId: string, deckId: number, cardId: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM user_deck_cards c
     USING user_decks d
     WHERE c.id = $3 AND c.deck_id = $2 AND d.id = c.deck_id AND d.user_id = $1`,
    [userId, deckId, cardId],
  );
  if ((rowCount ?? 0) === 0) return false;
  await pool.query("UPDATE user_decks SET updated_at = NOW() WHERE id = $1", [deckId]);
  return true;
}

/** A shuffled study deck for /flashcards?deck=ID, or null if it isn't the user's. */
export async function getDeckFlashcards(userId: string, deckId: number): Promise<{
  deck: { id: number; name: string };
  cards: Flashcard[];
} | null> {
  const detail = await getDeck(userId, deckId);
  if (!detail) return null;

  const wordIds = detail.cards.flatMap((c) => (c.word_id != null ? [c.word_id] : []));
  const wordCards = new Map<number, Flashcard>();
  if (wordIds.length > 0) {
    const { rows } = await pool.query<{
      id: number; simplified: string; pinyin: string;
      meanings: string[]; hsk2_level: number | null; audio_path: string | null;
    }>(
      "SELECT id, simplified, pinyin, meanings, hsk2_level, audio_path FROM words WHERE id = ANY($1::int[])",
      [wordIds],
    );
    for (const card of await attachExamples(rows)) wordCards.set(card.word_id!, card);
  }

  const cards = detail.cards.flatMap<Flashcard>((c) => {
    if (c.word_id != null) {
      const card = wordCards.get(c.word_id);
      return card ? [card] : [];
    }
    return [{
      word_id: null, simplified: c.simplified, pinyin: c.pinyin, meanings: c.meanings,
      hsk2_level: null, audio_path: null, example: null,
    }];
  });
  return { deck: { id: detail.id, name: detail.name }, cards: shuffle(cards) };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Dictionary search for the deck editor: exact hanzi first, then hanzi
 * prefix, then everything else (pinyin with or without tones, English) by
 * frequency.
 */
export async function searchWordsForDeck(query: string, limit = 20): Promise<WordSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const escaped = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  const { rows } = await pool.query<WordSearchResult>(
    `SELECT id, simplified, pinyin, meanings, hsk2_level
     FROM words
     WHERE simplified LIKE $2 OR traditional LIKE $2
        OR pinyin ILIKE $2 OR pinyin_numbered ILIKE $2
        OR replace(pinyin_numbered, ' ', '') ILIKE $2
        OR meanings::text ILIKE $2
     ORDER BY (simplified = $1) DESC,
              (simplified LIKE $3) DESC,
              (lower(pinyin) = lower($1) OR lower(replace(pinyin_numbered, ' ', '')) = lower($1)) DESC,
              COALESCE(frequency_rank, 999999),
              simplified
     LIMIT $4`,
    [q, `%${escaped}%`, `${escaped}%`, limit],
  );
  return rows;
}
