"use client";

import React, { useState, useEffect } from "react";
import { X, ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { toast } from "react-hot-toast";

import { useAppDispatch } from "@/lib/store/hooks";
import { addToCart } from "@/lib/store/slices/cartSlice";
import { cn } from "@/lib/utils/helpers";
import { Button } from "@/components/ui/Button";
import { useStoreSettings } from "../providers/SettingsProvider";
import Image from "next/image";

interface VariantSelectionModalProps {
  product: {
    _id: string;
    name: string;
    price: number;
    discountPrice?: number;
    images: { url: string; alt?: string }[];
    stock: number;
    avgRating?: number;
    reviewCount?: number;
  } | null;
  variants: any[];
  open: boolean;
  onClose: () => void;
}

export default function VariantSelectionModal({
  product,
  variants = [],
  open,
  onClose,
}: VariantSelectionModalProps) {
  const dispatch = useAppDispatch();
  const { formatMoney } = useStoreSettings();
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");

  // Find currently selected variant
  const selectedVariant = variants.find((v) => {
    return Object.entries(selectedAttributes).every(
      ([key, val]) => v.attributes[key] === val,
    );
  });
  // Initialize selected attributes when modal opens or product changes
  useEffect(() => {
    if (open && variants.length > 0) {
      setSelectedAttributes(variants[0].attributes);
      setActiveImage(
        variants[0].images?.[0]?.url || product?.images?.[0]?.url || "",
      );
      setQuantity(1);
    } else if (open && product) {
      setActiveImage(product.images?.[0]?.url || "");
      setQuantity(1);
    }
  }, [open, product, variants]);

  // Update active image if variant changes and has its own images
  useEffect(() => {
    if (selectedVariant?.images?.[0]?.url) {
      setActiveImage(selectedVariant.images[0].url);
    }
  }, [selectedVariant]);

  if (!product) return null;

  // Group attributes from variants
  const attributeNames = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes))),
  );

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
        variantLabel: variantLabel || undefined,
      }),
    );

    toast.success(`${product.name} added to cart!`);
    onClose();
  };

  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            background: "var(--color-surface)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Select Options</h2>
          <IconButton onClick={onClose} size="small">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <div className="p-6 space-y-6">
          {/* Product Header */}
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-xl overflow-hidden border border-border bg-white flex-shrink-0">
              {activeImage ? (
                <Image
                  width={96}
                  height={96}
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-surface-secondary text-muted-foreground text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground leading-tight line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-warning-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-bold ml-1">
                    {product.avgRating?.toFixed(1) || "5.0"}
                  </span>
                </div>
                <span className="text-muted text-xs">•</span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    currentStock > 0 ? "text-success-600" : "text-error-600",
                  )}
                >
                  {currentStock > 0
                    ? `In Stock (${currentStock})`
                    : "Out of Stock"}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-foreground">
                  {formatMoney(currentPrice)}
                </span>
                {!selectedVariant?.price && hasDiscount && (
                  <span className="text-xs text-muted line-through">
                    {formatMoney(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Variant Selectors */}
          <div className="space-y-5">
            {attributeNames.map((attrName) => {
              const values = Array.from(
                new Set(variants.map((v) => v.attributes[attrName])),
              ).filter(Boolean);

              if (values.length === 0) return null;

              return (
                <div key={attrName} className="space-y-2.5">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
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
          </div>

          {/* Quantity and Add to Cart */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center gap-4">
            {!isOutOfStock && (
              <div className="flex items-center border border-border rounded-xl bg-surface h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 h-full hover:bg-surface-secondary text-muted-foreground hover:text-foreground rounded-l-xl transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
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
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              variant="primary"
              className="flex-1 py-3 h-12 shadow-soft font-bold uppercase tracking-wider"
              leftIcon={<ShoppingCart className="h-5 w-5" />}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
