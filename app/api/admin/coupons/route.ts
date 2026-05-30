import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Coupon from "@/lib/db/models/Coupon";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
    const search = (url.searchParams.get("search") || "").trim().toUpperCase();
    const filter: any = {};
    if (search) filter.code = { $regex: search, $options: "i" };
    const total = await Coupon.countDocuments(filter);
    const items = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return NextResponse.json({ success: true, data: { items, total, page, limit } });
  } catch (error: any) {
    console.error("Admin coupons list error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const body = await req.json();
    if (!body.code || !body.type || body.value == null) {
      return NextResponse.json({ success: false, message: "Missing required coupon fields" }, { status: 400 });
    }
    const created = await Coupon.create({
      code: body.code.toString().trim().toUpperCase(),
      type: body.type,
      value: Number(body.value),
      minPurchase: body.minPurchase ? Number(body.minPurchase) : undefined,
      maxUses: body.maxUses ? Number(body.maxUses) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      isActive: body.isActive === undefined ? true : !!body.isActive,
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin coupon create error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
