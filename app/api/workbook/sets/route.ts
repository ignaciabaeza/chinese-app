import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { listExerciseSets } from "@/lib/workbook";

/** GET /api/workbook/sets — list available sets, with per-user stats if logged in. */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  const sets = await listExerciseSets(auth?.userId ?? null);
  return NextResponse.json({ sets });
}
