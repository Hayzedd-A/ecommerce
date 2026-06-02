import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { getIdentity } from "@/lib/auth/getIdentity";
import { Order, Payment } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, guestId } = getIdentity(req);
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });

    const order = await Order.findById(id)
      .populate({ path: "items.productId", select: "name price images" })
      .populate({ path: "items.variantId", select: "attributes price" })
      .lean();
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

    // ensure user owns the order or guest matches
    if (userId && String(order.userId) !== String(userId)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    if (!userId && guestId && String(order.guestId) !== String(guestId)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const payment = await Payment.findOne({ orderId: order._id }).lean();

    return NextResponse.json({ success: true, order: { ...order, payment: payment || null } });
  } catch (error: any) {
    console.error("Order GET error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
