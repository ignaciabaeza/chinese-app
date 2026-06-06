// Server-only grammar helpers. Source is the authored lesson content under
// data/hsk{N}/lessons/*.json — there's no grammar_points DB table because the
// lesson JSON is already the canonical, richer source.

import "server-only";
import { getAllGrammar } from "@/lib/content";
import type { HSKLevel, GrammarPoint } from "@/lib/types";

export interface GrammarSummary {
  gpId: string;          // composite "hsk2-l3-g_shi"
  level: HSKLevel;
  lessonNumber: number;
  lessonTitle: string;
  title: { hanzi: string; english: string };
  pattern: string | null;
}

export interface GrammarDetail extends GrammarSummary {
  point: GrammarPoint;   // full authored point
}

const LEVELS: HSKLevel[] = [1, 2];

function makeGpId(level: HSKLevel, lessonNumber: number, gId: string): string {
  return `hsk${level}-l${lessonNumber}-${gId}`;
}

function parseGpId(gpId: string): { level: HSKLevel; lessonNumber: number; gId: string } | null {
  const m = /^hsk(\d+)-l(\d+)-(.+)$/.exec(gpId);
  if (!m) return null;
  const level = parseInt(m[1], 10) as HSKLevel;
  const lessonNumber = parseInt(m[2], 10);
  return { level, lessonNumber, gId: m[3] };
}

function summarize(level: HSKLevel, lessonNumber: number, lessonTitle: string, g: GrammarPoint): GrammarSummary {
  // Pattern is sometimes in patternTable.rows[0] (a typical template row),
  // sometimes only implicit in examples. Synthesize a short pattern string
  // for list display when available.
  let pattern: string | null = null;
  if (g.patternTable && g.patternTable.columns.length > 0) {
    pattern = g.patternTable.columns.join(" + ");
  }
  return {
    gpId: makeGpId(level, lessonNumber, g.id),
    level,
    lessonNumber,
    lessonTitle,
    title: { hanzi: g.title.hanzi, english: g.title.english },
    pattern,
  };
}

/** All HSK 1-2 grammar points, ordered by level then lesson then point number. */
export function listAllGrammar(): GrammarSummary[] {
  const out: GrammarSummary[] = [];
  for (const level of LEVELS) {
    const points = getAllGrammar(level);
    for (const p of points) {
      out.push(summarize(level, p.lessonNumber, p.lessonTitle, p));
    }
  }
  return out;
}

export function getGrammarPoint(gpId: string): GrammarDetail | null {
  const parsed = parseGpId(gpId);
  if (!parsed) return null;
  const all = getAllGrammar(parsed.level);
  const match = all.find((g) => g.lessonNumber === parsed.lessonNumber && g.id === parsed.gId);
  if (!match) return null;
  const summary = summarize(parsed.level, match.lessonNumber, match.lessonTitle, match);
  return { ...summary, point: match };
}

/**
 * Pick an example sentence for the scramble exercise. Prefer the shortest
 * example >= 3 characters of Chinese (longer ones turn into too many chips).
 */
export function pickScrambleExample(point: GrammarPoint): { hanzi: string; pinyin: string; english?: string } | null {
  const examples = point.examples ?? [];
  if (examples.length === 0) return null;
  const candidates = examples
    .filter((e) => e.hanzi && e.hanzi.replace(/[^一-鿿]/g, "").length >= 3)
    .sort((a, b) => a.hanzi.length - b.hanzi.length);
  return candidates[0] ?? examples[0];
}
