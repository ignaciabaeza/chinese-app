/**
 * Phase 1, step 1: download all the open data sources we'll process.
 *
 *   npm run db:download
 *
 * Idempotent — skips files that already exist. Outputs go to /data/sources/,
 * which is gitignored. Re-run to refresh.
 */

import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { gunzipSync } from "node:zlib";
import { writeFileSync, readFileSync } from "node:fs";

const SOURCES_DIR = join(process.cwd(), "data", "sources");

interface Source {
  name: string;
  url: string;
  outFile: string;        // relative to SOURCES_DIR
  gunzip?: boolean;       // if true, save as decompressed
}

const SOURCES: Source[] = [
  {
    name: "complete-hsk-vocabulary",
    url: "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json",
    outFile: "complete-hsk.json",
  },
  {
    name: "CC-CEDICT",
    url: "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz",
    outFile: "cedict.txt",
    gunzip: true,
  },
  {
    name: "Make Me a Hanzi dictionary",
    url: "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt",
    outFile: "makemeahanzi.txt",
  },
  {
    // Format: id \t simplified \t traditional \t pinyin \t english
    name: "Tatoeba cmn-eng sentence pairs (pre-processed by krmanik)",
    url: "https://raw.githubusercontent.com/krmanik/Chinese-Example-Sentences/main/Chinese%20Example%20Sentences/cmn_sen_db_2.tsv",
    outFile: "tatoeba-cmn-eng.tsv",
  },
];

async function download(src: Source): Promise<void> {
  const dest = join(SOURCES_DIR, src.outFile);
  if (existsSync(dest)) {
    const size = statSync(dest).size;
    console.log(`  ✓ ${src.name}: cached (${formatBytes(size)} at ${dest})`);
    return;
  }
  console.log(`  ↓ ${src.name}: ${src.url}`);
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${src.url}`);

  if (src.gunzip) {
    const buf = Buffer.from(await res.arrayBuffer());
    const decompressed = gunzipSync(buf);
    writeFileSync(dest, decompressed);
    console.log(`  ✓ ${src.name}: ${formatBytes(decompressed.length)} (gunzipped to ${dest})`);
  } else {
    if (!res.body) throw new Error(`No body for ${src.url}`);
    await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest));
    const size = statSync(dest).size;
    console.log(`  ✓ ${src.name}: ${formatBytes(size)} (saved to ${dest})`);
  }
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  mkdirSync(SOURCES_DIR, { recursive: true });
  console.log(`Downloading sources into ${SOURCES_DIR}`);
  for (const src of SOURCES) {
    try {
      await download(src);
    } catch (err) {
      console.error(`  ✗ ${src.name}: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log("Done.");
}

main();
