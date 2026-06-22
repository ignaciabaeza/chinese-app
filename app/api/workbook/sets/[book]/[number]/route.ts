import { NextRequest, NextResponse } from "next/server";
import { getExerciseSet } from "@/lib/workbook";

/**
 * GET /api/workbook/sets/[book]/[number] — fetch one set.
 *   /api/workbook/sets/hsk2/3
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ book: string; number: string }> },
) {
  const { book, number } = await ctx.params;
  const n = parseInt(number, 10);
  if (!/^hsk\d+$/.test(book) || !Number.isFinite(n)) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const set = await getExerciseSet(book, n);
  if (!set) return NextResponse.json({ error: "not found — generate exercises first" }, { status: 404 });
  return NextResponse.json(set);
}
