import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RefreshCw, HelpCircle, Star, Sparkles } from "lucide-react";

import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
import Category from "@/lib/db/models/Category";
import ProductCard from "@/components/storefront/ProductCard";

// Mock fallbacks if Database is not seeded/empty
const MOCK_CATEGORIES = [
  { _id: "cat1", name: "Electronics", slug: "electronics", image: { url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60" } },
  { _id: "cat2", name: "Fashion", slug: "fashion", image: { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60" } },
  { _id: "cat3", name: "Home & Living", slug: "home-living", image: { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60" } },
  { _id: "cat4", name: "Beauty & Personal Care", slug: "beauty", image: { url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60" } },
];

const MOCK_PRODUCTS = [
  {
    _id: "prod1",
    name: "Acoustic Noise Cancelling Wireless Headphones",
    slug: "wireless-headphones",
    price: 45000,
    discountPrice: 38000,
    images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60", alt: "Wireless headphones" }],
    avgRating: 4.8,
    reviewCount: 24,
    stock: 12,
    isFeatured: true,
  },
  {
    _id: "prod2",
    name: "Classic Chronograph Wristwatch",
    slug: "classic-wristwatch",
    price: 65000,
    images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60", alt: "Classic wristwatch" }],
    avgRating: 4.6,
    reviewCount: 15,
    stock: 4,
    isFeatured: true,
  },
  {
    _id: "prod3",
    name: "Ergonomic Office Chair with Lumbar Support",
    slug: "ergonomic-office-chair",
    price: 95000,
    discountPrice: 80000,
    images: [{ url: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60", alt: "Office chair" }],
    avgRating: 4.7,
    reviewCount: 30,
    stock: 8,
    isFeatured: true,
  },
  {
    _id: "prod4",
    name: "Smart Fitness Watch Tracker",
    slug: "smart-fitness-tracker",
    price: 25000,
    images: [{ url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60", alt: "Fitness watch" }],
    avgRating: 4.4,
    reviewCount: 9,
    stock: 0,
    isFeatured: false,
  },
];

async function getHomeData() {
  try {
    await dbConnect();
    
    // Attempt database retrieval
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).limit(6).lean();
    const products = await Product.find({ status: "active" }).sort({ createdAt: -1 }).limit(8).lean();

    return {
      categories: categories.length > 0 ? JSON.parse(JSON.stringify(categories)) : MOCK_CATEGORIES,
      products: products.length > 0 ? JSON.parse(JSON.stringify(products)) : MOCK_PRODUCTS,
    };
  } catch (error) {
    console.error("DB Fetching error on Home page:", error);
    return {
      categories: MOCK_CATEGORIES,
      products: MOCK_PRODUCTS,
    };
  }
}

export default async function HomePage() {
  const { categories, products } = await getHomeData();

  return (
    <div className="space-y-16 pb-16">
      {/* Premium Hero Section */}
      <section className="relative bg-surface-secondary border-b border-border py-20 lg:py-28 overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-0 right-0 w-[45%] h-[90%] rounded-full bg-primary-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[45%] h-[90%] rounded-full bg-accent-500/10 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              New Season Collections
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Shopping Experience
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Discover top quality curated electronics, fashion apparel, and home essentials. Experience fast delivery and seamless checkout today.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/products"
                className="px-6 py-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold flex items-center gap-1.5 shadow-soft hover:shadow-card hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Shop Collection
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="#categories"
                className="px-6 py-3 rounded-full bg-surface border border-border hover:bg-surface-secondary text-foreground font-semibold hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                View Categories
              </Link>
            </div>
          </div>

          {/* Hero Banner Showcase card */}
          <div className="relative mx-auto lg:mr-0 w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-overlay border border-border/80 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80"
              alt="Hero collection"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs uppercase font-bold tracking-widest text-primary-400">Exclusive Deals</span>
              <h3 className="text-xl font-bold mt-1">Up to 40% Off New Items</h3>
              <p className="text-sm text-neutral-300 mt-1">Free delivery on qualifying checkout sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-surface-secondary border border-border rounded-2xl p-8 shadow-soft">
          <div className="flex items-start gap-4">
            <Truck className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-foreground text-sm">Swift Delivery</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Prompt shipping to major zones in Nigeria.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-foreground text-sm">Secure Checkout</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Monnify secured card & account transfers.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <RefreshCw className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-foreground text-sm">Easy Returns</h4>
              <p className="text-xs text-muted-foreground mt-0.5">3-day return policy for peace of mind.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <HelpCircle className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-foreground text-sm">24/7 Assistance</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Dedicated WhatsApp & email hotline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Shop by Category</h2>
            <p className="text-sm text-muted-foreground mt-1">Explore our broad range of products curated for you</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat: any) => (
            <Link
              href={`/products?category=${cat.slug}`}
              key={cat._id}
              className="group relative h-48 rounded-2xl overflow-hidden border border-border/80 shadow-soft bg-white hover:-translate-y-1 transition-transform"
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 z-1 group-hover:bg-black/50 transition-colors" />

              {/* Image */}
              {cat.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image.url}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-slate-200" />
              )}

              {/* Title */}
              <div className="absolute inset-0 z-2 p-6 flex flex-col justify-end text-white">
                <h3 className="font-bold text-base sm:text-lg tracking-wide">{cat.name}</h3>
                <span className="text-[11px] font-semibold text-primary-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Items &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Featured Products</h2>
            <p className="text-sm text-muted-foreground mt-1">Handpicked premium items with incredible value</p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            Explore all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((prod: any) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
}
