// HSK 1 lesson index. Real lessons live in /lessons/{N}.json; stubs are listed
// here with just title + theme so the course/list page can render the full
// 15-lesson outline before every lesson is fully authored.
//
// Source: HSK Standard Course 1 (Beijing Language and Culture University Press,
// Jiang Liping, lead author, 2014). Table of contents pages 14–17.

import type { Lesson, LessonSummary } from "@/lib/types";
import lesson3 from "./lessons/3.json";

type StubMeta = {
  number: number;
  title: { hanzi: string; pinyin: string; english: string };
  theme: string;
  /** Words listed in the table of contents — used as flashcard previews. */
  wordHints: string[];
  /** Grammar notes listed in the TOC (for the lesson card preview). */
  noteHints?: string[];
};

const STUBS: StubMeta[] = [
  {
    number: 1,
    title: { hanzi: "你好", pinyin: "Nǐ hǎo", english: "Hello" },
    theme: "Greetings",
    wordHints: ["你", "好", "您", "你们", "对不起", "没关系"],
  },
  {
    number: 2,
    title: { hanzi: "谢谢你", pinyin: "Xièxie nǐ", english: "Thank you" },
    theme: "Greetings",
    wordHints: ["谢谢", "不", "不客气", "再见"],
  },
  // Lesson 3 lives in lessons/3.json — fully authored.
  {
    number: 4,
    title: { hanzi: "她是我的汉语老师", pinyin: "Tā shì wǒ de Hànyǔ lǎoshī", english: "She is my Chinese teacher" },
    theme: "Introductions",
    wordHints: ["她", "谁", "的", "汉语", "哪", "国", "呢", "他", "同学", "朋友"],
    noteHints: ["The Interrogative Pronouns 谁 and 哪", "The Structural Particle 的", "The Interrogative Particle 呢 (1)"],
  },
  {
    number: 5,
    title: { hanzi: "她女儿今年二十岁", pinyin: "Tā nǚ'ér jīnnián èrshí suì", english: "Her daughter is 20 years old this year" },
    theme: "Family & Age",
    wordHints: ["家", "有", "口", "女儿", "几", "岁", "了", "今年", "多", "大"],
    noteHints: ["The Interrogative Pronoun 几", "Numbers below 100", "了 indicating a change", "多+大"],
  },
  {
    number: 6,
    title: { hanzi: "我会说汉语", pinyin: "Wǒ huì shuō Hànyǔ", english: "I can speak Chinese" },
    theme: "Abilities",
    wordHints: ["会", "说", "妈妈", "菜", "很", "好吃", "做", "写", "汉字", "字", "怎么", "读"],
    noteHints: ["The Modal Verb 会 (1)", "Sentences with an Adjectival Predicate", "The Interrogative Pronoun 怎么 (1)"],
  },
  {
    number: 7,
    title: { hanzi: "今天几号", pinyin: "Jīntiān jǐ hào", english: "What's the date today" },
    theme: "Dates & Days",
    wordHints: ["请", "问", "今天", "号", "月", "星期", "昨天", "明天", "去", "学校", "看", "书"],
    noteHints: ["Expression of a Date (1)", "Sentences with a Nominal Predicate", "Sentences with a Serial Verb Construction (1)"],
  },
  {
    number: 8,
    title: { hanzi: "我想喝茶", pinyin: "Wǒ xiǎng hē chá", english: "I'd like some tea" },
    theme: "Shopping & Food",
    wordHints: ["想", "喝", "茶", "吃", "米饭", "下午", "商店", "买", "个", "杯子", "多少", "钱", "块", "那"],
    noteHints: ["The Modal Verb 想", "The Interrogative Pronoun 多少", "Measure Words 个 and 口", "Expression of the Amount of Money"],
  },
  {
    number: 9,
    title: { hanzi: "你儿子在哪儿工作", pinyin: "Nǐ érzi zài nǎr gōngzuò", english: "Where does your son work" },
    theme: "Location",
    wordHints: ["小", "猫", "在", "那儿", "狗", "椅子", "下面", "哪儿", "工作", "儿子", "医院", "医生", "爸爸"],
    noteHints: ["The Verb 在", "The Interrogative Pronoun 哪儿", "The Preposition 在", "The Interrogative Particle 呢 (2)"],
  },
  {
    number: 10,
    title: { hanzi: "我能坐这儿吗", pinyin: "Wǒ néng zuò zhèr ma", english: "Can I sit here" },
    theme: "Location",
    wordHints: ["桌子", "上", "电脑", "和", "本", "里", "前面", "后面", "这儿", "没有", "能", "坐"],
    noteHints: ["The 有 Sentence (existence)", "The Conjunction 和", "The Modal Verb 能", "Imperative Sentences with 请"],
  },
  {
    number: 11,
    title: { hanzi: "现在几点", pinyin: "Xiànzài jǐ diǎn", english: "What's the time now" },
    theme: "Time",
    wordHints: ["现在", "点", "分", "中午", "吃饭", "时候", "回", "我们", "电影", "住", "前", "北京"],
    noteHints: ["Expression of Time", "Time Word Used as an Adverbial", "The Noun 前"],
  },
  {
    number: 12,
    title: { hanzi: "明天天气怎么样", pinyin: "Míngtiān tiānqì zěnmeyàng", english: "What will the weather be like tomorrow" },
    theme: "Weather",
    wordHints: ["天气", "怎么样", "太", "热", "冷", "下雨", "小姐", "来", "身体", "爱", "些", "水果", "水"],
    noteHints: ["The Interrogative Pronoun 怎么样", "Subject-Predicate Phrase as Predicate", "The Adverb 太", "The Modal Verb 会 (2)"],
  },
  {
    number: 13,
    title: { hanzi: "他在学做中国菜呢", pinyin: "Tā zài xué zuò Zhōngguó cài ne", english: "He is learning to cook Chinese food" },
    theme: "Daily Activities",
    wordHints: ["喂", "地", "学习", "上午", "睡觉", "电视", "喜欢", "给", "打电话", "吧", "大卫"],
    noteHints: ["The Interjection 喂", "在……呢 (action in progress)", "Expression of Telephone Numbers", "The Modal Particle 吧"],
  },
  {
    number: 14,
    title: { hanzi: "她买了不少衣服", pinyin: "Tā mǎi le bùshǎo yīfu", english: "She has bought quite a few clothes" },
    theme: "Shopping",
    wordHints: ["东西", "一点儿", "苹果", "看见", "先生", "开", "车", "回来", "分钟", "后", "衣服", "漂亮", "啊", "少", "这些", "都", "张"],
    noteHints: ["了 indicating completion", "The Noun 后", "The Modal Particle 啊", "The Adverb 都"],
  },
  {
    number: 15,
    title: { hanzi: "我是坐飞机来的", pinyin: "Wǒ shì zuò fēijī lái de", english: "I came here by air" },
    theme: "Travel",
    wordHints: ["认识", "年", "大学", "饭店", "出租车", "一起", "高兴", "听", "飞机"],
    noteHints: ["The 是……的 structure", "Expression of a Date (2)"],
  },
];

const REAL_LESSONS: Lesson[] = [lesson3 as Lesson];

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
