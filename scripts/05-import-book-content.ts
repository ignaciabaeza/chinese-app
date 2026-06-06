/**
 * Phase 5, step 5: import authored HSK 1+2 lesson dialogues into the texts
 * table for the reader.
 *
 *   npm run db:import-lessons
 *
 * For each lesson JSON under data/hsk{1,2}/lessons/, concatenates the
 * situational dialogues into a single body and inserts as one text row.
 * The body is pre-segmented with jieba and cached so the reader page can
 * render instantly. Idempotent — re-running replaces existing rows by
 * (source, title).
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { Jieba } from "@node-rs/jieba";
import { loadEnv } from "./lib/env";

loadEnv();

const REPO = process.cwd();
const PUNCT = /^[\s　-〿＀-￯ -⁯.,!?;:'"()/\\…—–\-、。!?？！：；""''《》（）]+$/u;

// ─── Types of the lesson JSON files ─────────────────────────────────────────

interface LessonText {
  situationNumber: number;
  title?: { hanzi: string; english?: string };
  dialogue: { speaker: string; hanzi: string; pinyin?: string; english?: string }[];
}

interface Lesson {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  number: number;
  title: { hanzi: string; pinyin?: string; english: string };
  texts?: LessonText[];
  stub?: boolean;
}

// ─── Segmenter ───────────────────────────────────────────────────────────────

function makeSegmenter(): Jieba {
  const dictPath = require.resolve("@node-rs/jieba/dict.txt");
  const dictBuf = readFileSync(dictPath);
  return Jieba.withDict(dictBuf);
}

type Segment = { t: string; w?: number; p?: true };

async function segmentBody(seg: Jieba, body: string, wordMap: Map<string, number>): Promise<Segment[]> {
  const tokens = seg.cut(body);
  return tokens.map((t) => {
    if (PUNCT.test(t)) return { t, p: true } as Segment;
    const id = wordMap.get(t);
    return id ? ({ t, w: id } as Segment) : ({ t } as Segment);
  });
}

// ─── Lesson loader ───────────────────────────────────────────────────────────

function loadLessons(level: 1 | 2): Lesson[] {
  const dir = join(REPO, "data", `hsk${level}`, "lessons");
  if (!existsSync(dir)) return [];
  const out: Lesson[] = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = JSON.parse(readFileSync(join(dir, file), "utf-8")) as Lesson;
      if (!data.stub) out.push(data);
    } catch {
      // skip malformed
    }
  }
  return out;
}

function lessonBody(lesson: Lesson): string {
  // Concatenate dialogues in a readable way:
  //   <situation title>
  //   A: <hanzi>
  //   B: <hanzi>
  //   (blank line between situations)
  const blocks: string[] = [];
  for (const t of lesson.texts ?? []) {
    const header = t.title?.hanzi ?? `情景 ${t.situationNumber}`;
    const lines = t.dialogue.map((d) => `${d.speaker}: ${d.hanzi}`);
    blocks.push([header, ...lines].join("\n"));
  }
  return blocks.join("\n\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set (expected in .env)");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Loading word index from DB…");
  const { rows: words } = await pool.query<{ id: number; simplified: string }>(
    "SELECT id, simplified FROM words",
  );
  const wordMap = new Map<string, number>();
  for (const w of words) wordMap.set(w.simplified, w.id);
  console.log(`  ${wordMap.size.toLocaleString()} known words`);

  console.log("Initializing jieba…");
  const seg = makeSegmenter();

  for (const level of [1, 2] as const) {
    const lessons = loadLessons(level);
    if (lessons.length === 0) {
      console.log(`HSK ${level}: no authored lessons found`);
      continue;
    }
    console.log(`HSK ${level}: importing ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}…`);

    for (const lesson of lessons) {
      const title = `HSK ${level} · 第${lesson.number}课 ${lesson.title.hanzi}`;
      const body = lessonBody(lesson);
      if (!body.trim()) {
        console.log(`  - ${title}: empty body, skipped`);
        continue;
      }
      const segments = await segmentBody(seg, body, wordMap);
      const source = `hsk${level}-book`;
      await pool.query(
        `INSERT INTO texts (title, body, hsk_level, source, segments)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT DO NOTHING`,
        [title, body, level, source, JSON.stringify(segments)],
      );
      // No native ON CONFLICT target since (source, title) isn't unique —
      // instead, delete-then-insert if a row already exists with this title.
      const { rowCount: existing } = await pool.query(
        "SELECT 1 FROM texts WHERE title = $1 AND source = $2",
        [title, source],
      );
      if ((existing ?? 0) > 1) {
        // duplicates: drop all but newest
        await pool.query(
          `DELETE FROM texts WHERE source = $1 AND title = $2 AND id NOT IN (
             SELECT MAX(id) FROM texts WHERE source = $1 AND title = $2
           )`,
          [source, title],
        );
      }
      console.log(`  + ${title}  (${body.length} chars, ${segments.length} segments)`);
    }
  }

  const { rows } = await pool.query<{ source: string; n: number }>(
    "SELECT source, COUNT(*)::int AS n FROM texts WHERE user_id IS NULL GROUP BY source ORDER BY source",
  );
  console.log("\nDone. texts table summary (shared):");
  console.table(rows);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
