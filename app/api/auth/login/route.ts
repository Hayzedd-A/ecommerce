import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Admin from "@/lib/db/models/Admin";
import { LoginSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_REFRESH_TOKEN } from "@/lib/utils/constants";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request body
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          error: result.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user (explicitly select password)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify status
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Check password
    const isMatch = await AuthService.comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If Admin/Staff, update lastLogin in Admin model
    if (user.role === "admin" || user.role === "staff") {
      await Admin.findOneAndUpdate(
        { userId: user._id },
        { lastLogin: new Date() },
        { upsert: true }
      );
    }

    // Generate tokens
    const payload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = AuthService.generateAccessToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        accessToken,
      },
    });

    // Set cookies
    response.cookies.set(
      COOKIE_REFRESH_TOKEN,
      refreshToken,
      AuthService.getCookieOptions("refresh")
    );

    response.cookies.set(
      "access_token",
      accessToken,
      AuthService.getCookieOptions("access")
    );

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
