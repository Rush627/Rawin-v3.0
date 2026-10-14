import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSecretKey, SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { maintenanceGate, publicSlugExists, withinDeadline } from "@/lib/request-gate";

/** How long the proxy waits for a gate answer before letting the request continue (see withinDeadline). */
const GATE_DEADLINE_MS = 1000;

function noteSkippedGate(check: string, pathname: string, reason: "timeout" | "error") {
  // visible in the server / function logs; never includes cookies, headers or query strings
  console.warn(`[Proxy] ${check} check ${reason === "timeout" ? `not answered within ${GATE_DEADLINE_MS}ms` : "failed"}; request continued: ${pathname}`);
}

/**
 * Runs before every non-static request.
 *  - /saint-denis: coarse sign-in gate (signature + expiry only). Real authorization — including
 *    the session-version check — happens in getAdminSession() on every admin page and action.
 *  - Public pages while maintenance/offline is on: the maintenance page with HTTP 503 (the site's
 *    own pages are never rendered, hidden or otherwise). A signed-in admin still sees the site.
 *  - /projects/<slug> and /blog/<slug> that do not exist: the site's not-found page with a real
 *    HTTP 404, decided before the response starts streaming (after that the status is fixed).
 */

async function hasAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return payload.role === "admin" && typeof payload.email === "string";
  } catch {
    return false;
  }
}

/** Public page routes (not APIs, framework files, static files or the maintenance page). */
function isPublicPage(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname === "/maintenance") return false;
  if (pathname.startsWith("/saint-denis")) return false;
  return !/\.[a-z0-9]{2,5}$/i.test(pathname);
}

const MISSING_PATH = "/__rawin-not-found";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  try {
    if (pathname.startsWith("/saint-denis")) {
      const isAuthenticated = await hasAdminToken(request);
      if (pathname === "/saint-denis/login") {
        return isAuthenticated ? NextResponse.redirect(new URL("/saint-denis", request.url)) : pass();
      }
      if (!isAuthenticated) {
        const loginUrl = new URL("/saint-denis/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return pass();
    }

    if (!isPublicPage(pathname)) return pass();

    // Maintenance / offline: the database is the source of truth; if it cannot be read in time
    // the request continues and the page itself shows the maintenance screen (the public layout
    // reads the same setting from the cached site content, so no site content is rendered).
    const gate = await withinDeadline(maintenanceGate(), GATE_DEADLINE_MS);
    if (!gate.ok) {
      noteSkippedGate("Maintenance", pathname, gate.reason);
    } else if (gate.value.active && !(await hasAdminToken(request))) {
      const res = NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503 });
      res.headers.set("Retry-After", "300");
      res.headers.set("X-Robots-Tag", "noindex");
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const detail = /^\/(projects|blog)\/([^/]+)\/?$/.exec(pathname);
    if (detail) {
      let slug = detail[2];
      try {
        slug = decodeURIComponent(slug);
      } catch {}
      const found = await withinDeadline(publicSlugExists(detail[1] === "projects" ? "project" : "post", slug), GATE_DEADLINE_MS);
      if (!found.ok) noteSkippedGate("Slug", pathname, found.reason);
      else if (!found.value) return NextResponse.rewrite(new URL(MISSING_PATH, request.url), { status: 404 });
    }

    return pass();
  } catch (err) {
    console.error("[Proxy] Unexpected error:", err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
}

export { proxy as middleware };

export const config = {
  matcher: [
    /*
     * Pages only: framework files, API routes, bundled asset folders and static files never
     * need this gate (each excluded request is one less proxy invocation).
     */
    "/((?!_next/static|_next/image|api/|brand/|defaults/|icons/|images/|favicon.ico|icon.png|.*\\.(?:png|jpe?g|webp|gif|svg|ico|pdf|txt|xml|json|woff2?|mp4|webm)$).*)",
  ],
};
