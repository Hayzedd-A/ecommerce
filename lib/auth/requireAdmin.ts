import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESS_TOKEN } from "../utils/constants";
import { AuthService } from "../services/auth.service";

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const payload = AuthService.verifyAccessToken(token);
  if (payload.role !== "admin") throw new Error("FORBIDDEN");
  return payload;
}
