import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { checkAuraRateLimit } from "@/lib/aura/rate-limit";
import { cleanTrackPath, countryFromGeoHeader, isLikelyBot } from "@/lib/analytics/model";
import { recordPageView, visitorCode } from "@/lib/analytics/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const done = (status: number) => new NextResponse(null, { status, headers: NO_STORE });

/**
 * Records one page view of a public page (sent by the AnalyticsTracker after each navigation).
 * Accepts only { path }. Skips bots, the signed-in owner and non-public paths without saying so
 * (always 204), deduplicates per visitor / path / 10 s on the server, rate-limits per client, and
 * stores no IP address, user agent or cookie. Geography comes only from Netlify's own headers.
 */
export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > 512) return done(413);
  let path: string | null = null;
  try {
    const text = await req.text();
    if (text.length > 512) return done(413);
    path = cleanTrackPath(JSON.parse(text)?.path);
  } catch {
    return done(400);
  }
  if (!path) return done(400);

  const ua = req.headers.get("user-agent");
  if (isLikelyBot(ua)) return done(204);
  // the owner's own browsing (signed in to Studio) is not visitor traffic
  if (req.cookies.get(SESSION_COOKIE_NAME)?.value) return done(204);

  // Netlify's edge supplies the client address and geography; client-set forwarding headers are
  // never trusted. Without the edge headers (e.g. local runs) the address is unknown and so is the country.
  const edgeAddress = req.headers.get("x-nf-client-connection-ip")?.trim() || "";
  // Only traffic that came through the hosting edge is real visitor traffic: local and preview
  // servers share the live database, so they record nothing (unless explicitly enabled for an
  // isolated test database)
  if (!edgeAddress && process.env.ANALYTICS_RECORD_LOCAL !== "1") return done(204);
  const country = edgeAddress ? countryFromGeoHeader(req.headers.get("x-nf-geo")) : null;

  const limit = checkAuraRateLimit(`pv:${edgeAddress || "unidentified"}`, 60, 60_000);
  if (!limit.allowed) return done(429);

  try {
    const now = Date.now();
    await recordPageView({ path, visitor: visitorCode(edgeAddress || "unidentified", ua || "", now), country, now });
  } catch {
    // the store is unavailable: report it without detail; navigation never waits on this
    return done(503);
  }
  return done(204);
}
