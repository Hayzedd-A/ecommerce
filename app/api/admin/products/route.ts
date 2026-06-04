import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";
import { slugify } from "@/lib/utils/helpers";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(
      url.searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
      10,
    );
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category");
    const filter: any = {};
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    const total = await Product.countDocuments(filter);
    const items = await Product.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productvariants",
          localField: "_id",
          foreignField: "productId",
          as: "variants",
        },
      },
      // {
      //   $unwind: {
      //     path: "$variants",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $group: {
      //     _id: "$_id",
      //     name: { $first: "$name" },
      //     slug: { $first: "$slug" },
      //     description: { $first: "$description" },
      //     shortDescription: { $first: "$shortDescription" },
      //     price: { $first: "$price" },
      //     discountPrice: { $first: "$discountPrice" },
      //     sku: { $first: "$sku" },
      //     images: { $first: "$images" },
      //     category: { $first: "$category" },
      //     subcategory: { $first: "$subcategory" },
      //     tags: { $first: "$tags" },
      //     isFeatured: { $first: "$isFeatured" },
      //     isSponsored: { $first: "$isSponsored" },
      //     stock: { $first: "$stock" },
      //     trackStock: { $first: "$trackStock" },
      //     lowStockThreshold: { $first: "$lowStockThreshold" },
      //     status: { $first: "$status" },
      //     seoMeta: { $first: "$seoMeta" },
      //     specifications: { $first: "$specifications" },
      //     weight: { $first: "$weight" },
      //     dimensions: { $first: "$dimensions" },
      //     variants: {
      //       $push: {
      //         _id: "$variants._id",
      //         name: "$variants.name",
      //         price: "$variants.price",
      //         stock: "$variants.stock",
      //         image: "$variants.image",
      //         isBase: "$variants.isBase",
      //         attributeValues: "$variants.attributeValues",
      //       },
      //     },
      //     createdAt: { $first: "$createdAt" },
      //     updatedAt: { $first: "$updatedAt" },
      //   },
      // },
    ]);
    // .lean();
    return NextResponse.json({
      success: true,
      data: { items, total, page, limit },
    });
  } catch (error: any) {
    console.error("Admin products list error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;
    const body = await req.json();
    const slug = slugify(body.name);
    if (!body.name || !body.price || !body.sku || !body.category) {
      return NextResponse.json(
        { success: false, message: "Missing required product fields" },
        { status: 400 },
      );
    }
    const created = await Product.create({
      name: body.name,
      slug: slug,
      description: body.description || "",
      shortDescription: body.shortDescription,
      price: body.price,
      discountPrice: body.discountPrice,
      sku: body.sku,
      images: body.images || [],
      category: body.category,
      subcategory: body.subcategory,
      tags: body.tags || [],
      isFeatured: !!body.isFeatured,
      isSponsored: !!body.isSponsored,
      stock: body.stock || 0,
      trackStock: body.trackStock ?? true,
      lowStockThreshold: body.lowStockThreshold || 5,
      status: body.status || "draft",
      seoMeta: body.seoMeta,
      specifications: body.specifications,
      weight: body.weight,
      dimensions: body.dimensions,
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin product create error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
