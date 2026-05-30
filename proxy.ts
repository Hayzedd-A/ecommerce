import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { adminPaths, authPaths, protectedPaths } from "./lib/api/client";

/* -------------------------------------------------------------------------- */
/*  Next.js 16 Proxy — replaces middleware.ts                                  */
/*  Runs at the network boundary to protect routes and pass user context.      */
/* -------------------------------------------------------------------------- */

const accessSecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "fallback-secret-change-me",
);

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ---- Try to extract user from access token ---- */
  const token = request.cookies.get("access_token")?.value;
  let user: { id: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, accessSecret);
      user = {
        id: payload.id as string,
        email: payload.email as string,
        role: payload.role as string,
      };
    } catch {
      // Token expired or invalid — treat as unauthenticated
      user = null;
    }
  }

  /* ---- Redirect authenticated users away from auth pages ---- */
  if (user && matchesPath(pathname, authPaths)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  /* ---- Protect /account/* routes ---- */
  if (!user && matchesPath(pathname, protectedPaths)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* ---- Protect /admin/* routes (admin role required) ---- */
  if (matchesPath(pathname, adminPaths)) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "admin" && user.role !== "staff") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  /* ---- Forward user info via headers for downstream use ---- */
  const response = NextResponse.next();
  if (user) {
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-email", user.email);
    response.headers.set("x-user-role", user.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (handled by their own auth)
     * - static files
     * - images
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
