import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Payment from "@/lib/db/models/Payment";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();
    await requireAdmin(req);

    const { id: paymentId } = await params;
    const body = await req.json();
    const { action, notes } = body; // action: 'verified' | 'declined'

    if (!["verified", "declined"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 },
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 },
      );
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    payment.adminAction = action;
    payment.adminVerified = action === "verified";

    if (action === "verified") {
      payment.status = "paid";
      if (!payment.paidAt) payment.paidAt = new Date();
      // Only move to processing if it was pending/initialized
      // if (order.status === "pending") {
      //   order.status = "processing";
      // }
    } else {
      // If declined, we might want to keep it pending or mark as failed
      payment.status = "failed";
      // order.status = "cancelled";
    }

    if (notes) {
      order.notes =
        (order.notes ? order.notes + "\n" : "") + `Payment ${action}: ${notes}`;
    }

    await order.save({ session });
    await payment.save({ session });
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Payment ${action} successfully`,
      payment,
    });
  } catch (error: any) {
    console.error("Admin payment verify error:", error);
    await session.abortTransaction();
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
