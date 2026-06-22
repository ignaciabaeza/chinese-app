import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { recordAttempt } from "@/lib/workbook";

/**
 * POST /api/workbook/attempt
 *   { exerciseId: number, correct: boolean, userAnswer: unknown }
 * Stores the attempt; client computed correctness (server trusts it — this is
 * a personal app, no incentive to fake answers).
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as
    | { exerciseId?: number; correct?: boolean; userAnswer?: unknown }
    | null;
  if (!body || typeof body.exerciseId !== "number" || typeof body.correct !== "boolean") {
    return NextResponse.json({ error: "expected { exerciseId, correct, userAnswer? }" }, { status: 400 });
  }

  await recordAttempt(auth.userId, body.exerciseId, body.correct, body.userAnswer);
  return NextResponse.json({ ok: true });
}
