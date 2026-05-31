// HSK 2 lesson index. Same shape as HSK 1.
//
// Source: HSK Standard Course 2 (Beijing Language and Culture University Press,
// Jiang Liping, lead author, 2014). Table of contents pages 14–17.

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
  wordHints: string[];
  noteHints?: string[];
};

const STUBS: StubMeta[] = [
  // All 15 lessons are fully authored — STUBS array is empty.
];

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

export const hsk2Lessons: Lesson[] = Array.from({ length: 15 }, (_, i) => {
  const number = i + 1;
  const real = REAL_LESSONS.find((l) => l.number === number);
  if (real) return real;
  const stub = STUBS.find((s) => s.number === number)!;
  return {
    id: `hsk2-${number}`,
    level: 2,
    number,
    title: stub.title,
    theme: stub.theme,
    stub: true,
    warmUp: {
      instruction: { hanzi: "本课词语预览", english: "Lesson word preview (full content coming soon)" },
      items: stub.wordHints.map((h) => ({ hanzi: h, pinyin: "", english: "" })),
    },
  };
});

export function hsk2Summaries(): LessonSummary[] {
  return hsk2Lessons.map((l) => ({
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
