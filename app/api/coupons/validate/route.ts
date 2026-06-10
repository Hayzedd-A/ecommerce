import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Coupon from "@/lib/db/models/Coupon";
import { formatCurrency } from "@/lib/utils/formatters";
import getStoreSettings from "@/lib/settings.server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const settings = await getStoreSettings();
    const body = await req.json();
    const code = (body.code || "").toString().trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 },
      );
    }

    const coupon = await Coupon.findOne({ code });
    if (
      !coupon ||
      !coupon.isActive ||
      (coupon.startsAt && coupon.startsAt.getTime() > Date.now())
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or inactive coupon code" },
        { status: 404 },
      );
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: "Coupon has expired" },
        { status: 400 },
      );
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum purchase of ${coupon.minPurchase} required`,
        },
        { status: 400 },
      );
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, message: "Coupon usage limit exceeded" },
        { status: 400 },
      );
    }

    // Compute discount
    let discount = 0;
    let message = "Coupon applied successfully";
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * coupon.value) / 100);
      message = `${coupon.value}% coupon applied successfully, you saved ${formatCurrency(discount, settings?.currencySymbol)}`;
    } else {
      discount = Math.round(coupon.value);
      message = `${coupon.value} coupon applied successfully, you saved ${formatCurrency(discount, settings?.currencySymbol)}`;
    }

    // Ensure discount not greater than subtotal
    if (discount > subtotal) discount = subtotal;

    return NextResponse.json({
      success: true,
      data: { code: coupon.code, discount, couponId: coupon._id },
      message,
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
