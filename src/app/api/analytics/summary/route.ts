import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_RANGES, type AnalyticsRange } from "@/lib/analytics/model";
import { SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { checkAuraRateLimit } from "@/lib/aura/rate-limit";
import { getPublicAnalytics } from "@/lib/analytics/report";
import { viewerFromRequest } from "@/lib/analytics/viewer";
import { publicApiGate } from "@/lib/public-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aggregated public figures for one reporting window (what /analytics shows). No event-level
 * data, visitor codes or settings are ever returned. The response also carries the viewer's own
 * country and whether their visit is in its count, so it is private to the requester and never
 * cached at the edge (stored figures are still read through the one-minute server cache).
 *
 * `fresh=1` (the page's Refresh traffic control) reads the stored figures now instead of the
 * cached copy. It is a read only: nothing is recorded or written. Fresh reads are limited per
 * client and shared between concurrent requests (store.ts), so the control cannot load the
 * database; over the limit the request is refused with 429 and the page offers a retry.
 */
export async function GET(req: NextRequest) {
  const closed = await publicApiGate("Analytics");
  if (closed) return closed;

  const raw = req.nextUrl.searchParams.get("range") || "7d";
  if (!(ANALYTICS_RANGES as readonly string[]).includes(raw)) {
    return NextResponse.json({ error: "Unknown range." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  if (fresh) {
    const client = req.headers.get("x-nf-client-connection-ip")?.trim() || "unidentified";
    const limit = checkAuraRateLimit(`analytics-fresh:${client}`, 12, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many refreshes." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
    }
  }
  const viewer = viewerFromRequest(req.headers, req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const data = await getPublicAnalytics(raw as AnalyticsRange, viewer, Date.now(), { fresh });
  return NextResponse.json(data, { status: data.available ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
}
