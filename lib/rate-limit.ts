// In-memory fixed-window rate limiter for the auth routes.
//
// The app runs as a single PM2 process (fork mode), so a module-level Map is
// shared by every request. If it's ever scaled to multiple processes, move
// this to Postgres or Redis — each process would otherwise count separately.

import "server-only";
import { NextRequest, NextResponse } from "next/server";

interface Bucket { count: number; resetAt: number; }

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/**
 * Count one hit against `key`. Returns the seconds until the window resets
 * if the limit is exceeded, or null if the request is allowed.
 */
export function hit(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  sweep(now);
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  return b.count > limit ? Math.ceil((b.resetAt - now) / 1000) : null;
}

/** Clear a key, e.g. after a successful login. */
export function reset(key: string) {
  buckets.delete(key);
}

/**
 * Client IP. nginx sets X-Real-IP from $remote_addr; the app listens only on
 * 127.0.0.1 so the header can't be spoofed by hitting port 3000 directly.
 */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
