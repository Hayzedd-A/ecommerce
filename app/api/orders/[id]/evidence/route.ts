import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { getIdentity } from "@/lib/auth/getIdentity";
import { UploadService } from "@/lib/services/upload.service";
import mongoose from "mongoose";
import { Payment } from "@/lib/db/models";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await dbConnect();
    const { id } = await params;
    const identity = getIdentity(req);

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    // Allow if user owns the order, or if guest and guestId matches
    if (order.userId) {
      if (
        !identity.userId ||
        String(order.userId) !== String(identity.userId)
      ) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 },
        );
      }
    } else if (order.isGuest) {
      const guestId = req.headers.get("x-guest-id");
      if (!guestId || guestId !== order.guestId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }
    const payment = await Payment.findOne({ orderId: id });
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 },
      );
    }

    if (payment.status === "paid" && payment.evidenceFile) {
      return NextResponse.json(
        { success: false, message: "Payment already verified" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
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
      `orders/${id}`,
    );

    if (!uploadResult || !uploadResult.url) {
      return NextResponse.json(
        { success: false, message: "Upload failed" },
        { status: 500 },
      );
    }

    payment.evidenceFile = uploadResult.url;
    payment.paidAt = new Date();
    payment.status = "paid";
    order.status = "pending";

    await Promise.all([order.save({ session }), payment.save({ session })]);
    return NextResponse.json({
      success: true,
      message: "Evidence uploaded",
      url: uploadResult.url,
    });
  } catch (error: any) {
    console.error("Upload evidence error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
