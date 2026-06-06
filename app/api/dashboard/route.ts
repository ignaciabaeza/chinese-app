import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDashboard } from "@/lib/dashboard";

/**
 * GET /api/dashboard — aggregate stats for the home dashboard.
 */
export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getDashboard(auth.userId);
  return NextResponse.json(data);
}
