import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { Product, Wishlist } from "@/lib/db/models";
import { getIdentity } from "@/lib/auth/getIdentity";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, guestId } = getIdentity(req);

    if (!userId && !guestId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const query = userId ? { userId } : { guestId };
    const items = await Wishlist.find(query).select("productId");
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, status: "active" }).lean();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, guestId } = getIdentity(req);
    const { productId } = await req.json();

    if (!userId && !guestId) {
      return NextResponse.json(
        { success: false, message: "No identity found" },
        { status: 400 }
      );
    }

    const query = userId
      ? { userId, productId }
      : { guestId, productId };

    const existing = await Wishlist.findOne(query);

    if (existing) {
      await Wishlist.deleteOne(query);
      return NextResponse.json({ success: true, message: "Removed from wishlist", action: "removed" });
    } else {
      await Wishlist.create(query);
      return NextResponse.json({ success: true, message: "Added to wishlist", action: "added" });
    }
  } catch (error: any) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
