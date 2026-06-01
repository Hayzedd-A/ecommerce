import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.pathname.split("/").pop();
    const product = await Product.findById(id).lean();
    if (!product)
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Admin product get error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();

    const updatedata = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      shortDescription: body.shortDescription,
      price: body.price,
      discountPrice: body.discountPrice,
      sku: body.sku,
      images: body.images,
      category: body.category,
      subcategory: body.subcategory,
      tags: body.tags,
      isFeatured: !!body.isFeatured,
      isSponsored: !!body.isSponsored,
      stock: body.stock,
      trackStock: body.trackStock ?? true,
      lowStockThreshold: body.lowStockThreshold,
      status: body.status,
      seoMeta: body.seoMeta,
      specifications: body.specifications,
      weight: body.weight,
      dimensions: body.dimensions,
    };

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updatedata },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin product update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.pathname.split("/").pop();
    // Soft delete: mark archived
    const deleted = await Product.findByIdAndUpdate(
      id,
      { status: "archived" },
      { new: true }
    );
    if (!deleted)
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
