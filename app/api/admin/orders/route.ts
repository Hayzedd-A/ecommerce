import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { ADMIN_PAGE_SIZE } from "@/lib/utils/constants";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || String(ADMIN_PAGE_SIZE), 10);
    const status = url.searchParams.get("status");
    const filter: any = {};
    if (status) filter.status = status;
    const total = await Order.countDocuments(filter);
    const items = await Order.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "payments",        // MongoDB collection name
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
      // {
      //   $unset: "payment",         // remove the full payment array, keep only paymentStatus
      // },
    ]); 
    return NextResponse.json({ success: true, data: { items, total, page, limit } });
  } catch (error: any) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

