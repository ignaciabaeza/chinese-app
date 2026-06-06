/**
 * Phase 1, step 3: match Tatoeba sentences to known HSK words.
 *
 *   npm run db:match-sentences
 *
 * For every sentence in tatoeba-cmn-eng.tsv:
 *   1. Segment with jieba into word tokens (punctuation stripped).
 *   2. Look up each segment in the `words` table.
 *   3. Compute coverage = % of tokens that map to known words.
 *   4. Keep if coverage >= 90% and 4 <= length <= 20 characters.
 *   5. Insert into `sentences` + `sentence_words` tables.
 *
 * After insertion, walk HSK 1-2 words and log any with fewer than 2 "i+1"
 * matches (sentences where every word is HSK <= 2) so the user can hand-
 * author examples for them.
 *
 * Requires migration 002 applied + 02-build-vocab-db.ts run first.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool, type PoolClient } from "pg";
import { Jieba } from "@node-rs/jieba";
import { loadEnv } from "./lib/env";

loadEnv();

const SOURCES_DIR = join(process.cwd(), "data", "sources");
const MIN_COVERAGE = 0.9;       // >= 90% of segments must be known words
const MIN_LENGTH = 4;            // chars
const MAX_LENGTH = 20;           // chars

// Loose punctuation that jieba sometimes returns as tokens.
const PUNCT = /^[\s　-〿＀-￯ -⁯.,!?;:'"()/\\…—–\-]+$/u;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jieba(): Jieba {
  const dictPath = require.resolve("@node-rs/jieba/dict.txt");
  const dictBuf = readFileSync(dictPath);
  return Jieba.withDict(dictBuf);
}

function charCount(s: string): number {
  // count Han characters only — ignores punctuation and whitespace
  return Array.from(s).filter((c) => /\p{Script=Han}/u.test(c)).length;
}

interface WordRow {
  id: number;
  simplified: string;
  hsk2_level: number | null;
  hsk3_level: number | null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (expected in .env)");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Loading word index from DB…");
  const { rows: words } = await pool.query<WordRow>(
    "SELECT id, simplified, hsk2_level, hsk3_level FROM words",
  );
  if (words.length === 0) {
    console.error("words table is empty — run `npm run db:build-vocab` first");
    process.exit(1);
  }
  const wordMap = new Map<string, WordRow>();
  for (const w of words) wordMap.set(w.simplified, w);
  console.log(`  ${words.length.toLocaleString()} known words`);

  console.log("Initializing jieba…");
  const segmenter = jieba();

  console.log("Reading Tatoeba TSV…");
  const tsv = readFileSync(join(SOURCES_DIR, "tatoeba-cmn-eng.tsv"), "utf-8");
  const lines = tsv.split("\n").filter(Boolean);
  console.log(`  ${lines.length.toLocaleString()} sentences`);

  console.log("Truncating prior sentence data…");
  // sentence_words FK cascades on sentences delete, so just clear sentences.
  await pool.query("DELETE FROM sentences");

  console.log("Matching sentences…");
  const client = await pool.connect();
  let kept = 0;
  let skippedCoverage = 0;
  let skippedLength = 0;
  let skippedParse = 0;
  try {
    await client.query("BEGIN");
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 5) {
        skippedParse++;
        continue;
      }
      const [, simplified, traditional, pinyin, english] = parts;
      if (!simplified || !english) {
        skippedParse++;
        continue;
      }

      const len = charCount(simplified);
      if (len < MIN_LENGTH || len > MAX_LENGTH) {
        skippedLength++;
        continue;
      }

      const tokens = segmenter.cut(simplified).filter((t) => !PUNCT.test(t));
      if (tokens.length === 0) {
        skippedParse++;
        continue;
      }

      const matchedWordIds = new Set<number>();
      let maxLevel = 0;
      let known = 0;
      for (const t of tokens) {
        const w = wordMap.get(t);
        if (w) {
          known++;
          matchedWordIds.add(w.id);
          const lvl = w.hsk2_level ?? w.hsk3_level ?? 0;
          if (lvl > maxLevel) maxLevel = lvl;
        }
      }

      const coverage = known / tokens.length;
      if (coverage < MIN_COVERAGE) {
        skippedCoverage++;
        continue;
      }

      const sentenceRes = await client.query<{ id: number }>(
        `INSERT INTO sentences
           (simplified, traditional, pinyin, english, source, max_hsk_level, length)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          simplified.trim(),
          traditional?.trim() || null,
          pinyin?.trim() || null,
          english.trim(),
          "tatoeba",
          maxLevel || null,
          len,
        ],
      );
      const sentenceId = sentenceRes.rows[0].id;
      for (const wordId of matchedWordIds) {
        await client.query(
          "INSERT INTO sentence_words (sentence_id, word_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [sentenceId, wordId],
        );
      }
      kept++;
      if (kept % 500 === 0) console.log(`  ${kept.toLocaleString()} kept…`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  console.log("\nResults:");
  console.table({
    kept: kept.toLocaleString(),
    skippedCoverage: skippedCoverage.toLocaleString(),
    skippedLength: skippedLength.toLocaleString(),
    skippedParse: skippedParse.toLocaleString(),
  });

  // Find HSK 1-2 words with too-few i+1 examples
  console.log("\nChecking i+1 coverage for HSK 1-2 words…");
  await findUndercoveredWords(pool);

  await pool.end();
}

async function findUndercoveredWords(pool: Pool): Promise<void> {
  // i+1 = sentence where every matched word is HSK 1 or 2.
  // A simpler proxy: sentence's max_hsk_level <= 2.
  const { rows } = await pool.query<{ id: number; simplified: string; count: number; level: number }>(
    `SELECT w.id, w.simplified, w.hsk2_level AS level,
            COUNT(sw.sentence_id)::int AS count
     FROM words w
     LEFT JOIN sentence_words sw ON sw.word_id = w.id
     LEFT JOIN sentences s ON s.id = sw.sentence_id AND s.max_hsk_level <= 2
     WHERE w.hsk2_level IN (1, 2)
     GROUP BY w.id
     HAVING COUNT(s.id) < 2
     ORDER BY w.hsk2_level, w.simplified`,
  );
  if (rows.length === 0) {
    console.log("  ✓ Every HSK 1-2 word has at least 2 i+1 sentences");
    return;
  }
  console.log(`  ⚠ ${rows.length} HSK 1-2 words have fewer than 2 i+1 sentences:`);
  for (const r of rows.slice(0, 30)) {
    console.log(`    HSK${r.level}  ${r.simplified}  (${r.count} sentence${r.count === 1 ? "" : "s"})`);
  }
  if (rows.length > 30) console.log(`    … and ${rows.length - 30} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
