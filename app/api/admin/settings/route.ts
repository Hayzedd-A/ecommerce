import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import { StoreSettings } from "@/lib/db/models";
import getStoreSettings from "@/lib/settings.server";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const body = await req.json();
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({
        ...(await getStoreSettings()) // creates default if not exists
      });
    }
    // Merge allowed fields only
    const allowed = [
      "storeName",
      "logo",
      "favicon",
      "description",
      "address",
      "phone",
      "email",
      "socialLinks",
      "businessHours",
      "seoMeta",
      "themeColors",
      "deliveryZones",
      "pickupEnabled",
      "deliveryEnabled",
      "pickupAddress",
      "currency",
      "currencySymbol",
      "checkoutMethod",
      "personalAccount",
      "paymentSettings",
    ];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) (settings as any)[k] = (body as any)[k];
    }
    await settings.save();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Admin settings update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
