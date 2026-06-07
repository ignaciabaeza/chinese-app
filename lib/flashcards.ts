// Server-only helper for the casual /flashcards module.
//
// Distinct from /review (FSRS): this returns a one-shot shuffled deck of
// vocab words with an example sentence, used for browsing or self-drilling
// without affecting the user's SRS schedule.

import "server-only";
import { pool } from "@/lib/db";

export interface FlashcardSentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  audio_path: string | null;
}

export interface Flashcard {
  word_id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  audio_path: string | null;
  example: FlashcardSentence | null;
}

export type DeckLevel = "all" | 1 | 2;
/** size "all" returns every matching word (cap 500 for safety) */
export type DeckSize = number | "all";

/**
 * Build a one-shot deck. Picks words filtered by HSK level, shuffles by
 * random(), then in a second query fetches one short example sentence per
 * word from sentence_words. Words with no matching sentence still appear
 * in the deck (example = null).
 */
export async function getFlashcardDeck(level: DeckLevel, size: DeckSize): Promise<Flashcard[]> {
  const levelClause = level === 1 || level === 2 ? "hsk2_level = $1" : "hsk2_level IN (1, 2)";
  const params: unknown[] = [];
  if (level === 1 || level === 2) params.push(level);

  // Pick the words. Size cap of 500 even when "all" so we don't ship a 5MB JSON.
  const hardCap = 500;
  const limit = size === "all" ? hardCap : Math.max(1, Math.min(hardCap, size));

  const { rows: wordRows } = await pool.query<{
    id: number; simplified: string; pinyin: string;
    meanings: string[]; hsk2_level: number | null; audio_path: string | null;
  }>(
    `SELECT id, simplified, pinyin, meanings, hsk2_level, audio_path
     FROM words
     WHERE ${levelClause}
     ORDER BY random()
     LIMIT ${limit}`,
    params,
  );
  if (wordRows.length === 0) return [];

  const wordIds = wordRows.map((w) => w.id);

  // For each word_id, pick the shortest matching sentence. The DISTINCT ON
  // approach is one query and runs O(N log N).
  const { rows: sentRows } = await pool.query<FlashcardSentence & { word_id: number }>(
    `SELECT DISTINCT ON (sw.word_id)
            sw.word_id, s.id, s.simplified, s.pinyin, s.english, s.audio_path
     FROM sentence_words sw
     JOIN sentences s ON s.id = sw.sentence_id
     WHERE sw.word_id = ANY($1::int[])
     ORDER BY sw.word_id, COALESCE(s.length, 99)`,
    [wordIds],
  );
  const examples = new Map<number, FlashcardSentence>();
  for (const r of sentRows) {
    examples.set(r.word_id, {
      id: r.id, simplified: r.simplified, pinyin: r.pinyin, english: r.english, audio_path: r.audio_path,
    });
  }

  return wordRows.map((w) => ({
    word_id: w.id,
    simplified: w.simplified,
    pinyin: w.pinyin,
    meanings: w.meanings,
    hsk2_level: w.hsk2_level,
    audio_path: w.audio_path,
    example: examples.get(w.id) ?? null,
  }));
}
