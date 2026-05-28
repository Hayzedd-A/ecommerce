import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Payment from "@/lib/db/models/Payment";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import { paymentManager } from "@/lib/services/payment/paymentManager";
import { EmailService } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Retrieve raw text body for signature hashing verification
    const rawBody = await req.text();
    const headersList = Object.fromEntries(req.headers.entries());

    // Verify webhook signature
    const provider = paymentManager.getProvider("monnify");
    const verifyResult = await provider.verifyWebhook(headersList, rawBody);

    if (!verifyResult.isValid || !verifyResult.reference) {
      console.warn("⚠️ Invalid Monnify webhook signature received.");
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    const { reference, status, amount } = verifyResult;

    // Find payment record
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      console.error(`❌ Payment reference not found: ${reference}`);
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }

    // Skip if already processed (webhook idempotency)
    if (payment.status === "paid") {
      return NextResponse.json({ success: true, message: "Webhook already processed" });
    }

    // Update payment record
    payment.status = status === "paid" ? "paid" : "failed";
    payment.paidAt = status === "paid" ? new Date() : undefined;
    payment.metadata = verifyResult.gatewayResponse;
    payment.webhookVerified = true;
    await payment.save();

    // Update corresponding order
    const order = await Order.findById(payment.orderId);
    if (order) {
      if (status === "paid") {
        order.status = "paid";
        await order.save();

        // Retrieve user or guest details
        const email = order.isGuest ? order.guestEmail : "";
        const name = order.shippingAddress.fullName;

        // Fetch User name if authenticated
        let resolvedEmail = email;
        let resolvedName = name;

        if (order.userId) {
          const u = await User.findById(order.userId);
          if (u) {
            resolvedEmail = u.email;
            resolvedName = u.name;
          }
        }

        // Send confirmation email asynchronously
        if (resolvedEmail) {
          await EmailService.sendOrderConfirmation(resolvedEmail, resolvedName, order);
        }

        // Create notification in DB
        await Notification.create({
          userId: order.userId || undefined,
          type: "payment_success",
          title: "Order Paid Successfully",
          message: `Your order ${order.orderNumber} for ${amount} NGN has been paid and confirmed.`,
          metadata: { orderId: order._id, orderNumber: order.orderNumber },
        });
      } else {
        order.status = "cancelled";
        await order.save();

        // Create failed notification
        await Notification.create({
          userId: order.userId || undefined,
          type: "payment_failed",
          title: "Order Payment Failed",
          message: `The payment for your order ${order.orderNumber} was not successful.`,
          metadata: { orderId: order._id, orderNumber: order.orderNumber },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("Webhook route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
