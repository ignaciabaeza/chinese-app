import { NextRequest, NextResponse } from "next/server";
import { pickShadowingSentence } from "@/lib/listening";

/**
 * GET /api/shadowing/next?exclude=123
 * Returns a random HSK 1-2 sentence with audio for shadowing practice.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeId = excludeParam ? parseInt(excludeParam, 10) : undefined;
  const sentence = await pickShadowingSentence(excludeId);
  if (!sentence) return NextResponse.json({ error: "No audio sentences available" }, { status: 404 });
  return NextResponse.json(sentence);
}
