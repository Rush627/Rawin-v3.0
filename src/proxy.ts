import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSecretKey, SESSION_COOKIE_NAME } from "@/lib/auth-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Only protect admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const secretKey = getSecretKey();
      const { payload } = await jwtVerify(sessionCookie, secretKey, {
        algorithms: ["HS256"],
      });
      if (payload.role === "admin" && typeof payload.email === "string") {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. If user is at /admin/login:
  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      // Already logged in: redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. If user is at any other /admin route and not authenticated:
  if (!isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export { proxy as middleware };

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|images/).*)",
  ],
};
