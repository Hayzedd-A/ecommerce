import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Category from "@/lib/db/models/Category";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10);
    const total = await Category.countDocuments({});
    const items = await Category.find({}).sort({ order: 1 }).skip((page - 1) * limit).limit(limit).lean();
    return NextResponse.json({ success: true, data: { items, total, page, limit } });
  } catch (error: any) {
    console.error("Admin categories list error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    try { await requireAdmin(req); } catch (e: any) { return NextResponse.json({ success: false, message: e.message }, { status: e.message === 'UNAUTHENTICATED' ? 401 : 403 }); }
    const body = await req.json();
    if (!body.name || !body.slug) return NextResponse.json({ success: false, message: "Name and slug required" }, { status: 400 });
    const created = await Category.create({ name: body.name, slug: body.slug, description: body.description, parent: body.parent || null, isActive: body.isActive ?? true, order: body.order || 0 });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin category create error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
