import { IProduct } from "@/lib/types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import {
  CheckCircle2,
  Package,
  Pencil,
  ShoppingCart,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import { ProductStatusBadge } from "../ui/ProductStatusBadge";
import { formatCurrency } from "@/lib/utils/formatters";
import { calcDiscountPercent, cn } from "@/lib/utils/helpers";
import { Button } from "../ui/Button";
import Link from "next/link";

export function ProductDetailModal({
  product,
  open,
  onClose,
}: {
  product: IProduct | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!product) return null;

  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            background: "var(--color-surface)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            {product.images?.[0] ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground leading-snug">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground bg-surface-secondary px-2 py-0.5 rounded border border-border">
                  {product.sku}
                </span>
                {product.category && (
                  <span className="text-xs text-muted-foreground">
                    {product.category.name}
                  </span>
                )}
                <ProductStatusBadge status={product.status} />
              </div>
            </div>
          </div>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "var(--color-muted-foreground)" }}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <div className="p-6 space-y-6">
          {/* Pricing */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Pricing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-surface-secondary rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Base Price</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(product.price)}
                </p>
              </div>
              {hasDiscount && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mb-1">
                    Discount Price
                  </p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                    {formatCurrency(product.discountPrice!)}
                  </p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    –
                    {calcDiscountPercent(product.price, product.discountPrice!)}
                    % off
                  </p>
                </div>
              )}
              <div className="bg-surface-secondary rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Sales Count
                </p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  {product.salesCount?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Inventory
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Stock",
                  value: product.stock?.toLocaleString() ?? "0",
                },
                {
                  label: "Low Stock Alert",
                  value: product.lowStockThreshold ?? "—",
                },
                {
                  label: "Track Stock",
                  value: product.trackStock ? "Yes" : "No",
                },
                {
                  label: "Avg Rating",
                  value:
                    product.avgRating > 0
                      ? `${product.avgRating.toFixed(1)} ★`
                      : "No ratings",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-surface-secondary rounded-xl p-3 border border-border"
                >
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          {product.description && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {product.description}
              </p>
            </section>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-foreground"
                  >
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Variants ({product.variants.length})
              </h3>
              <div className="space-y-2">
                {product.variants.map((v: any) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between gap-4 bg-surface-secondary rounded-xl px-4 py-3 border border-border"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(v.attributes ?? {}).map(
                        ([k, val]: any) => (
                          <span
                            key={k}
                            className="text-[10px] font-bold uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-border"
                          >
                            {k}: {val}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <span className="font-semibold text-primary-500">
                        {formatCurrency(v.price)}
                      </span>
                      <span className="text-muted-foreground">
                        Stock: {v.stock}
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          v.isActive ? "bg-emerald-400" : "bg-gray-400",
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flags */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Flags
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Featured", active: product.isFeatured },
                { label: "Sponsored", active: product.isSponsored },
              ].map(({ label, active }) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
                    active
                      ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400"
                      : "bg-surface-secondary border-border text-muted-foreground",
                  )}
                >
                  {active ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <div className="flex justify-between w-full gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Link href={`/admin/products/${product._id}`}>
            <Button leftIcon={<Pencil className="h-4 w-4" />}>
              Edit Product
            </Button>
          </Link>
        </div>
      </DialogActions>
    </Dialog>
  );
}
