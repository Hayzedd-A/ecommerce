"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Archive, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/products", {
        params: { page, limit: 20, search },
      });
      setProducts(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleArchive = async (id: string) => {
    if (!window.confirm("Archive this product?")) {
      return;
    }
    try {
      await apiClient.delete(`/admin/products/${id}`);
      toast.success("Product archived");
      setProducts(products.filter((product) => product._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to archive product");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage inventory, featured status, stock, and pricing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/admin/products/new" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          </Link>
          <div className="w-full sm:w-80">
            <Input
              label="Search products"
              placeholder="Search by name, SKU or tags"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <Card className="p-6" glass>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="space-y-3">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="bg-surface rounded-3xl shadow-sm">
                    <td className="px-4 py-4 font-semibold text-foreground max-w-[220px] truncate">{product.name}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{product.sku}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-foreground">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{product.stock}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground capitalize">{product.status}</td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Link href={`/admin/products/${product._id}`} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700 hover:bg-error-100"
                        onClick={() => handleArchive(product._id)}
                      >
                        <Archive className="h-4 w-4" />
                        Archive
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} products found</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>Prev</Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">Page {page}</span>
            <Button variant="secondary" onClick={() => setPage((prev) => prev + 1)} disabled={products.length < 20}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
