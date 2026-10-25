// Server-only random pickers for the listening + shadowing pages.

import "server-only";
import { pool } from "@/lib/db";
import { tonePattern, tonePatternDistractors } from "@/lib/pinyin";

export interface ShadowSentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  audio_path: string;
  max_hsk_level: number | null;
}

/**
 * Random HSK 1-2 sentence with audio. Caller can optionally exclude one id
 * (e.g. "give me a different sentence than the one just shown").
 */
export async function pickShadowingSentence(excludeId?: number): Promise<ShadowSentence | null> {
  const { rows } = await pool.query<ShadowSentence>(
    `SELECT id, simplified, pinyin, english, audio_path, max_hsk_level
     FROM sentences
     WHERE audio_path IS NOT NULL
       AND max_hsk_level <= 2
       AND length >= 4 AND length <= 18
       AND ($1::int IS NULL OR id <> $1)
     ORDER BY random()
     LIMIT 1`,
    [excludeId ?? null],
  );
  return rows[0] ?? null;
}

/**
 * Dictation sentence: like shadowing, or — with a deck — a sentence with audio
 * that uses at least one of the deck's words. Deck ownership is the caller's job.
 */
export async function pickDictationSentence(excludeId?: number, deckId?: number | null): Promise<ShadowSentence | null> {
  if (!deckId) return pickShadowingSentence(excludeId);
  const { rows } = await pool.query<ShadowSentence>(
    `SELECT s.id, s.simplified, s.pinyin, s.english, s.audio_path, s.max_hsk_level
     FROM sentences s
     WHERE s.audio_path IS NOT NULL
       AND s.length >= 4 AND s.length <= 18
       AND ($1::int IS NULL OR s.id <> $1)
       AND s.id IN (SELECT sw.sentence_id FROM sentence_words sw
                    JOIN user_deck_cards dc ON dc.word_id = sw.word_id
                    WHERE dc.deck_id = $2)
     ORDER BY random()
     LIMIT 1`,
    [excludeId ?? null, deckId],
  );
  return rows[0] ?? null;
}

export interface ToneDrill {
  word_id: number;
  simplified: string;
  pinyin: string;
  english: string;
  audio_path: string;
  /** Index 0..3 of the correct option in `options`. */
  answerIndex: number;
  /** Each option is a tone pattern, e.g. [3,3] or [2,1,4]. */
  options: number[][];
}

/**
 * A word with audio for the tone drill, with its tone pattern + 3 distractors
 * shuffled and the index of the correct one. HSK mode: multi-syllable HSK 1–2
 * words (single characters are too easy to guess). Deck mode: any deck word
 * with audio. Signed in, words whose listening card is due come first, since
 * the answer grades that card. Deck ownership is the caller's job.
 */
export async function pickToneWord(
  excludeWordId?: number,
  { userId = null, deckId = null }: { userId?: string | null; deckId?: number | null } = {},
): Promise<ToneDrill | null> {
  const { rows } = await pool.query<{
    id: number;
    simplified: string;
    pinyin: string;
    meanings: string[];
    audio_path: string;
  }>(
    `SELECT w.id, w.simplified, w.pinyin, w.meanings, w.audio_path
     FROM words w
     LEFT JOIN cards c ON c.word_id = w.id AND c.user_id = $2 AND c.card_type = 'listening'
     WHERE w.audio_path IS NOT NULL
       AND ($1::int IS NULL OR w.id <> $1)
       AND CASE WHEN $3::int IS NULL
             THEN w.hsk2_level IN (1, 2) AND CHAR_LENGTH(w.simplified) BETWEEN 2 AND 3
             ELSE w.id IN (SELECT word_id FROM user_deck_cards WHERE deck_id = $3)
           END
     ORDER BY (c.box > 0 AND c.due <= NOW()) IS TRUE DESC, random()
     LIMIT 1`,
    [excludeWordId ?? null, userId, deckId],
  );
  const w = rows[0];
  if (!w) return null;

  const correct = tonePattern(w.pinyin);
  if (correct.length === 0) return null;        // no readable syllables

  const distractors = tonePatternDistractors(correct, 3);
  const options = [correct, ...distractors];
  // Fisher-Yates shuffle, then locate the correct index.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const answerIndex = options.findIndex((o) => o.length === correct.length && o.every((v, k) => v === correct[k]));

  return {
    word_id: w.id,
    simplified: w.simplified,
    pinyin: w.pinyin,
    english: (w.meanings && w.meanings[0]) ?? "",
    audio_path: w.audio_path,
    answerIndex,
    options,
  };
}
