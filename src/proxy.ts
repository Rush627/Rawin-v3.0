import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSecretKey, SESSION_COOKIE_NAME } from "@/lib/auth-token";

/**
 * Runs before admin requests only (see the matcher).
 *  - /saint-denis: coarse sign-in gate (signature + expiry only). Real authorization — including
 *    the session-version check — happens in getAdminSession() on every admin page and action.
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

    return pass();
  } catch (err) {
    console.error("[Proxy] Unexpected error:", err instanceof Error ? err.message : String(err));
    return NextResponse.next();
  }
}

export { proxy as middleware };

export const config = {
  /*
   * The admin area only. Public pages need nothing from the proxy (nothing reads the
   * x-pathname header it sets), and on Netlify each matched request runs an edge function in
   * front of the cached page: matching every public page added that hop to every page load.
   * ":path*" also matches /saint-denis itself.
   */
  matcher: ["/saint-denis/:path*"],
};
