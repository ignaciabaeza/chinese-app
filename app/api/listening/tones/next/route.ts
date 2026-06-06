import { NextRequest, NextResponse } from "next/server";
import { pickToneWord } from "@/lib/listening";

/**
 * GET /api/listening/tones/next?exclude=42
 * Returns a random HSK 1-2 multi-syllable word with audio, plus four
 * tone-pattern options (correct + 3 distractors, shuffled).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeId = excludeParam ? parseInt(excludeParam, 10) : undefined;
  const drill = await pickToneWord(excludeId);
  if (!drill) return NextResponse.json({ error: "No words available" }, { status: 404 });
  return NextResponse.json(drill);
}
