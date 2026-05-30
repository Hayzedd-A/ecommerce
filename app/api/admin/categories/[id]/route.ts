import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Category from "@/lib/db/models/Category";
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const cat = await Category.findById(id).lean();
    if (!cat) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: cat });
  } catch (error: any) {
    console.error("Admin category get error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();
    const updated = await Category.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin category update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const id = req.nextUrl.pathname.split("/").pop();
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("Admin category delete error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
