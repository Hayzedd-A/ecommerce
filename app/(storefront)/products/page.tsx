import React from "react";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/Product";
import Category from "@/lib/db/models/Category";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";

// Mock Fallback Products
const MOCK_PRODUCTS = [
  {
    _id: "prod1",
    name: "Acoustic Noise Cancelling Wireless Headphones",
    slug: "wireless-headphones",
    price: 45000,
    discountPrice: 38000,
    images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60" }],
    avgRating: 4.8,
    reviewCount: 24,
    stock: 12,
  },
  {
    _id: "prod2",
    name: "Classic Chronograph Wristwatch",
    slug: "classic-wristwatch",
    price: 65000,
    images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60" }],
    avgRating: 4.6,
    reviewCount: 15,
    stock: 4,
  },
  {
    _id: "prod3",
    name: "Ergonomic Office Chair with Lumbar Support",
    slug: "ergonomic-office-chair",
    price: 95000,
    discountPrice: 80000,
    images: [{ url: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60" }],
    avgRating: 4.7,
    reviewCount: 30,
    stock: 8,
  },
  {
    _id: "prod4",
    name: "Smart Fitness Watch Tracker",
    slug: "smart-fitness-tracker",
    price: 25000,
    images: [{ url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60" }],
    avgRating: 4.4,
    reviewCount: 9,
    stock: 10,
  },
];

interface ListingPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
}

async function getProductsData(search?: string, categorySlug?: string, sort?: string) {
  try {
    await dbConnect();

    // Build DB Query
    const query: Record<string, any> = { status: "active" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (category) {
        query.category = category._id;
      }
    }

    // Build Sorting
    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOptions = { price: 1 };
    } else if (sort === "price_desc") {
      sortOptions = { price: -1 };
    } else if (sort === "rating") {
      sortOptions = { avgRating: -1 };
    }

    const products = await Product.find(query).sort(sortOptions).lean();
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

    return {
      products: products.length > 0 ? JSON.parse(JSON.stringify(products)) : MOCK_PRODUCTS,
      categories: JSON.parse(JSON.stringify(categories)),
    };
  } catch (error) {
    console.error("Error loading products list:", error);
    return {
      products: MOCK_PRODUCTS,
      categories: [],
    };
  }
}

export default async function ProductsListingPage({ searchParams }: ListingPageProps) {
  // Await async searchParams in Next 16
  const params = await searchParams;
  const { products, categories } = await getProductsData(params.search, params.category, params.sort);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {params.category ? `${params.category.charAt(0).toUpperCase() + params.category.slice(1)} Products` : "Browse Products"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {products.length} premium results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Panel - Desktop */}
        <aside className="space-y-6 hidden lg:block bg-surface-secondary border border-border p-6 rounded-2xl">
          <div className="space-y-1">
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Categories</h3>
            <p className="text-xs text-muted-foreground">Filter by your preference</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/products"
              className={`text-sm py-1.5 px-3 rounded-lg font-medium transition-colors ${!params.category ? "bg-primary-500 text-white" : "hover:bg-border text-muted-foreground hover:text-foreground"
                }`}
            >
              All Categories
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}${params.sort ? `&sort=${params.sort}` : ""}`}
                className={`text-sm py-1.5 px-3 rounded-lg font-medium transition-colors ${params.category === cat.slug ? "bg-primary-500 text-white" : "hover:bg-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting / Quick details */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-secondary border border-border rounded-xl">
            <span className="text-xs font-semibold text-muted-foreground">
              Order Results:
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/products?${params.category ? `category=${params.category}&` : ""}${params.search ? `search=${params.search}&` : ""}sort=latest`}
                className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${params.sort !== "price_asc" && params.sort !== "price_desc" && params.sort !== "rating"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                Latest
              </Link>
              <Link
                href={`/products?${params.category ? `category=${params.category}&` : ""}${params.search ? `search=${params.search}&` : ""}sort=price_asc`}
                className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${params.sort === "price_asc"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                Price: Low to High
              </Link>
              <Link
                href={`/products?${params.category ? `category=${params.category}&` : ""}${params.search ? `search=${params.search}&` : ""}sort=price_desc`}
                className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${params.sort === "price_desc"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-surface border-border text-muted-foreground hover:text-foreground"
                  }`}
              >
                Price: High to Low
              </Link>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-surface-secondary rounded-2xl border border-border">
              <h3 className="text-lg font-bold text-foreground">No Products Found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try relaxing your search parameters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
