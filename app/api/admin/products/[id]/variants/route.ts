import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import { ProductVariant } from "@/lib/db/models";

/**
 * GET: Get all variants for a product (hierarchically organized)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const productId = req.nextUrl.pathname.split("/")[4]; // /api/admin/products/[id]/variants
    const parentId = req.nextUrl.searchParams.get("parentId"); // Get sub-variants for a specific parent

    const query: any = { productId };
    if (parentId) {
      query.parentVariantId = parentId;
    } else {
      // Get only root variants (level 0 with no parent)
      query.parentVariantId = null;
    }

    const variants = await ProductVariant.find(query)
      .sort({ createdAt: -1 })
      .lean();

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
 * POST: Create a new variant (can be nested under a parent variant)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const productId = req.nextUrl.pathname.split("/")[4];
    const body = await req.json();
    const { parentVariantId } = body;

    // Determine level based on parent
    let level = 0;
    if (parentVariantId) {
      const parentVariant = await ProductVariant.findById(parentVariantId);
      if (!parentVariant) {
        return NextResponse.json(
          { success: false, message: "Parent variant not found" },
          { status: 404 }
        );
      }
      level = (parentVariant.level || 0) + 1;
    }

    const variant = await ProductVariant.create({
      ...body,
      productId,
      level,
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
    const { _id, parentVariantId, ...updateData } = body;

    // If changing parent, update level
    if (parentVariantId !== undefined) {
      if (parentVariantId) {
        const parentVariant = await ProductVariant.findById(parentVariantId);
        if (!parentVariant) {
          return NextResponse.json(
            { success: false, message: "Parent variant not found" },
            { status: 404 }
          );
        }
        updateData.level = (parentVariant.level || 0) + 1;
      } else {
        updateData.level = 0;
      }
      updateData.parentVariantId = parentVariantId;
    }

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
 * DELETE: Delete a variant (with cascade handling)
 */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const id = req.nextUrl.searchParams.get("id");
    const cascadeDelete = req.nextUrl.searchParams.get("cascade") === "true";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Variant ID required" },
        { status: 400 }
      );
    }

    // If cascade, delete all child variants
    if (cascadeDelete) {
      await ProductVariant.deleteMany({ parentVariantId: id });
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
