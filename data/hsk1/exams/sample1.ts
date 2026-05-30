// Sample HSK 1 mock exam, drawing on Lesson 3 vocabulary only.
// This is a scaffold — real HSK 1 has 40 questions (20 listening + 20 reading).
// Audio-driven listening is deferred; this exam is reading-only for v1.
//
// As more lessons are authored, expand this exam (and add sample2.ts, etc.)
// with the full 40-question format.

export type ExamQuestion =
  | {
      type: "translate_to_english";
      prompt: { hanzi: string; pinyin: string };
      choices: string[];
      answer: number;
    }
  | {
      type: "translate_to_chinese";
      prompt: string;
      choices: { hanzi: string; pinyin: string }[];
      answer: number;
    }
  | {
      type: "fill_blank";
      sentence: { before: string; blank: string; after: string; pinyin: string };
      translation: string;
      choices: string[];
      answer: number;
    }
  | {
      type: "true_false";
      prompt: { hanzi: string; pinyin: string };
      claim: string;
      answer: boolean;
    };

export interface MockExam {
  id: string;
  level: 1;
  title: string;
  section: "reading";
  questions: ExamQuestion[];
}

export const hsk1Sample1: MockExam = {
  id: "hsk1-sample-1",
  level: 1,
  title: "HSK 1 — Lesson 3 Sample Paper",
  section: "reading",
  questions: [
    {
      type: "translate_to_english",
      prompt: { hanzi: "老师", pinyin: "lǎoshī" },
      choices: ["student", "teacher", "friend", "Chinese person"],
      answer: 1,
    },
    {
      type: "translate_to_english",
      prompt: { hanzi: "学生", pinyin: "xuésheng" },
      choices: ["teacher", "school", "student", "American"],
      answer: 2,
    },
    {
      type: "translate_to_english",
      prompt: { hanzi: "美国", pinyin: "Měiguó" },
      choices: ["China", "England", "USA", "person"],
      answer: 2,
    },
    {
      type: "translate_to_chinese",
      prompt: "I (me)",
      choices: [
        { hanzi: "你", pinyin: "nǐ" },
        { hanzi: "我", pinyin: "wǒ" },
        { hanzi: "他", pinyin: "tā" },
        { hanzi: "是", pinyin: "shì" },
      ],
      answer: 1,
    },
    {
      type: "translate_to_chinese",
      prompt: "name",
      choices: [
        { hanzi: "什么", pinyin: "shénme" },
        { hanzi: "老师", pinyin: "lǎoshī" },
        { hanzi: "名字", pinyin: "míngzi" },
        { hanzi: "中国", pinyin: "Zhōngguó" },
      ],
      answer: 2,
    },
    {
      type: "fill_blank",
      sentence: { before: "你叫", blank: "?", after: "名字?", pinyin: "Nǐ jiào ___ míngzi?" },
      translation: "What's your name?",
      choices: ["什么", "是", "吗", "我"],
      answer: 0,
    },
    {
      type: "fill_blank",
      sentence: { before: "我", blank: "?", after: "老师。", pinyin: "Wǒ ___ lǎoshī." },
      translation: "I am a teacher.",
      choices: ["叫", "是", "什么", "吗"],
      answer: 1,
    },
    {
      type: "fill_blank",
      sentence: { before: "你是中国人", blank: "?", after: "?", pinyin: "Nǐ shì Zhōngguó rén ___?" },
      translation: "Are you Chinese?",
      choices: ["什么", "是", "吗", "我"],
      answer: 2,
    },
    {
      type: "true_false",
      prompt: { hanzi: "我是中国人。", pinyin: "Wǒ shì Zhōngguó rén." },
      claim: "I am Chinese.",
      answer: true,
    },
    {
      type: "true_false",
      prompt: { hanzi: "我不是老师,我是学生。", pinyin: "Wǒ bú shì lǎoshī, wǒ shì xuésheng." },
      claim: "I am a teacher.",
      answer: false,
    },
  ],
};
