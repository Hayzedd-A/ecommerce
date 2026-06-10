import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { getRequestUser } from "@/lib/auth/getIdentity";
import { UploadService } from "@/lib/services/upload.service";
import mongoose from "mongoose";
import { Payment } from "@/lib/db/models";
import {
  incrementCouponUsage,
  updateProductSalesAndStock,
} from "@/lib/utils/server-helpers";
import { EmailService } from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();
    const formData = await req.formData();
    const reference = formData.get("reference") as string;
    const { _id } = await getRequestUser(req);

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Payment reference is required" },
        { status: 400 },
      );
    }

    const payment = await Payment.findOne({ reference });
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

    // Authorization check: User must own the order or it must be their guest session
    if (order.userId && String(order.userId) !== String(_id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    if (payment.status === "paid" && payment.evidenceFile) {
      return NextResponse.json(
        { success: true, message: "Payment already verified" },
        { status: 200 },
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    const uploadResult = await UploadService.uploadFile(
      file,
      `payments/evidence/${payment.reference}`,
    );

    if (!uploadResult || !uploadResult.url) {
      return NextResponse.json(
        { success: false, message: "Upload failed please try again" },
        { status: 500 },
      );
    }

    payment.evidenceFile = uploadResult.url;
    payment.paidAt = new Date();
    // We keep status as paid while admin still verifies payment
    payment.status = "paid";
    order.status = "awaiting_confirmation";

    await updateProductSalesAndStock(order, session);
    await incrementCouponUsage(order.couponUsed, session);
    await order.save({ session });
    await payment.save({ session });
    await session.commitTransaction();
    const orderUser = await order.getOrderUser();
    EmailService.sendOrderConfirmation(
      orderUser.email!,
      orderUser.name!,
      order,
    );

    return NextResponse.json({
      success: true,
      message: "Evidence uploaded successfully",
      url: uploadResult.url,
    });
  } catch (error: any) {
    console.error("Upload evidence error:", error);
    await session.abortTransaction();
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
