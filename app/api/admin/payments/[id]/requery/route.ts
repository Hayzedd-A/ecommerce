import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Order from "@/lib/db/models/Order";
import { paymentManager } from "@/lib/services/payment/paymentManager";
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").slice(-3)[0];
    const payment = await Payment.findById(id);
    if (!payment) return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    const provider = paymentManager.getProvider(payment.provider);
    const result = await provider.requeryTransaction(payment.reference);
    payment.status = result.status;
    if (result.success && result.status === "paid") payment.paidAt = new Date();
    payment.metadata = result.gatewayResponse;
    await payment.save();
    // Update related order
    const order = await Order.findById(payment.orderId);
    if (order) {
      if (result.status === "paid") {
        order.status = "paid";
      } else if (result.status === "failed" || result.status === "expired") {
        order.status = "cancelled";
      }
      await order.save();
    }
    return NextResponse.json({ success: true, data: { payment, verification: result } });
  } catch (error: any) {
    console.error("Admin payment requery error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
