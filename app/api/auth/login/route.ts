import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { comparePassword, signToken, COOKIE_NAME, authCookieOptions, normalizeEmail } from "@/lib/auth";
import { hit, reset, clientIp, tooManyRequests } from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 20;
const MAX_PER_EMAIL = 10;

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json();

    if (typeof rawEmail !== "string" || typeof password !== "string" || !rawEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const email = normalizeEmail(rawEmail);

    // Throttle before bcrypt so floods can't pin the CPU.
    const emailKey = `login:email:${email}`;
    const retryAfter =
      hit(`login:ip:${clientIp(request)}`, MAX_PER_IP, WINDOW_MS) ??
      hit(emailKey, MAX_PER_EMAIL, WINDOW_MS);
    if (retryAfter !== null) return tooManyRequests(retryAfter);

    // lower() also matches accounts registered before emails were normalized.
    const { rows } = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE lower(email) = $1 LIMIT 1",
      [email]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const user = rows[0];

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    reset(emailKey);

    const token = signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user: { id: user.id, email: user.email } });
    response.cookies.set(COOKIE_NAME, token, authCookieOptions(request));
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
