import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_REFRESH_TOKEN } from "@/lib/utils/constants";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get refresh token from cookie
    const refreshToken = req.cookies.get(COOKIE_REFRESH_TOKEN)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token is missing" },
        { status: 401 }
      );
    }

    // Verify token
    let payload;
    try {
      payload = AuthService.verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Find user to verify they are active
    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User account is suspended or does not exist" },
        { status: 403 }
      );
    }

    // Generate new access token
    const newPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const newAccessToken = AuthService.generateAccessToken(newPayload);

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });

    // Update edge verifiable cookie
    response.cookies.set(
      "access_token",
      newAccessToken,
      AuthService.getCookieOptions("access")
    );

    return response;
  } catch (error: any) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
