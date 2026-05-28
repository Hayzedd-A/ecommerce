import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { ForgotPasswordSchema } from "@/lib/validators/auth.schema";
import { EmailService } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate request body
    const result = ForgotPasswordSchema.safeParse(body);
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

    const { email } = result.data;

    // Search user
    const user = await User.findOne({ email });
    if (!user) {
      // Keep it generic to avoid email enumeration attacks
      return NextResponse.json({
        success: true,
        message: "If that email is registered, we have sent password reset instructions.",
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save in user
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password/${token}`;
    
    await EmailService.sendForgotPassword(user.email, user.name, resetLink);

    return NextResponse.json({
      success: true,
      message: "If that email is registered, we have sent password reset instructions.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
