import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Coupon from "@/lib/db/models/Coupon";
import Order from "@/lib/db/models/Order";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const { id } = await params;
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) return NextResponse.json({ success: false, message: "Coupon not found" }, { status: 404 });
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
    // Orders store couponUsed as the coupon code string
    const filter = { couponUsed: coupon.code };
    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return NextResponse.json({ success: true, data: { items, total, page, limit } });
  } catch (error: any) {
    console.error("Admin coupon orders error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
