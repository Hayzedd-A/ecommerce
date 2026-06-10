"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addToCart } from "@/lib/store/slices/cartSlice";
import { toggleWishlistServer } from "@/lib/store/slices/wishlistSlice";
import { cn } from "@/lib/utils/helpers";
import { Button } from "@/components/ui/Button";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

interface ProductDetailInteractiveProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: { url: string; alt?: string }[];
    stock: number;
    avgRating?: number;
    reviewCount?: number;
    specifications?: Record<string, string>;
  };
  variants: any[];
}

export default function ProductDetailInteractive({
  product,
  variants = [],
}: ProductDetailInteractiveProps) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const { formatMoney } = useStoreSettings();
  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const [activeImage, setActiveImage] = useState(
    product.images?.[0]?.url || "",
  );
  const [quantity, setQuantity] = useState(1);

  // Group attributes from variants
  const attributeNames = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes))),
  );

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >(() => {
    if (variants.length > 0) {
      return variants[0].attributes;
    }
    return {};
  });

  // Find currently selected variant
  const selectedVariant = variants.find((v) => {
    return Object.entries(selectedAttributes).every(
      ([key, val]) => v.attributes[key] === val,
    );
  });

  const currentPrice =
    selectedVariant?.price || product.discountPrice || product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock < 1;

  const handleAttributeChange = (key: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This item is currently out of stock");
      return;
    }

    const variantLabel = Object.entries(selectedAttributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" / ");

    dispatch(
      addToCart({
        productId: product._id,
        variantId: selectedVariant?._id,
        name: product.name,
        price: currentPrice,
        quantity: quantity,
        image: activeImage,
        stock: currentStock,
        variantLabel: variantLabel,
      }),
    );
    // toast.success(`${product.name} (${quantity} items) added to cart!`);
  };

  const handleWishlistToggle = () => {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Product Image Gallery (LHS) */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main large image */}
        <div className="aspect-square w-full rounded-2xl overflow-hidden border border-border bg-white flex items-center justify-center relative shadow-soft">
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-sm font-semibold">
              No Image
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-accent-500 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full shadow-md z-1">
              On Sale
            </span>
          )}
        </div>

        {/* Image thumbnails list */}
        {product.images?.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(img.url)}
                className={cn(
                  "h-20 w-20 rounded-xl overflow-hidden border bg-white flex-shrink-0 relative transition-all cursor-pointer",
                  activeImage === img.url
                    ? "border-primary-500 ring-2 ring-primary-100"
                    : "border-border hover:border-border-hover",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt || product.name}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info Panel (RHS) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center text-warning-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold ml-1">
                {product.avgRating ? product.avgRating.toFixed(1) : "5.0"}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>
            <span className="text-muted">•</span>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                product.stock > 0 ? "text-success-600" : "text-error-600",
              )}
            >
              {product.stock > 0
                ? `In Stock (${product.stock} units)`
                : "Out of Stock"}
            </span>
          </div>
        </div>

        {/* Pricing Panel */}
        <div className="p-4 bg-surface-secondary border border-border rounded-2xl flex items-baseline gap-3">
          <span className="text-2xl font-black text-foreground">
            {formatMoney(currentPrice)}
          </span>
          {selectedVariant?.price === undefined && hasDiscount && (
            <span className="text-sm text-muted line-through">
              {formatMoney(product.price)}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
            Overview
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Dynamic Variant Selectors */}
        {attributeNames.map((attrName) => {
          console.log(attributeNames);
          const values = Array.from(
            new Set(variants.map((v) => v.attributes[attrName])),
          ).filter(Boolean);

          if (values.length === 0) return null;

          return (
            <div key={attrName} className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Select {attrName}:{" "}
                <span className="text-foreground">
                  {selectedAttributes[attrName]}
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {values.map((val: any) => (
                  <button
                    key={val}
                    onClick={() => handleAttributeChange(attrName, val)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                      selectedAttributes[attrName] === val
                        ? "bg-primary-500 border-primary-500 text-white shadow-soft"
                        : "bg-surface border-border text-foreground hover:bg-surface-secondary",
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Action Panel: Qty & Add Button */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
          {/* Qty field */}
          {!isOutOfStock && (
            <div className="flex items-center border border-border rounded-xl bg-surface h-12">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 h-full hover:bg-surface-secondary text-muted-foreground hover:text-foreground rounded-l-xl transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-foreground select-none">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity(Math.min(currentStock, quantity + 1))
                }
                className="px-3 h-full hover:bg-surface-secondary text-muted-foreground hover:text-foreground rounded-r-xl transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          )}

          {/* Add to Cart button */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            variant="primary"
            className="flex-1 py-3 h-12 shadow-soft hover:shadow-card font-bold uppercase tracking-wider"
            leftIcon={<ShoppingCart className="h-5 w-5" />}
          >
            Add to Cart
          </Button>

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              "h-12 w-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95",
              isWishlisted
                ? "bg-accent-50 border-accent-100 text-accent-500"
                : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-secondary",
            )}
            title="Wishlist"
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
          </button>
        </div>

        {/* Trust points */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80 text-xs text-muted-foreground text-center">
          <div className="space-y-1.5 flex flex-col items-center">
            <Truck className="h-4 w-4 text-primary-500" />
            <span className="font-medium">Direct Delivery</span>
          </div>
          <div className="space-y-1.5 flex flex-col items-center">
            <ShieldCheck className="h-4 w-4 text-primary-500" />
            <span className="font-medium">100% Original</span>
          </div>
          <div className="space-y-1.5 flex flex-col items-center">
            <RefreshCw className="h-4 w-4 text-primary-500" />
            <span className="font-medium">3-Day Return</span>
          </div>
        </div>
      </div>
    </div>
  );
}
