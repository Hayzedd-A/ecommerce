"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { Heart } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";

export default function WishlistPage() {
  const { items } = useAppSelector((state) => state.wishlist);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Products you have saved for later
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <div className="h-16 w-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Wishlist is empty</h2>
          <p className="text-muted-foreground mt-1 mb-6">
            You have not added any items to your wishlist yet.
          </p>
          <Link href="/products" className="text-primary-600 font-medium hover:underline">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
