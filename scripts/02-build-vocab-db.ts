/**
 * Phase 1, step 2: populate Postgres tables from the downloaded sources.
 *
 *   npm run db:build-vocab
 *
 * Reads data/sources/{complete-hsk.json, cedict.txt, makemeahanzi.txt} and
 * inserts into the `words` and `characters` tables. Idempotent — uses ON
 * CONFLICT DO UPDATE so re-running refreshes any rows whose source data
 * changed.
 *
 * Assumes migration 002 has been applied. Run with DATABASE_URL set
 * (loaded automatically from .env).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { loadEnv } from "./lib/env";
import { buildWordRow, cedictKey, loadTaught, type HSKForm } from "./lib/word-forms";

loadEnv();

const SOURCES_DIR = join(process.cwd(), "data", "sources");

// ─── Types matching source formats ──────────────────────────────────────────

interface HSKEntry {
  simplified: string;
  radical?: string;
  level?: string[];        // e.g. ["old-1", "new-2", "newest-3"]
  frequency?: number;
  pos?: string[];
  forms?: HSKForm[];
}

interface MMHEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  radical?: string;
  matches?: unknown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickHSKLevel(levels: string[] | undefined, prefix: "old" | "new"): number | null {
  if (!levels) return null;
  for (const l of levels) {
    if (l.startsWith(`${prefix}-`)) {
      const n = parseInt(l.slice(prefix.length + 1), 10);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

/** Parse one CC-CEDICT line. Returns null on unparsable / comment lines. */
function parseCedictLine(line: string): { simp: string; trad: string; pinyin: string; meanings: string[] } | null {
  if (!line || line.startsWith("#")) return null;
  // format: TRAD SIMP [pinyin] /meaning 1/meaning 2/
  const m = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!m) return null;
  const meanings = m[4].split("/").map((s) => s.trim()).filter(Boolean);
  return { trad: m[1], simp: m[2], pinyin: m[3], meanings };
}

// ─── Loaders ─────────────────────────────────────────────────────────────────

function loadCedictMap(): Map<string, string[]> {
  console.log("Reading CC-CEDICT…");
  const path = join(SOURCES_DIR, "cedict.txt");
  const content = readFileSync(path, "utf-8");
  const map = new Map<string, string[]>();
  let parsed = 0;
  for (const line of content.split("\n")) {
    const entry = parseCedictLine(line);
    if (!entry) continue;
    // Keyed by reading too: 离 [li2] and 离 [chi1] are different words.
    const key = cedictKey(entry.simp, entry.pinyin);
    map.set(key, [...(map.get(key) ?? []), ...entry.meanings]);
    parsed++;
  }
  console.log(`  ${parsed.toLocaleString()} entries, ${map.size.toLocaleString()} unique readings`);
  return map;
}

function loadHSK(): HSKEntry[] {
  console.log("Reading complete-hsk.json…");
  const path = join(SOURCES_DIR, "complete-hsk.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as HSKEntry[];
  console.log(`  ${data.length.toLocaleString()} entries`);
  return data;
}

function loadMakeMeAHanzi(): MMHEntry[] {
  console.log("Reading makemeahanzi.txt…");
  const path = join(SOURCES_DIR, "makemeahanzi.txt");
  const content = readFileSync(path, "utf-8");
  const entries: MMHEntry[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as MMHEntry);
    } catch {
      // skip malformed lines
    }
  }
  console.log(`  ${entries.length.toLocaleString()} character entries`);
  return entries;
}

// ─── Writers ─────────────────────────────────────────────────────────────────

async function insertWords(pool: Pool, hskEntries: HSKEntry[], cedict: Map<string, string[]>) {
  console.log("Inserting words…");
  // Polyphonic entries: prefer the reading our lessons teach (see word-forms.ts).
  const taught = loadTaught(process.cwd());
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  try {
    await client.query("BEGIN");
    for (const entry of hskEntries) {
      if (!entry.simplified) {
        skipped++;
        continue;
      }
      const row = buildWordRow(entry, cedict, taught.get(entry.simplified));
      if (!row) {
        skipped++;
        continue;
      }
      const { traditional, pinyin, pinyin_numbered, meanings } = row;
      const hsk2 = pickHSKLevel(entry.level, "old");
      const hsk3 = pickHSKLevel(entry.level, "new");

      await client.query(
        `INSERT INTO words
           (simplified, traditional, pinyin, pinyin_numbered, hsk2_level, hsk3_level,
            frequency_rank, pos, meanings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
         ON CONFLICT (simplified) DO UPDATE SET
           traditional = EXCLUDED.traditional,
           pinyin = EXCLUDED.pinyin,
           pinyin_numbered = EXCLUDED.pinyin_numbered,
           hsk2_level = EXCLUDED.hsk2_level,
           hsk3_level = EXCLUDED.hsk3_level,
           frequency_rank = EXCLUDED.frequency_rank,
           pos = EXCLUDED.pos,
           meanings = EXCLUDED.meanings`,
        [
          entry.simplified,
          traditional,
          pinyin,
          pinyin_numbered,
          hsk2,
          hsk3,
          entry.frequency ?? null,
          JSON.stringify(entry.pos ?? []),
          JSON.stringify(meanings),
        ],
      );
      inserted++;
      if (inserted % 1000 === 0) console.log(`  ${inserted.toLocaleString()}…`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  console.log(`  ✓ ${inserted.toLocaleString()} words upserted, ${skipped} skipped`);
}

async function insertCharacters(pool: Pool, mmh: MMHEntry[]) {
  console.log("Inserting characters…");
  // Limit to single-character entries that have at least decomposition or radical.
  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query("BEGIN");
    for (const entry of mmh) {
      if (!entry.character || [...entry.character].length !== 1) continue;
      const decomposition = entry.decomposition ?? null;
      const radical = entry.radical ?? null;
      const etymology = JSON.stringify({
        definition: entry.definition ?? null,
        pinyin: entry.pinyin ?? [],
      });
      await client.query(
        `INSERT INTO characters (char, decomposition, radical, etymology)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (char) DO UPDATE SET
           decomposition = EXCLUDED.decomposition,
           radical = EXCLUDED.radical,
           etymology = EXCLUDED.etymology`,
        [entry.character, decomposition, radical, etymology],
      );
      inserted++;
      if (inserted % 2000 === 0) console.log(`  ${inserted.toLocaleString()}…`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  console.log(`  ✓ ${inserted.toLocaleString()} characters upserted`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (expected in .env)");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const cedict = loadCedictMap();
    const hsk = loadHSK();
    const mmh = loadMakeMeAHanzi();

    await insertWords(pool, hsk, cedict);
    await insertCharacters(pool, mmh);

    const { rows: counts } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM words) AS word_count,
         (SELECT COUNT(*) FROM words WHERE hsk2_level IS NOT NULL) AS hsk2_count,
         (SELECT COUNT(*) FROM words WHERE hsk3_level IS NOT NULL) AS hsk3_count,
         (SELECT COUNT(*) FROM characters) AS char_count`,
    );
    console.log("\nDone.");
    console.table(counts[0]);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
