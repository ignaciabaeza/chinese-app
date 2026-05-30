// Single entry point for all lesson content. Add HSK 2/3/4 here later.

import type { HSKLevel, Lesson, LessonSummary, Word, CharacterTaught, GrammarPoint } from "@/lib/types";
import { hsk1Lessons, hsk1Summaries } from "@/data/hsk1";

const LESSONS_BY_LEVEL: Record<HSKLevel, Lesson[]> = {
  1: hsk1Lessons,
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

const SUMMARIES_BY_LEVEL: Record<HSKLevel, () => LessonSummary[]> = {
  1: hsk1Summaries,
  2: () => [],
  3: () => [],
  4: () => [],
  5: () => [],
  6: () => [],
};

export function getLessonsByLevel(level: HSKLevel): Lesson[] {
  return LESSONS_BY_LEVEL[level];
}

export function getLessonSummaries(level: HSKLevel): LessonSummary[] {
  return SUMMARIES_BY_LEVEL[level]();
}

export function getLesson(level: HSKLevel, number: number): Lesson | undefined {
  return LESSONS_BY_LEVEL[level].find((l) => l.number === number);
}

/** All words in a level, in lesson order. */
export function getAllWords(level: HSKLevel): Array<Word & { lessonNumber: number }> {
  const out: Array<Word & { lessonNumber: number }> = [];
  for (const lesson of LESSONS_BY_LEVEL[level]) {
    for (const text of lesson.texts ?? []) {
      for (const w of text.newWords) out.push({ ...w, lessonNumber: lesson.number });
    }
  }
  return out;
}

/** All grammar points in a level. */
export function getAllGrammar(level: HSKLevel): Array<GrammarPoint & { lessonNumber: number; lessonTitle: string }> {
  const out: Array<GrammarPoint & { lessonNumber: number; lessonTitle: string }> = [];
  for (const lesson of LESSONS_BY_LEVEL[level]) {
    for (const g of lesson.notes ?? []) {
      out.push({ ...g, lessonNumber: lesson.number, lessonTitle: lesson.title.hanzi });
    }
  }
  return out;
}

/** All taught characters in a level (single-component, from Characters section). */
export function getAllCharacters(level: HSKLevel): Array<CharacterTaught & { lessonNumber: number }> {
  const out: Array<CharacterTaught & { lessonNumber: number }> = [];
  for (const lesson of LESSONS_BY_LEVEL[level]) {
    for (const c of lesson.characters?.singleComponentChars ?? []) {
      out.push({ ...c, lessonNumber: lesson.number });
    }
  }
  return out;
}

/** Total count of authored lessons across all levels. */
export function getTotalLessonCount(): number {
  return ([1, 2, 3, 4, 5, 6] as HSKLevel[]).reduce(
    (sum, lvl) => sum + LESSONS_BY_LEVEL[lvl].filter((l) => !l.stub).length,
    0
  );
}
