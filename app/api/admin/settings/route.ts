import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import StoreSettings from "@/lib/db/models/StoreSettings";
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const body = await req.json();
    const settings = await StoreSettings.getSettings();
    // Merge allowed fields only
    const allowed = [
      'storeName','logo','favicon','description','address','phone','email','socialLinks','businessHours','seoMeta','themeColors','deliveryZones','pickupEnabled','pickupAddress','currency','currencySymbol'
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
