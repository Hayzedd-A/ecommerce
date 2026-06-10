import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { getIdentity, getRequestUser } from "@/lib/auth/getIdentity";
import { UploadService } from "@/lib/services/upload.service";
import mongoose from "mongoose";
import { Payment } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();
    const formData = await req.formData();
    const reference = formData.get("reference") as string;
    const { _id, userModel } = await getRequestUser(req);

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

    if (!order.userId?.equals(_id)) {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await UploadService.uploadImageBuffer(
      buffer,
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
    payment.status = "paid";
    order.status = "awaiting_confirmation";

    await order.save({ session });
    await payment.save({ session });
    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      message: "Evidence uploaded",
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
