import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isJwtExpired } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

function readToken(request: NextRequest): string | null {
  const raw = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const token = readToken(request);
  const hasValidToken = !!token && !isJwtExpired(token);

  if (token && !hasValidToken) {
    if (isLogin) {
      const response = NextResponse.next();
      clearAuthCookie(response);
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    clearAuthCookie(response);
    return response;
  }

  if (!hasValidToken && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasValidToken && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/courses";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
