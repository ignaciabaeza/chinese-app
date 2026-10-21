import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";

/**
 * GET /api/dashboard — aggregate stats for the home dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getDashboard(auth.userId));
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Could not load stats" }, { status: 500 });
  }
}
