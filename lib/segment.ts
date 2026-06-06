// Server-only segmentation helpers. Pulled out of lib/reader.ts so the bundled
// reader pages don't drag the jieba native binding through their import graph.

import "server-only";
import { pool } from "@/lib/db";

const PUNCT = /^[\s　-〿＀-￯ -⁯.,!?;:'"()/\\…—–\-、。!?？！：；""''《》（）]+$/u;

export type Segment = { t: string; w?: number; p?: true };

// Lazy holder so the native binding is loaded on first use, not at module-load.
let segmenterPromise: Promise<{ cut: (s: string) => string[] }> | null = null;
function getSegmenter(): Promise<{ cut: (s: string) => string[] }> {
  if (segmenterPromise) return segmenterPromise;
  segmenterPromise = (async () => {
    // Resolve via dynamic createRequire so Turbopack doesn't statically trace
    // the import paths. The package itself is in serverExternalPackages so the
    // native binding is required at runtime — but req.resolve('@node-rs/jieba')
    // returns Turbopack's opaque [externals] marker string, not a real path.
    // So we look up the dict file relative to process.cwd() instead.
    const { createRequire } = await import("node:module");
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const req = createRequire(import.meta.url);
    const { Jieba } = req("@node-rs/jieba");
    const dictPath = join(process.cwd(), "node_modules", "@node-rs", "jieba", "dict.txt");
    const dictBuf = readFileSync(dictPath);
    return Jieba.withDict(dictBuf);
  })();
  return segmenterPromise;
}

/** Segment a body with jieba and resolve known words to their DB ids. */
export async function segmentText(body: string): Promise<Segment[]> {
  const seg = await getSegmenter();
  const tokens = seg.cut(body);
  const nonPunct = tokens.filter((t) => !PUNCT.test(t));
  const unique = Array.from(new Set(nonPunct));
  const wordIds = new Map<string, number>();
  if (unique.length > 0) {
    const { rows } = await pool.query<{ id: number; simplified: string }>(
      "SELECT id, simplified FROM words WHERE simplified = ANY($1::text[])",
      [unique],
    );
    for (const r of rows) wordIds.set(r.simplified, r.id);
  }
  return tokens.map((t) => {
    if (PUNCT.test(t)) return { t, p: true } as Segment;
    const id = wordIds.get(t);
    return id ? ({ t, w: id } as Segment) : ({ t } as Segment);
  });
}

/** Pure jieba segmentation. Returns hanzi tokens only — punctuation filtered. */
export async function segmentTokens(body: string): Promise<string[]> {
  const seg = await getSegmenter();
  return seg.cut(body).filter((t: string) => !PUNCT.test(t) && t.trim().length > 0);
}

/** Segment + persist a user paste-in. Returns the new text id. */
export async function createPastedText(
  userId: string,
  title: string,
  body: string,
): Promise<number> {
  const segments = await segmentText(body);
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO texts (title, body, source, user_id, segments)
     VALUES ($1, $2, 'paste', $3, $4::jsonb)
     RETURNING id`,
    [title.trim() || "Untitled", body, userId, JSON.stringify(segments)],
  );
  return rows[0].id;
}
