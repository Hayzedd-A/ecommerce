import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import { ADMIN_PAGE_SIZE } from "@/lib/utils/constants";
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || String(ADMIN_PAGE_SIZE), 10);
    const status = url.searchParams.get("status");
    const filter: any = {};
    if (status) filter.status = status;
    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    return NextResponse.json({ success: true, data: { items, total, page, limit } });
  } catch (error: any) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
