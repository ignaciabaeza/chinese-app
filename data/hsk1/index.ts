// HSK 1 lesson index. Real lessons live in /lessons/{N}.json; stubs are listed
// here with just title + theme so the course/list page can render the full
// 15-lesson outline before every lesson is fully authored.
//
// All lessons are original content: the official HSK 1 word list and grammar
// points, in the same lesson order as HSK Standard Course 1, with newly
// written dialogues, explanations, exercises and drills.

import type { Lesson, LessonSummary } from "@/lib/types";
import lesson1 from "./lessons/1.json";
import lesson2 from "./lessons/2.json";
import lesson3 from "./lessons/3.json";
import lesson4 from "./lessons/4.json";
import lesson5 from "./lessons/5.json";
import lesson6 from "./lessons/6.json";
import lesson7 from "./lessons/7.json";
import lesson8 from "./lessons/8.json";
import lesson9 from "./lessons/9.json";
import lesson10 from "./lessons/10.json";
import lesson11 from "./lessons/11.json";
import lesson12 from "./lessons/12.json";
import lesson13 from "./lessons/13.json";
import lesson14 from "./lessons/14.json";
import lesson15 from "./lessons/15.json";

type StubMeta = {
  number: number;
  title: { hanzi: string; pinyin: string; english: string };
  theme: string;
  /** Words listed in the table of contents — used as flashcard previews. */
  wordHints: string[];
  /** Grammar notes listed in the TOC (for the lesson card preview). */
  noteHints?: string[];
};

// Every HSK 1 lesson is authored now; kept so a future level can reuse the
// stub mechanism while lessons are being written.
const STUBS: StubMeta[] = [];

const REAL_LESSONS: Lesson[] = [
  lesson1 as Lesson,
  lesson2 as Lesson,
  lesson3 as Lesson,
  lesson4 as Lesson,
  lesson5 as Lesson,
  lesson6 as Lesson,
  lesson7 as Lesson,
  lesson8 as Lesson,
  lesson9 as Lesson,
  lesson10 as Lesson,
  lesson11 as Lesson,
  lesson12 as Lesson,
  lesson13 as Lesson,
  lesson14 as Lesson,
  lesson15 as Lesson,
];

/** All 15 HSK 1 lessons, in order. Real lessons take precedence over stubs. */
export const hsk1Lessons: Lesson[] = Array.from({ length: 15 }, (_, i) => {
  const number = i + 1;
  const real = REAL_LESSONS.find((l) => l.number === number);
  if (real) return real;
  const stub = STUBS.find((s) => s.number === number)!;
  return {
    id: `hsk1-${number}`,
    level: 1,
    number,
    title: stub.title,
    theme: stub.theme,
    stub: true,
    // Surface word hints as bare warm-up items so the lesson card has something to show.
    warmUp: {
      instruction: { hanzi: "本课词语预览", english: "Lesson word preview (full content coming soon)" },
      items: stub.wordHints.map((h) => ({ hanzi: h, pinyin: "", english: "" })),
    },
  };
});

/** Lightweight summaries for list pages. */
export function hsk1Summaries(): LessonSummary[] {
  return hsk1Lessons.map((l) => ({
    id: l.id,
    level: l.level,
    number: l.number,
    title: l.title,
    theme: l.theme,
    wordCount: countWords(l),
    grammarCount: l.notes?.length ?? 0,
    stub: l.stub ?? false,
  }));
}

function countWords(l: Lesson): number {
  if (!l.texts) return l.warmUp?.items.length ?? 0;
  return l.texts.reduce((sum, t) => sum + t.newWords.length + (t.properNouns?.length ?? 0), 0);
}
