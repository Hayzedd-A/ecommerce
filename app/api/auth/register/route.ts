import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Admin from "@/lib/db/models/Admin";
import { RegisterSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_REFRESH_TOKEN } from "@/lib/utils/constants";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request body
    const result = RegisterSchema.safeParse(body);
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

    const { name, email, password, phone } = result.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Determine role (first registered user becomes admin)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? "admin" : "customer";

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive: true,
      isEmailVerified: isFirstUser, // Auto-verify the first admin
    });

    // If first admin, create Admin model record
    if (isFirstUser) {
      await Admin.create({
        userId: user._id,
        permissions: ["all"],
      });
    }

    // Generate tokens
    const payload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = AuthService.generateAccessToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
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
      },
      { status: 201 }
    );

    // Set HTTP-only refresh token cookie
    response.cookies.set(
      COOKIE_REFRESH_TOKEN,
      refreshToken,
      AuthService.getCookieOptions("refresh")
    );

    // Also set a temporary edge-verifiable cookie for proxy.ts
    response.cookies.set(
      "access_token",
      accessToken,
      AuthService.getCookieOptions("access")
    );

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
