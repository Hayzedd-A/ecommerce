import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import { ProductVariant } from "@/lib/db/models";

/**
 * GET: Get all variants for a product
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const productId = req.nextUrl.pathname.split("/")[4]; // /api/admin/products/[id]/variants
    const variants = await ProductVariant.find({ productId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: variants });
  } catch (error: any) {
    console.error("Admin variants get error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new variant
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const productId = req.nextUrl.pathname.split("/")[4];
    const body = await req.json();
    console.log("variant body: ", body)

    const variant = await ProductVariant.create({
      ...body,
      productId,
    });

    return NextResponse.json({ success: true, data: variant });
  } catch (error: any) {
    console.error("Admin variant create error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update a variant
 */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const body = await req.json();
    const { _id, ...updateData } = body;

    const updated = await ProductVariant.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin variant update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a variant
 */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Variant ID required" },
        { status: 400 }
      );
    }

    const deleted = await ProductVariant.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Variant deleted" });
  } catch (error: any) {
    console.error("Admin variant delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
