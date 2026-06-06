import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getLessonRow, markStepComplete, STEP_ORDER, type StepKey } from "@/lib/lessons";

/**
 * POST /api/lessons/[level]/[number]/progress
 *   body: { step: StepKey }
 * Marks a stepper step complete for the signed-in user. Returns the full
 * steps_completed array.
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

  let body: { step?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.step || !STEP_ORDER.includes(body.step as StepKey)) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  const lesson = await getLessonRow(lvl as 1 | 2, num);
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const stepsCompleted = await markStepComplete(auth.userId, lesson.id, body.step as StepKey);
  return NextResponse.json({ stepsCompleted });
}
