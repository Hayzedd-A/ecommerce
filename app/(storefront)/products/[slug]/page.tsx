import React from "react";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
import ProductVariant from "@/lib/db/models/ProductVariant";
import ProductDetailInteractive from "./ProductDetailInteractive";

// Mock Fallbacks matching homepage slugs
const MOCK_PRODUCTS_MAP: Record<string, any> = {
  "wireless-headphones": {
    _id: "prod1",
    name: "Acoustic Noise Cancelling Wireless Headphones",
    slug: "wireless-headphones",
    description:
      "Experience absolute acoustic bliss. Equipped with hybrid active noise cancellation, premium memory foam earcups, and high-fidelity dynamic drivers. Enjoy up to 40 hours of playtime on a single charge.",
    price: 45000,
    discountPrice: 38000,
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      },
      {
        url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
      },
    ],
    avgRating: 4.8,
    reviewCount: 24,
    stock: 12,
    specifications: {
      "Driver Size": "40mm Dynamic",
      "Frequency Response": "20Hz - 20kHz",
      "Bluetooth Version": "5.2",
      "Battery Life": "Up to 40 Hours",
    },
  },
  "classic-wristwatch": {
    _id: "prod2",
    name: "Classic Chronograph Wristwatch",
    slug: "classic-wristwatch",
    description:
      "Crafted for timeless style and precision. Featuring a stainless steel case, sapphire glass casing protection, and Japanese quartz chronograph movement. Water-resistant up to 50 meters.",
    price: 65000,
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      },
    ],
    avgRating: 4.6,
    reviewCount: 15,
    stock: 4,
    specifications: {
      "Case Diameter": "42mm",
      "Glass Type": "Sapphire Crystal",
      Movement: "Japanese Quartz",
      "Water Resistance": "50m (5 ATM)",
    },
  },
  "ergonomic-office-chair": {
    _id: "prod3",
    name: "Ergonomic Office Chair with Lumbar Support",
    slug: "ergonomic-office-chair",
    description:
      "Optimize your work setup for complete comfort. Built with breathable mesh backs, dynamic 3D armrests, and premium pneumatic height adjustment. Reduces spine strain during long working sessions.",
    price: 95000,
    discountPrice: 80000,
    images: [
      {
        url: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80",
      },
    ],
    avgRating: 4.7,
    reviewCount: 30,
    stock: 8,
    specifications: {
      "Back Type": "High Back Breathable Mesh",
      Armrests: "3D Adjustable",
      "Base Material": "Heavy Duty Nylon",
      "Weight Capacity": "150kg",
    },
  },
  "smart-fitness-tracker": {
    _id: "prod4",
    name: "Smart Fitness Watch Tracker",
    slug: "smart-fitness-tracker",
    description:
      "Keep track of your health metrics dynamically. Monitors heart rate, blood oxygen levels, and active sleep states in real-time. Syncs seamlessly with iOS and Android devices.",
    price: 25000,
    images: [
      {
        url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
      },
    ],
    avgRating: 4.4,
    reviewCount: 9,
    stock: 0,
    specifications: {
      "Display Size": "1.4 inch AMOLED",
      "Battery Life": "Up to 10 Days",
      Compatibility: "iOS & Android",
      "Sensor Types": "Heart Rate, SpO2, Accelerometer",
    },
  },
};

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
  console.log(product);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span className="hover:text-foreground cursor-pointer">Home</span>
        <span>/</span>
        <span className="hover:text-foreground cursor-pointer">Products</span>
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
