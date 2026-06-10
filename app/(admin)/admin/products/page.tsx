"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Archive,
  Pencil,
  Eye,
  MoreVertical,
  Star,
  TrendingUp,
  Package,
  Layers,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Divider,
  Skeleton,
} from "@mui/material";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { NestedVariantManager } from "@/components/admin/NestedVariantManager";
import { IProduct } from "@/lib/types";
import { cn } from "@/lib/utils/helpers";
import { ProductStatusBadge } from "@/components/ui/ProductStatusBadge";
import { ProductDetailModal } from "@/components/admin/ProductDetailModal";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

// ─── Types ─────────────────────────────────────────────────────────────────

type SortField = "price" | "avgRating" | "salesCount" | "stock" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Stock Indicator ─────────────────────────────────────────────────────────

function StockIndicator({
  stock,
  threshold,
}: {
  stock: number;
  threshold: number;
}) {
  const isLow = stock > 0 && stock <= threshold;
  const isOut = stock === 0;
  return (
    <Tooltip title={isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-foreground",
        )}
      >
        {isLow || isOut ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        ) : null}
        {stock.toLocaleString()}
      </span>
    </Tooltip>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <Tooltip title={`${count} review${count !== 1 ? "s" : ""}`}>
      <span className="inline-flex items-center gap-1">
        <Star
          className={cn(
            "h-3.5 w-3.5",
            rating > 0
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground",
          )}
        />
        <span className="text-sm font-medium">
          {rating > 0 ? rating.toFixed(1) : "—"}
        </span>
        {count > 0 && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
      </span>
    </Tooltip>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────

function RowActionMenu({
  product,
  onView,
  onManageVariants,
  onArchive,
}: {
  product: IProduct;
  onView: () => void;
  onManageVariants: () => void;
  onArchive: () => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: "var(--color-muted-foreground)" }}
      >
        <MoreVertical className="h-4 w-4" />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              minWidth: 180,
              color: "var(--color-foreground)",
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onView();
          }}
          sx={{ gap: 1.5, py: 1.2, fontSize: "0.85rem" }}
        >
          <ListItemIcon
            sx={{ minWidth: "unset", color: "var(--color-foreground)" }}
          >
            <Eye className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.85rem",
                },
              },
            }}
          >
            View Details
          </ListItemText>
        </MenuItem>

        <MenuItem
          component={Link}
          href={`/admin/products/${product._id}`}
          onClick={() => setAnchor(null)}
          sx={{ gap: 1.5, py: 1.2 }}
        >
          <ListItemIcon
            sx={{ minWidth: "unset", color: "var(--color-foreground)" }}
          >
            <Pencil className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.85rem",
                },
              },
            }}
          >
            Edit Product
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchor(null);
            onManageVariants();
          }}
          sx={{ gap: 1.5, py: 1.2 }}
        >
          <ListItemIcon
            sx={{ minWidth: "unset", color: "var(--color-foreground)" }}
          >
            <Layers className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.85rem",
                },
              },
            }}
          >
            Manage Variants
          </ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: "var(--color-border)", my: 0.5 }} />

        <MenuItem
          onClick={() => {
            setAnchor(null);
            onArchive();
          }}
          sx={{ gap: 1.5, py: 1.2, color: "var(--color-error-600) !important" }}
        >
          <ListItemIcon
            sx={{
              minWidth: "unset",
              color: "var(--color-error-500) !important",
            }}
          >
            <Archive className="h-4 w-4" />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: {
                sx: {
                  fontSize: "0.85rem",
                },
              },
            }}
          >
            Archive
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

