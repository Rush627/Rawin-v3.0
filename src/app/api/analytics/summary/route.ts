import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_RANGES, type AnalyticsRange } from "@/lib/analytics/model";
import { SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { getPublicAnalytics } from "@/lib/analytics/report";
import { viewerFromRequest } from "@/lib/analytics/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aggregated public figures for one reporting window (what /analytics shows). No event-level
 * data, visitor codes or settings are ever returned. The response also carries the viewer's own
 * country and whether their visit is in its count, so it is private to the requester and never
 * cached at the edge (stored figures are still read through the one-minute server cache).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("range") || "7d";
  if (!(ANALYTICS_RANGES as readonly string[]).includes(raw)) {
    return NextResponse.json({ error: "Unknown range." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const viewer = viewerFromRequest(req.headers, req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const data = await getPublicAnalytics(raw as AnalyticsRange, viewer);
  return NextResponse.json(data, { status: data.available ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
}
