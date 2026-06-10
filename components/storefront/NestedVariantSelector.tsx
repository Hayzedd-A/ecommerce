"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils/helpers";
import { X } from "lucide-react";

interface VariantNode {
  _id: string;
  attributes: Record<string, string>;
  price?: number;
  stock: number;
  sku?: string;
  level: number;
  parentVariantId?: string;
  children?: VariantNode[];
}

interface NestedVariantSelectorProps {
  productId: string;
  onVariantSelect: (variant: VariantNode) => void;
  onVariantClear: () => void;
  selectedVariantId?: string | null;
}

function buildVariantTree(
  variants: any[],
  parentId: string | null = null,
): VariantNode[] {
  return variants
    .filter(
      (v) =>
        (parentId === null && !v.parentVariantId) ||
        (parentId !== null && v.parentVariantId === parentId),
    )
    .map((v) => ({
      ...v,
      children: buildVariantTree(variants, v._id),
    }));
}

interface SelectionStep {
  variantId: string | null;
  attributeKey: string;
  attributeValue: string;
}

export const NestedVariantSelector: React.FC<NestedVariantSelectorProps> = ({
  productId,
  onVariantSelect,
  onVariantClear,
  selectedVariantId,
}) => {
  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selections, setSelections] = useState<SelectionStep[]>([]);
  const [variantTree, setVariantTree] = useState<VariantNode[]>([]);

  const loadVariants = async () => {
    try {
      const response = await apiClient.get(
        `/admin/products/${productId}/variants`,
      );
      const variants = response.data.data;
      setAllVariants(variants);
      setVariantTree(buildVariantTree(variants));
      setSelections([]);
      setIsLoading(false);
    } catch {
      toast.error("Failed to load variant options");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const getNextLevelVariants = (): VariantNode[] => {
    if (selections.length === 0) {
      return variantTree;
    }

    const lastSelection = selections[selections.length - 1];
    if (!lastSelection.variantId) return [];

    const lastVariant = allVariants.find(
      (v) => v._id === lastSelection.variantId,
    );
    if (!lastVariant) return [];

    return buildVariantTree(allVariants, lastVariant._id);
  };

  const handleVariantSelect = (variant: VariantNode) => {
    const newSelections = [
      ...selections,
      {
        variantId: variant._id,
        attributeKey: Object.keys(variant.attributes)[0] || "",
        attributeValue: Object.values(variant.attributes)[0] || "",
      },
    ];

    setSelections(newSelections);

    // Check if this is the final variant (no children)
    if (!variant.children || variant.children.length === 0) {
      onVariantSelect(variant);
    }
  };

  const handleRemoveSelection = (index: number) => {
    const newSelections = selections.slice(0, index);
    setSelections(newSelections);

    if (newSelections.length === 0) {
      onVariantClear();
    }
  };

  const getCurrentVariant = (): VariantNode | null => {
    if (selections.length === 0) return null;

    const lastSelection = selections[selections.length - 1];
    return allVariants.find((v) => v._id === lastSelection.variantId) || null;
  };

  const nextVariants = getNextLevelVariants();
  const currentVariant = getCurrentVariant();

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading variants...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection breadcrumb */}
      {selections.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          {selections.map((selection, index) => {
            const variant = allVariants.find(
              (v) => v._id === selection.variantId,
            );
            return (
              <div
                key={selection.variantId}
                className="flex items-center gap-1 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-medium text-primary-900">
                  {Object.entries(variant?.attributes || {})
                    .map(([k, v]: any) => `${k}: ${v}`)
                    .join(", ")}
                </span>
                <button
                  onClick={() => handleRemoveSelection(index)}
                  className="ml-1 p-0.5 hover:bg-primary-200 rounded transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-primary-700" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Current selection level */}
      {currentVariant && !nextVariants.length && (
        <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
          <p className="text-sm text-success-900 font-medium">
            ✓ Variant selected with{" "}
            {currentVariant.stock > 0
              ? `${currentVariant.stock} in stock`
              : "out of stock"}
          </p>
        </div>
      )}

      {/* Next variants to choose */}
      {nextVariants.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {nextVariants[0].level === 0
              ? "Choose Size"
              : `Choose ${Object.keys(nextVariants[0].attributes || {})[0] || "Option"}`}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {nextVariants.map((variant) => {
              const isSelected = selections.some(
                (s) => s.variantId === variant._id,
              );
              const isOutOfStock = variant.stock === 0;
              const attributeLabel = Object.entries(variant.attributes || {})
                .map(([k, v]: any) => `${v}`)
                .join(" ");

              return (
                <button
                  key={variant._id}
                  onClick={() => handleVariantSelect(variant)}
                  disabled={isOutOfStock}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all text-sm font-medium",
                    isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-900"
                      : "border-border hover:border-primary-300 hover:bg-surface-secondary",
                    isOutOfStock &&
                      "opacity-50 cursor-not-allowed bg-error-50 border-error-200",
                  )}
                >
                  <div>{attributeLabel}</div>
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-error-600 bg-white px-1 rounded">
                        OUT
                      </span>
                    </div>
                  )}
                  {(variant.children || []).length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      + more options
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No variants available */}
      {variantTree.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No variant options available for this product.
        </p>
      )}

      {/* Root level with no selections */}
      {selections.length === 0 && variantTree.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Select a variant option above to see pricing and availability.
        </div>
      )}
    </div>
  );
};
