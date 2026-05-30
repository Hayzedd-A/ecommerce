import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESS_TOKEN } from "../utils/constants";
import { AuthService } from "../services/auth.service";

/**
 * Throws "UNAUTHENTICATED" or "FORBIDDEN" if the request is not from an admin.
 * Use `adminGuard` in route handlers instead, which handles the error response.
 */
export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = AuthService.verifyAccessToken(token);
  if (payload.role !== "admin") throw new Error("FORBIDDEN");
  return payload;
}

/**
 * Route-handler helper — wraps `requireAdmin` and returns a NextResponse on
 * failure, or `null` on success. Use like:
 *
 *   const guard = await adminGuard(req);
 *   if (guard) return guard;
 */
export async function adminGuard(
  req: NextRequest,
): Promise<NextResponse | null> {
  try {
    await requireAdmin(req);
    return null;
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e.message || "Authentication error" },
      { status: e.message === "UNAUTHENTICATED" ? 401 : 403 },
    );
  }
}

