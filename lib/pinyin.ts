// Pinyin helpers — pure functions, isomorphic (safe in both server and
// client components). Used by the tone drill to derive an answer tone
// pattern from a tone-marked pinyin string.

// Tone-marked vowels → tone number.
const TONE_MAP: Record<string, number> = {
  "ā": 1, "ē": 1, "ī": 1, "ō": 1, "ū": 1, "ǖ": 1, "ḿ": 2, "ń": 2, "ǹ": 4,
  "á": 2, "é": 2, "í": 2, "ó": 2, "ú": 2, "ǘ": 2,
  "ǎ": 3, "ě": 3, "ǐ": 3, "ǒ": 3, "ǔ": 3, "ǚ": 3, "ň": 3,
  "à": 4, "è": 4, "ì": 4, "ò": 4, "ù": 4, "ǜ": 4,
};

/**
 * Extract a tone for a single syllable (e.g. "nǐ" → 3, "ma" → 5).
 * Returns 5 for neutral (no tone mark).
 */
export function syllableTone(syllable: string): number {
  for (const ch of syllable) {
    const t = TONE_MAP[ch];
    if (t) return t;
  }
  return 5;
}

/**
 * Tone pattern for a pinyin string. Splits on whitespace; assumes the
 * source pinyin is already space-separated syllables (which is how the
 * vocabulary import stores it, e.g. "nǐ hǎo").
 */
export function tonePattern(pinyin: string): number[] {
  return pinyin
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(syllableTone);
}

/** Render a tone pattern as "3-3" or "2-1-4". Neutral shown as "0". */
export function formatTonePattern(tones: number[]): string {
  return tones.map((t) => (t === 5 ? "0" : String(t))).join("-");
}

/**
 * Generate `count` distinct tone-pattern distractors of the same length
 * as `correct`, none equal to `correct`. Random.
 */
export function tonePatternDistractors(correct: number[], count: number): number[][] {
  const n = correct.length;
  const correctKey = formatTonePattern(correct);
  const out: number[][] = [];
  const seen = new Set<string>([correctKey]);
  let tries = 0;
  while (out.length < count && tries < 200) {
    tries++;
    const cand: number[] = [];
    for (let i = 0; i < n; i++) cand.push(1 + Math.floor(Math.random() * 4));
    const key = formatTonePattern(cand);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cand);
  }
  return out;
}
