import { NextRequest, NextResponse } from "next/server";
import { pickDictationSentence } from "@/lib/listening";

/**
 * GET /api/listening/dictation/next?exclude=123
 * Returns a random HSK 1-2 sentence with audio for dictation drills.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeId = excludeParam ? parseInt(excludeParam, 10) : undefined;
  const sentence = await pickDictationSentence(excludeId);
  if (!sentence) return NextResponse.json({ error: "No audio sentences available" }, { status: 404 });
  return NextResponse.json(sentence);
}
