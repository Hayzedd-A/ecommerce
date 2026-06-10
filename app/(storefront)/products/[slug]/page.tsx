import React from "react";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
import ProductVariant from "@/lib/db/models/ProductVariant";
import ProductDetailInteractive from "./ProductDetailInteractive";
import Link from "next/link";

interface DetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProductBySlug(slug: string) {
  try {
    await dbConnect();
    const product = await Product.findOne({ slug, status: "active" }).lean();
    if (product) {
      const variants = await ProductVariant.find({
        productId: product._id,
        isActive: true,
      }).lean();
      return {
        ...JSON.parse(JSON.stringify(product)),
        variants: JSON.parse(JSON.stringify(variants)),
      };
    }
  } catch (error) {
    console.error("Error fetching product detail page by slug:", error);
  }

  // Fallback to mock item if DB doesn't have it yet
  return null;
}

export default async function ProductDetailPage({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Link href="/" className="hover:text-foreground cursor-pointer">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground cursor-pointer">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-xs">
          {product.name}
        </span>
      </div>

      {/* Main Interactive Details Wrapper */}
      <ProductDetailInteractive
        product={product}
        variants={product.variants || []}
      />

      {/* Technical Specifications */}
      {product.specifications &&
        Object.keys(product.specifications).length > 0 && (
          <section className="border-t border-border pt-10 space-y-6">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Product Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-secondary border border-border p-6 rounded-2xl">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between py-2 border-b border-border/40 last:border-b-0 text-sm"
                >
                  <span className="font-semibold text-muted-foreground">
                    {key}
                  </span>
                  <span className="font-bold text-foreground text-right">
                    {val as string}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}
