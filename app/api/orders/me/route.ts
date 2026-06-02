import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { getIdentity } from "@/lib/auth/getIdentity";
import { Order, Payment } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, guestId } = getIdentity(req);
    if (!userId && !guestId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const query: any = userId ? { userId } : { guestId };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "items.productId", select: "name price images" })
      .populate({ path: "items.variantId", select: "attributes price" })
      .lean();

    // attach payments if any
    const ids = orders.map((o: any) => o._id);
    const payments = await Payment.find({ orderId: { $in: ids } }).lean();
    const withPayments = orders.map((o: any) => {
      const p = payments.find((x: any) => String(x.orderId) === String(o._id));
      return { ...o, payment: p || null };
    });

    return NextResponse.json({ success: true, orders: withPayments, total, page, limit });
  } catch (error: any) {
    console.error("Orders ME GET error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
