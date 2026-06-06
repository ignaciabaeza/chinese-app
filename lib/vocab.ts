// Server-only helpers for querying the Phase 1 vocabulary tables.
// Do not import into client components.

import "server-only";
import { pool } from "@/lib/db";

export interface VocabWord {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyin_numbered: string | null;
  hsk2_level: number | null;
  hsk3_level: number | null;
  frequency_rank: number | null;
  pos: string[];
  meanings: string[];
  audio_path: string | null;
}

export interface VocabSentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  max_hsk_level: number | null;
  audio_path: string | null;
}

export interface VocabCharacter {
  char: string;
  decomposition: string | null;
  radical: string | null;
  etymology: { definition?: string | null; pinyin?: string[] } | null;
}

export type LevelFilter = "all" | `hsk2-${1 | 2 | 3 | 4 | 5 | 6}` | `hsk3-${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

export interface SearchOptions {
  query?: string;
  level?: LevelFilter;
  limit?: number;
  offset?: number;
}

/** Search the vocab table with optional level filter and free-text query. */
export async function searchWords(opts: SearchOptions): Promise<{ rows: VocabWord[]; total: number }> {
  const { query, level = "all", limit = 50, offset = 0 } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    params.push(q);
    const p = `$${params.length}`;
    conditions.push(`(simplified LIKE ${p} OR traditional LIKE ${p} OR pinyin ILIKE ${p} OR pinyin_numbered ILIKE ${p} OR meanings::text ILIKE ${p})`);
  }
  if (level !== "all") {
    const [kind, n] = level.split("-");
    const col = kind === "hsk2" ? "hsk2_level" : "hsk3_level";
    params.push(parseInt(n, 10));
    conditions.push(`${col} = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQ = `SELECT COUNT(*)::int AS total FROM words ${where}`;
  const dataQ = `SELECT id, simplified, traditional, pinyin, pinyin_numbered,
                        hsk2_level, hsk3_level, frequency_rank, pos, meanings, audio_path
                 FROM words ${where}
                 ORDER BY COALESCE(hsk2_level, 99), COALESCE(hsk3_level, 99),
                          COALESCE(frequency_rank, 999999), simplified
                 LIMIT ${limit} OFFSET ${offset}`;

  const [countRes, dataRes] = await Promise.all([
    pool.query<{ total: number }>(countQ, params),
    pool.query<VocabWord>(dataQ, params),
  ]);
  return { rows: dataRes.rows, total: countRes.rows[0]?.total ?? 0 };
}

export async function getWordBySimplified(simplified: string): Promise<VocabWord | null> {
  const { rows } = await pool.query<VocabWord>(
    `SELECT id, simplified, traditional, pinyin, pinyin_numbered,
            hsk2_level, hsk3_level, frequency_rank, pos, meanings, audio_path
     FROM words WHERE simplified = $1`,
    [simplified],
  );
  return rows[0] ?? null;
}

export async function getSentencesForWord(wordId: number, limit = 10): Promise<VocabSentence[]> {
  const { rows } = await pool.query<VocabSentence>(
    `SELECT s.id, s.simplified, s.pinyin, s.english, s.max_hsk_level, s.audio_path
     FROM sentence_words sw
     JOIN sentences s ON s.id = sw.sentence_id
     WHERE sw.word_id = $1
     ORDER BY COALESCE(s.max_hsk_level, 99), s.length
     LIMIT $2`,
    [wordId, limit],
  );
  return rows;
}

export async function getCharacters(chars: string[]): Promise<Map<string, VocabCharacter>> {
  if (chars.length === 0) return new Map();
  const { rows } = await pool.query<VocabCharacter>(
    `SELECT char, decomposition, radical, etymology
     FROM characters
     WHERE char = ANY($1::text[])`,
    [chars],
  );
  return new Map(rows.map((r) => [r.char, r]));
}

/** Counts by HSK level for the level-picker UI. */
export async function getLevelCounts(): Promise<{
  hsk2: Record<number, number>;
  hsk3: Record<number, number>;
  total: number;
}> {
  const { rows } = await pool.query<{ hsk2: number | null; hsk3: number | null; n: number }>(
    `SELECT hsk2_level AS hsk2, hsk3_level AS hsk3, COUNT(*)::int AS n
     FROM words
     GROUP BY hsk2_level, hsk3_level`,
  );
  const hsk2: Record<number, number> = {};
  const hsk3: Record<number, number> = {};
  let total = 0;
  for (const r of rows) {
    if (r.hsk2 != null) hsk2[r.hsk2] = (hsk2[r.hsk2] ?? 0) + r.n;
    if (r.hsk3 != null) hsk3[r.hsk3] = (hsk3[r.hsk3] ?? 0) + r.n;
    total += r.n;
  }
  return { hsk2, hsk3, total };
}
