import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Category from "@/lib/db/models/Category";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import { slugify } from "@/lib/utils/helpers";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
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
    const guard = await adminGuard(req);
    if (guard) return guard;
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, message: "Name and slug required" }, { status: 400 });
    const existing = await Category.findOne({ name: body.name, slug: body.slug });
    if (existing) return NextResponse.json({ success: false, message: "Category with this slug already exists" }, { status: 400 });
    const created = await Category.create({
      name: body.name,
      slug: body.slug,
      description: body.description,
      parent: body.parent || null,
      isActive: body.isActive ?? true,
      order: body.order || 0,
      image: body.image ? { url: body.image.url, publicId: body.image.publicId, alt: body.name || undefined } : undefined,
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin category create error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}

