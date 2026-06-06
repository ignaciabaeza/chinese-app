import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getLessonRow, seedLessonWordsForUser } from "@/lib/lessons";

/**
 * POST /api/lessons/[level]/[number]/seed-words
 * Add every word from this lesson to the signed-in user's recognition
 * deck. Idempotent — words already in the deck are silently skipped.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ level: string; number: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { level, number } = await params;
  const lvl = parseInt(level, 10);
  const num = parseInt(number, 10);
  if (!Number.isFinite(lvl) || !Number.isFinite(num)) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  const lesson = await getLessonRow(lvl as 1 | 2, num);
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const added = await seedLessonWordsForUser(auth.userId, lesson.id);
  return NextResponse.json({ added });
}
