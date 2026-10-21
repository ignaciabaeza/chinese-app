import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import { isKnownTimeZone } from "@/lib/user-time";

/**
 * POST /api/auth/timezone
 *   body: { timezone: string }  — IANA name from Intl.DateTimeFormat
 * Stores the browser's timezone so daily quotas and streaks roll over at the
 * user's local midnight.
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let timezone: unknown;
  try {
    ({ timezone } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof timezone !== "string" || !(await isKnownTimeZone(timezone))) {
    return NextResponse.json({ error: "Unknown timezone" }, { status: 400 });
  }

  await pool.query(
    "UPDATE users SET timezone = $1, updated_at = NOW() WHERE id = $2 AND timezone IS DISTINCT FROM $1",
    [timezone, auth.userId],
  );
  return NextResponse.json({ ok: true });
}
