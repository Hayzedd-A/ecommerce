import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Admin order get error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();
    // allow status update and notes
    const allowed: any = {};
    if (body.status) allowed.status = body.status;
    if (body.notes !== undefined) allowed.notes = body.notes;
    const updated = await Order.findByIdAndUpdate(id, { $set: allowed }, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
