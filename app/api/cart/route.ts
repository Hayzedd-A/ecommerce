import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { Cart, Product, ProductVariant } from "@/lib/db/models";
import { getIdentity } from "@/lib/auth/getIdentity";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId, guestId } = getIdentity(req);

    if (!userId && !guestId) {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    const query = userId ? { userId } : { guestId };
    const cart = await Cart.findOne(query).populate({
      path: "items.productId",
      select: "name price discountPrice images stock trackStock",
    }).populate({
        path: "items.variantId",
        select: "attributes price stock images"
    });

    return NextResponse.json({ success: true, data: cart || { items: [] } });
  } catch (error: any) {
    console.error("Cart GET error:", error);
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
    const { items } = await req.json();

    if (!userId && !guestId) {
      return NextResponse.json(
        { success: false, message: "No identity found" },
        { status: 400 }
      );
    }

    const query = userId ? { userId } : { guestId };
    const update = userId ? { userId, items } : { guestId, items };

    const cart = await Cart.findOneAndUpdate(
      query,
      update,
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ success: true, data: cart });
  } catch (error: any) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
