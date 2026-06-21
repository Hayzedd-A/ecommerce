import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Notification from "@/lib/db/models/Notification";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const count = await Notification.countDocuments({
      userId: { $exists: false },
      isRead: false,
    });

    const orderCount = await Notification.countDocuments({
      userId: { $exists: false },
      isRead: false,
      type: "order_new",
    });

    return NextResponse.json({
      success: true,
      data: {
        total: count,
        orders: orderCount,
      },
    });
  } catch (error: any) {
    console.error("Admin notification count error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
