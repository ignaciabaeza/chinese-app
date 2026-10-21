// Server-only helpers for "today" in the user's own timezone. The DB and the
// server run in UTC, so anything daily (new-card quota, reviewed today,
// streak) must be computed against users.timezone, which the client reports
// via POST /api/auth/timezone.

import "server-only";
import { pool } from "@/lib/db";

export interface UserDay {
  /** IANA timezone, e.g. "America/Santiago". */
  tz: string;
  /** The instant the user's current local day started. */
  todayStart: Date;
  /** The user's current local date, "YYYY-MM-DD". */
  today: string;
}

export async function getUserDay(userId: string): Promise<UserDay> {
  const { rows } = await pool.query<{ tz: string; today_start: Date; today: string }>(
    `SELECT timezone AS tz,
            date_trunc('day', NOW() AT TIME ZONE timezone) AT TIME ZONE timezone AS today_start,
            (NOW() AT TIME ZONE timezone)::date::text AS today
     FROM users WHERE id = $1`,
    [userId],
  );
  const row = rows[0];
  if (row) return { tz: row.tz, todayStart: row.today_start, today: row.today };
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return { tz: "UTC", todayStart: start, today: start.toISOString().slice(0, 10) };
}

/** Whether Postgres knows this IANA timezone name. */
export async function isKnownTimeZone(tz: string): Promise<boolean> {
  if (!tz || tz.length > 64) return false;
  const { rows } = await pool.query("SELECT 1 FROM pg_timezone_names WHERE name = $1", [tz]);
  return rows.length > 0;
}
