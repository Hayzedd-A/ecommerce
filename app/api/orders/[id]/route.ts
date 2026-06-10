import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { getIdentity, getRequestUser } from "@/lib/auth/getIdentity";
import { Order, Payment } from "@/lib/db/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const user = await getRequestUser(req);

    const { id } = await params;

    const order = await Order.findById(id)
      .populate({ path: "items.productId", select: "name price images" })
      .populate({ path: "items.variantId", select: "attributes price" })
      .lean();
    if (!order)
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );

    // ensure user owns the order or guest matches
    if (user && String(order.userId) !== String(user._id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const payment = await Payment.findOne({ orderId: order._id }).lean();

    return NextResponse.json({
      success: true,
      order: { ...order, payment: payment || null },
    });
  } catch (error: any) {
    console.error("Order GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
