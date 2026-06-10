import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 },
      );
    }
    const [order] = await Order.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: "payments", // MongoDB collection name
          localField: "_id",
          foreignField: "orderId",
          as: "payment",
        },
      },
      {
        $addFields: {
          payment: { $arrayElemAt: ["$payment", 0] },
        },
      },
      {
        $lookup: {
          from: "deliverylocations",
          localField: "deliveryLocationId",
          foreignField: "_id",
          as: "deliveryLocation",
        },
      },
      {
        $addFields: {
          deliveryLocation: { $arrayElemAt: ["$deliveryLocation", 0] },
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponUsed",
          foreignField: "code",
          as: "coupon",
        },
      },
      {
        $addFields: {
          coupon: { $arrayElemAt: ["$coupon", 0] },
        },
      },
      // {
      //   $unset: "payment",         // remove the full payment array, keep only paymentStatus
      // },
    ]);
    if (!order)
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Admin order get error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();
    // allow status update and notes
    const allowed: any = {};
    if (body.status) allowed.status = body.status;
    if (body.notes !== undefined) allowed.notes = body.notes;
    const updated = await Order.findByIdAndUpdate(
      id,
      { $set: allowed },
      { new: true },
    );
    if (!updated)
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
