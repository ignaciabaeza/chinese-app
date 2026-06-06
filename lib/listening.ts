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

/** Same as shadowing — dictation just rebrands the picker for clarity. */
export const pickDictationSentence = pickShadowingSentence;

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
 * Random multi-syllable HSK 1-2 word with audio. Generates the correct
 * tone pattern + 3 distractors, shuffles, and returns the index of the
 * correct answer. Excludes single-character words (too easy to guess).
 */
export async function pickToneWord(excludeWordId?: number): Promise<ToneDrill | null> {
  const { rows } = await pool.query<{
    id: number;
    simplified: string;
    pinyin: string;
    meanings: string[];
    audio_path: string;
  }>(
    `SELECT id, simplified, pinyin, meanings, audio_path
     FROM words
     WHERE audio_path IS NOT NULL
       AND hsk2_level IN (1, 2)
       AND CHAR_LENGTH(simplified) BETWEEN 2 AND 3
       AND ($1::int IS NULL OR id <> $1)
     ORDER BY random()
     LIMIT 1`,
    [excludeWordId ?? null],
  );
  const w = rows[0];
  if (!w) return null;

  const correct = tonePattern(w.pinyin);
  if (correct.length < 2) return null;          // wrong syllable count somehow

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
