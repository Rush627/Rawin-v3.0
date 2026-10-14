import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSecretKey, SESSION_COOKIE_NAME } from "@/lib/auth-token";

/**
 * Runs before every non-static request.
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
  matcher: [
    /*
     * Pages only: framework files, API routes, bundled asset folders and static files never
     * need this gate (each excluded request is one less proxy invocation).
     */
    "/((?!_next/static|_next/image|api/|brand/|defaults/|icons/|images/|favicon.ico|icon.png|manifest.webmanifest|.*\\.(?:png|jpe?g|webp|gif|svg|ico|pdf|txt|xml|json|webmanifest|woff2?|mp4|webm)$).*)",
  ],
};