function SortCell({
  field,
  label,
  sortField,
  sortDir,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <TableCell
      sortDirection={active ? sortDir : false}
      sx={{
        borderBottom: "1px solid var(--color-border)",
        background: "transparent",
        whiteSpace: "nowrap",
      }}
    >
      <TableSortLabel
        active={active}
        direction={active ? sortDir : "asc"}
        onClick={() => onSort(field)}
        sx={{
          color: "var(--color-muted-foreground) !important",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          "& .MuiTableSortLabel-icon": {
            color: "var(--color-primary-500) !important",
          },
          "&.Mui-active": { color: "var(--color-foreground) !important" },
        }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { formatMoney } = useStoreSettings();

  // Modals
  const [viewProduct, setViewProduct] = useState<IProduct | null>(null);
  const [manageVariant, setManageVariant] = useState<IProduct | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/products", {
        params: { page, limit: 20, search, sortBy: sortField, sortDir },
      });
      setProducts(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load products");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortField, sortDir]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm("Archive this product?")) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      toast.success("Product archived");
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to archive product",
      );
    }
  };

  const headerCellSx = {
    borderBottom: "1px solid var(--color-border)",
    background: "transparent",
    color: "var(--color-muted-foreground)",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    whiteSpace: "nowrap" as const,
    py: 1.5,
  };

  const bodyCellSx = {
    borderBottom: "1px solid var(--color-border)",
    color: "var(--color-foreground)",
    py: 1.5,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage inventory, featured status, stock, and pricing.
          </p>
        </div>
        <div className="flex flex-col items-center sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, SKU or tags"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Link href="/admin/products/new" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Product
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-0 overflow-hidden" glass>
        <TableContainer sx={{ background: "transparent" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, width: 56 }} />
                <TableCell sx={headerCellSx}>Product</TableCell>
                <TableCell sx={headerCellSx}>Category</TableCell>
                <SortCell
                  field="price"
                  label="Price"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortCell
                  field="stock"
                  label="Stock"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortCell
                  field="avgRating"
                  label="Rating"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortCell
                  field="salesCount"
                  label="Sales"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <TableCell sx={headerCellSx}>Status</TableCell>
                <TableCell sx={headerCellSx}>Variants</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: "right" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j} sx={bodyCellSx}>
                        <Skeleton
                          variant="text"
                          sx={{ bgcolor: "var(--color-surface-secondary)" }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    sx={{ ...bodyCellSx, textAlign: "center", py: 6 }}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-30" />
                      <span className="text-sm">No products found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product._id}
                    hover
                    sx={{
                      "&:hover": {
                        background: "var(--color-surface-secondary)",
                      },
                      cursor: "default",
                    }}
                  >
                    {/* Thumbnail */}
                    <TableCell sx={bodyCellSx}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface-secondary border border-border flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>

                    {/* Name + SKU */}
                    <TableCell sx={bodyCellSx}>
                      <div>
                        <p className="font-semibold text-sm text-foreground max-w-[200px] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell sx={bodyCellSx}>
                      <span className="text-xs text-muted-foreground">
                        {product.category?.name ?? "—"}
                      </span>
                    </TableCell>

                    {/* Price */}
                    <TableCell sx={bodyCellSx}>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatMoney(product.price)}
                        </p>
                        {product.discountPrice &&
                          product.discountPrice < product.price && (
                            <p className="text-xs text-emerald-500 font-medium">
                              {formatMoney(product.discountPrice)}
                            </p>
                          )}
                      </div>
                    </TableCell>

                    {/* Stock */}
                    <TableCell sx={bodyCellSx}>
                      <StockIndicator
                        stock={product.stock}
                        threshold={product.lowStockThreshold ?? 5}
                      />
                    </TableCell>

                    {/* Rating */}
                    <TableCell sx={bodyCellSx}>
                      <StarRating
                        rating={product.avgRating ?? 0}
                        count={product.reviewCount ?? 0}
                      />
                    </TableCell>

                    {/* Sales */}
                    <TableCell sx={bodyCellSx}>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        {(product.salesCount ?? 0).toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={bodyCellSx}>
                      <ProductStatusBadge status={product.status} />
                    </TableCell>

                    {/* Variants */}
                    <TableCell sx={bodyCellSx}>
                      {product.variants && product.variants.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Layers className="h-3.5 w-3.5" />
                          {product.variants.length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ ...bodyCellSx, textAlign: "right" }}>
                      <RowActionMenu
                        product={product}
                        onView={() => setViewProduct(product)}
                        onManageVariants={() => setManageVariant(product)}
                        onArchive={() => handleArchive(product._id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border text-sm text-muted-foreground">
          <span>
            {total.toLocaleString()} product{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold">
              Page {page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={products.length < 20}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Product detail modal */}
      <ProductDetailModal
        product={viewProduct}
        open={!!viewProduct}
        onClose={() => setViewProduct(null)}
      />

      {/* Manage variants modal */}
      <Dialog
        open={!!manageVariant}
        fullWidth
        maxWidth="md"
        onClose={() => setManageVariant(null)}
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
        <DialogTitle
          sx={{ borderBottom: "1px solid var(--color-border)", pb: 2 }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">
              Manage Variants — {manageVariant?.name} (
              {formatMoney(manageVariant?.price || 0)})
            </span>
            <IconButton size="small" onClick={() => setManageVariant(null)}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {manageVariant ? (
            <NestedVariantManager productId={manageVariant._id} />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="secondary" onClick={() => setManageVariant(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
