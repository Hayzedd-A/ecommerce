"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Star, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addToCart } from "@/lib/store/slices/cartSlice";
import { toggleWishlistServer } from "@/lib/store/slices/wishlistSlice";
import { cn } from "@/lib/utils/helpers";
import { Card } from "../ui/Card";
import VariantSelectionModal from "./VariantSelectionModal";
import { useStoreSettings } from "../providers/SettingsProvider";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    images: { url: string; alt?: string }[];
    avgRating?: number;
    reviewCount?: number;
    stock: number;
    isFeatured?: boolean;
    variants?: any[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const { formatMoney } = useStoreSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isWishlisted = wishlistItems.some((item) => item._id === product._id);
  const primaryImage = product.images?.[0]?.url || "";

  const hasVariants = product.variants && product.variants.length > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page on button click

    if (product.stock < 1 && !hasVariants) {
      toast.error("This product is out of stock");
      return;
    }

    if (hasVariants) {
      setIsModalOpen(true);
      return;
    }

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.discountPrice || product.price,
        quantity: 1,
        image: primaryImage,
        stock: product.stock,
      }),
    );
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(toggleWishlistServer(product));
    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist!");
    }
  };

  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;

  return (
    <Card
      hoverable
      className="group flex flex-col h-full overflow-hidden border border-border bg-surface"
    >
      {/* Product Image and badges */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden bg-white"
      >
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Image */}
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-secondary flex items-center justify-center text-muted-foreground text-sm font-semibold">
            No Image
          </div>
        )}

        {/* Wishlist toggle */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute top-3 right-3 z-10 p-2 rounded-full shadow-soft transition-all duration-200 cursor-pointer active:scale-90",
            isWishlisted
              ? "bg-accent-50 hover:bg-accent-100 text-accent-500"
              : "bg-surface/80 hover:bg-surface text-muted-foreground hover:text-foreground",
          )}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>

        {/* Feature badge */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-primary-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
            <Sparkles className="h-3 w-3" />
            Featured
          </span>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute bottom-3 left-3 z-10 bg-accent-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md shadow-sm">
            Save{" "}
            {Math.round(
              ((product.price - product.discountPrice!) / product.price) * 100,
            )}
            %
          </span>
        )}

        {/* Out of Stock badge */}
        {product.stock < 1 && (
          <span className="absolute inset-0 z-10 bg-surface/80 flex items-center justify-center text-error-600 font-bold uppercase text-xs tracking-wider">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Brand/Rating */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center text-warning-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-semibold ml-1">
                {product.avgRating ? product.avgRating.toFixed(1) : "5.0"}
              </span>
              <span className="text-[10px] text-muted-foreground ml-0.5">
                ({product.reviewCount || 0})
              </span>
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-[10px] text-accent-600 font-semibold bg-accent-50 px-2 py-0.5 rounded-full uppercase">
                Only {product.stock} left
              </span>
            )}
          </div>

          {/* Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-sm text-foreground hover:text-primary-500 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Action and Pricing */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border/50">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-xs text-muted line-through">
                  {formatMoney(product.price)}
                </span>
                <span className="text-base font-bold text-foreground">
                  {formatMoney(product.discountPrice!)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-foreground">
                {formatMoney(product.price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock < 1}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200 shadow-soft cursor-pointer active:scale-95",
              product.stock < 1
                ? "bg-surface-secondary text-muted cursor-not-allowed"
                : "bg-primary-500 hover:bg-primary-600 text-white hover:shadow-card",
            )}
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <VariantSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        variants={product.variants || []}
      />
    </Card>
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center text-warning-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.floor(rating) ? "fill-current" : "opacity-30",
          )}
        />
      ))}
    </div>
  );
}
