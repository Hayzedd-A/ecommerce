import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_ACCESS_TOKEN } from "@/lib/utils/constants";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Validate access token directly from cookie.
    const accessToken = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized — Access token missing" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = AuthService.verifyAccessToken(accessToken);
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized — Invalid access token" },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User not found or suspended" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: unknown) {
    console.error("Get current user error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 }
    );
  }
}
