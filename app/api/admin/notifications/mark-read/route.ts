import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const body = await req.json();
    const { type } = body;

    const query: any = {
      userId: { $exists: false },
      isRead: false,
    };

    if (type) {
      query.type = type;
    }

    await Notification.updateMany(query, { $set: { isRead: true } });

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error: any) {
    console.error("Admin notification mark read error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
