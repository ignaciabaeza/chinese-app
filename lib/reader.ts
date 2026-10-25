// Server-only helpers for the reader: text fetching and per-user knowledge-
// state overlays. Jieba segmentation lives in lib/segment.ts so the pages
// importing this file don't drag the native binding into the bundle graph.

import "server-only";
import { pool } from "@/lib/db";
import { knowledgeFromBox, type KnowledgeState as BoxKnowledge } from "@/lib/leitner-rules";

export type Segment = { t: string; w?: number; p?: true };

export interface TextSummary {
  id: number;
  title: string;
  source: string | null;
  hsk_level: number | null;
  user_id: string | null;
  created_at: string;
  preview: string; // first ~60 chars of body
}

export interface FullText {
  id: number;
  title: string;
  body: string;
  hsk_level: number | null;
  source: string | null;
  user_id: string | null;
  segments: Segment[];
  created_at: string;
}

// ─── Text queries ────────────────────────────────────────────────────────────

/**
 * List texts visible to this user: all shared (user_id IS NULL) + this user's
 * own pasted texts. Ordered: shared by hsk_level + title, then user's by
 * created_at desc.
 */
export async function listTexts(userId: string | null): Promise<TextSummary[]> {
  const { rows } = await pool.query<TextSummary>(
    `SELECT id, title, source, hsk_level, user_id, created_at,
            SUBSTRING(REGEXP_REPLACE(body, '\\s+', ' ', 'g') FROM 1 FOR 60) AS preview
     FROM texts
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY
       CASE WHEN user_id IS NULL THEN 0 ELSE 1 END,
       COALESCE(hsk_level, 99),
       CASE WHEN user_id IS NULL THEN title END,
       created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getText(id: number, userId: string | null): Promise<FullText | null> {
  const { rows } = await pool.query<FullText>(
    `SELECT id, title, body, hsk_level, source, user_id, segments, created_at
     FROM texts
     WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`,
    [id, userId],
  );
  return rows[0] ?? null;
}

// ─── Knowledge state ─────────────────────────────────────────────────────────

export type KnowledgeState = BoxKnowledge | "unknown";

/**
 * Returns a map of word_id → knowledge state for any word that appears in
 * this user's `cards` table (knowledgeFromBox: box 0 new, 1–2 learning,
 * 3–4 review, 5 mature). Words not in the map are "unknown".
 */
export async function getUserKnowledgeMap(
  userId: string,
  wordIds: number[],
): Promise<Map<number, KnowledgeState>> {
  if (wordIds.length === 0) return new Map();
  // For each word_id, pick the "most advanced" card across all card_types,
  // so a recognition-card-only word still gets a state.
  const { rows } = await pool.query<{ word_id: number; box: number }>(
    `SELECT word_id, MAX(box)::int AS box
     FROM cards
     WHERE user_id = $1 AND word_id = ANY($2::int[])
     GROUP BY word_id`,
    [userId, wordIds],
  );
  return new Map(rows.map((r) => [r.word_id, knowledgeFromBox(r.box)]));
}

// ─── Lookup for popovers ─────────────────────────────────────────────────────

export interface WordLookup {
  id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
  audio_path: string | null;
  in_deck: boolean;
  state: KnowledgeState;
}

export async function lookupWord(
  wordId: number,
  userId: string | null,
): Promise<WordLookup | null> {
  const { rows } = await pool.query<{
    id: number;
    simplified: string;
    pinyin: string;
    meanings: string[];
    hsk2_level: number | null;
    hsk3_level: number | null;
    audio_path: string | null;
    card_box: number | null;
  }>(
    `SELECT w.id, w.simplified, w.pinyin, w.meanings, w.hsk2_level, w.hsk3_level,
            w.audio_path,
            c.box AS card_box
     FROM words w
     LEFT JOIN cards c
       ON c.word_id = w.id
      AND c.card_type = 'recognition'
      AND c.user_id = $2
     WHERE w.id = $1`,
    [wordId, userId],
  );
  const r = rows[0];
  if (!r) return null;
  const state: KnowledgeState = r.card_box == null ? "unknown" : knowledgeFromBox(r.card_box);
  return {
    id: r.id,
    simplified: r.simplified,
    pinyin: r.pinyin,
    meanings: r.meanings,
    hsk2_level: r.hsk2_level,
    hsk3_level: r.hsk3_level,
    audio_path: r.audio_path,
    in_deck: r.card_box != null,
    state,
  };
}

// ─── Add to deck ─────────────────────────────────────────────────────────────

/** Lazy-create a recognition card if one doesn't already exist. */
export async function addWordToDeck(userId: string, wordId: number): Promise<{ created: boolean }> {
  const { rowCount } = await pool.query(
    `INSERT INTO cards (user_id, word_id, card_type)
     VALUES ($1, $2, 'recognition')
     ON CONFLICT (user_id, word_id, card_type) DO NOTHING`,
    [userId, wordId],
  );
  return { created: (rowCount ?? 0) > 0 };
}
