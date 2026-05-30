import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Admin product get error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();
    const updated = await Product.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    // Soft delete: mark archived
    const deleted = await Product.findByIdAndUpdate(id, { status: "archived" }, { new: true });
    if (!deleted) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
