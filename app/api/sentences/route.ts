import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GRAMMAR_FOCUS: Record<number, string> = {
  1: "basic SVO sentences, 是 (to be), 有 (to have), 不 negation, simple questions with 吗 and question words (什么/哪/谁/哪儿/几/多少)",
  2: "sentence-final 了 (completed action), 过 (past experience), 在 (location), 想 (want to), 会 (can/will), comparisons with 比, 的 for possession, time expressions",
  3: "把 construction, 被 passive, resultative complements (verb+好/完/到), 虽然…但是, 因为…所以, 如果…就, directional complements",
  4: "是…的 construction for emphasis, potential complements (verb+得/不+result), 连…都/也, pivot sentences, 让/叫/使, complex relative clauses",
  5: "formal written expressions, 由于/尽管/即使/宁可, complex 把 with resultative complements, nominalisation with 的, 所 + verb, 之",
  6: "literary patterns, 4-character idioms (成语), classical connectives, concessive clauses, formal rhetoric, abstract noun phrases",
};

async function generateSentences(level: number): Promise<Array<{
  chinese: string;
  pinyin: string;
  english: string;
  grammar: string;
  pattern: string;
}>> {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Generate exactly 20 Mandarin Chinese flashcard sentences for HSK level ${level} learners.

Grammar focus: ${GRAMMAR_FOCUS[level]}

Requirements:
- Use only vocabulary appropriate for HSK ${level} and below
- Each sentence must clearly demonstrate one grammar pattern
- Sentences should be natural and practical (daily life topics)
- Vary the topics: family, food, work, time, places, feelings, hobbies
- Sentences should be 6–15 characters long

Return ONLY a valid JSON array with exactly 20 objects. No explanation, no markdown, no code fences.
Each object must have these exact keys:
- "chinese": the sentence in simplified Chinese characters
- "pinyin": full pinyin with tone marks (space-separated by word)
- "english": natural English translation
- "grammar": one sentence explaining the grammar point demonstrated (in English)
- "pattern": the abstract sentence pattern, e.g. "Subject + 比 + Object + Adjective"

Example format:
[{"chinese":"...","pinyin":"...","english":"...","grammar":"...","pattern":"..."}]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.trim());
}

// GET /api/sentences?level=2 — fetch sentences for a level, generate if none exist
export async function GET(request: NextRequest) {
  const level = parseInt(request.nextUrl.searchParams.get("level") ?? "1");
  if (level < 1 || level > 6) {
    return NextResponse.json({ error: "Level must be 1–6" }, { status: 400 });
  }

  const existing = await prisma.sentence.findMany({ where: { level } });
  if (existing.length > 0) {
    return NextResponse.json({ sentences: existing });
  }

  // None in DB — generate and save
  const generated = await generateSentences(level);
  const saved = await prisma.$transaction(
    generated.map((s) =>
      prisma.sentence.create({
        data: { level, chinese: s.chinese, pinyin: s.pinyin, english: s.english, grammar: s.grammar, pattern: s.pattern },
      })
    )
  );

  return NextResponse.json({ sentences: saved });
}

// POST /api/sentences/refresh?level=2 — delete existing and regenerate
export async function POST(request: NextRequest) {
  const level = parseInt(request.nextUrl.searchParams.get("level") ?? "1");
  if (level < 1 || level > 6) {
    return NextResponse.json({ error: "Level must be 1–6" }, { status: 400 });
  }

  await prisma.sentence.deleteMany({ where: { level } });
  const generated = await generateSentences(level);
  const saved = await prisma.$transaction(
    generated.map((s) =>
      prisma.sentence.create({
        data: { level, chinese: s.chinese, pinyin: s.pinyin, english: s.english, grammar: s.grammar, pattern: s.pattern },
      })
    )
  );

  return NextResponse.json({ sentences: saved, refreshed: true });
}
