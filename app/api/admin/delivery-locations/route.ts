import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import DeliveryLocation from "@/lib/db/models/DeliveryLocation";
import { adminGuard } from "@/lib/auth/requireAdmin";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(
      url.searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
      10,
    );
    const search = url.searchParams.get("search")?.trim();
    const country = url.searchParams.get("country")?.trim();
    const state = url.searchParams.get("state")?.trim();
    const type = url.searchParams.get("type")?.trim();

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }
    if (country) filter.country = country;
    if (state) filter.state = state;
    if (type) filter.type = type;

    const total = await DeliveryLocation.countDocuments(filter);
    const items = await DeliveryLocation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: { items, total, page, limit },
    });
  } catch (error: any) {
    console.error("Admin delivery locations list error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const body = await req.json();
    if (
      !body.type ||
      !body.country ||
      !body.state ||
      !body.city ||
      body.price == null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required delivery location fields",
        },
        { status: 400 },
      );
    }

    const created = await DeliveryLocation.create({
      name: body.name.trim(),
      type: body.type,
      country: body.country.trim(),
      state: body.state.trim(),
      city: body.city.trim(),
      address: body.address?.trim(),
      price: Number(body.price),
      estimatedDays: body.estimatedDays?.trim(),
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin delivery location create error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
