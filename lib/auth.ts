import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "hanyu_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface AuthPayload {
  userId: string;
  email: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function getAuthFromRequest(request: NextRequest): AuthPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Whether the incoming request actually came in over HTTPS. Trusts
 * X-Forwarded-Proto (nginx in front of us sets it from $scheme). Falls
 * back to the request URL's protocol. Used so we don't mark the auth
 * cookie Secure on HTTP-only deployments — browsers refuse to send
 * Secure cookies over HTTP, which would log the user out on every
 * reload.
 */
export function isRequestHttps(request: NextRequest): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return request.nextUrl.protocol === "https:";
}

/** Standard cookie options for the auth token. Lets the route force https. */
export function authCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: isRequestHttps(request),
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
