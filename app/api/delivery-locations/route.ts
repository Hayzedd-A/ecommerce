import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import DeliveryLocation from "@/lib/db/models/DeliveryLocation";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const type = url.searchParams.get("type")?.trim();
    const country = url.searchParams.get("country")?.trim();
    const state = url.searchParams.get("state")?.trim();
    const search = url.searchParams.get("search")?.trim();

    const filter: any = { isActive: true };
    if (type) filter.type = type;
    if (country) filter.country = country;
    if (state) filter.state = state;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const items = await DeliveryLocation.find(filter).sort({ type: 1, country: 1, state: 1, city: 1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Delivery locations fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
