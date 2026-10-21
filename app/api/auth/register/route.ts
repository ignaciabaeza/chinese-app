import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { hashPassword, signToken, COOKIE_NAME, authCookieOptions, normalizeEmail } from "@/lib/auth";
import { hit, clientIp, tooManyRequests } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;
const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json();

    if (typeof rawEmail !== "string" || typeof password !== "string" || !rawEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const email = normalizeEmail(rawEmail);
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
    }
    if (password.length > 200) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    const retryAfter = hit(`register:ip:${clientIp(request)}`, MAX_PER_IP, WINDOW_MS);
    if (retryAfter !== null) return tooManyRequests(retryAfter);

    const existing = await pool.query("SELECT id FROM users WHERE lower(email) = $1 LIMIT 1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      const { rows } = await pool.query(
        "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email",
        [randomUUID(), email, passwordHash]
      );
      user = rows[0];
    } catch (err) {
      // Two concurrent sign-ups with the same email: the unique constraint wins.
      if ((err as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
      throw err;
    }

    const token = signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, authCookieOptions(request));
    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
