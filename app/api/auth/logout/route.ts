import { NextResponse } from "next/server";
import { COOKIE_REFRESH_TOKEN } from "@/lib/utils/constants";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear cookies by setting maxAge to 0
  response.cookies.set(COOKIE_REFRESH_TOKEN, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("access_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
