import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createPastedText } from "@/lib/reader";

/**
 * POST /api/reader/import
 *   body: { title: string, body: string }
 * Creates a paste-in text owned by the current user. Returns { id }.
 */
export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (body.body.length > 50_000) {
    return NextResponse.json({ error: "body too large (50k char limit)" }, { status: 413 });
  }

  const id = await createPastedText(auth.userId, body.title ?? "", body.body);
  return NextResponse.json({ id });
}
