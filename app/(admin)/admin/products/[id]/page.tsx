"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          apiClient.get(`/admin/products/${productId}`),
          apiClient.get("/admin/categories", { params: { page: 1, limit: 100 } }),
        ]);
        setProduct(productRes.data.data);
        setCategories(categoriesRes.data.data.items || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };
    if (productId) load();
  }, [productId]);

  const handleChange = (field: string, value: any) => {
    setProduct((current: any) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/admin/products/${productId}`, {
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        sku: product.sku,
        stock: product.stock,
        category: product.category,
        description: product.description,
        status: product.status,
        isFeatured: product.isFeatured,
        isSponsored: product.isSponsored,
      });
      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">Loading product details...</div>;
  }

  if (!product) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">Product not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Edit Product</h1>
        <p className="text-sm text-muted-foreground mt-1">Update product metadata, pricing, stock and status.</p>
      </div>

      <Card className="p-6" glass>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Input label="Product name" value={product.name || ""} onChange={(event) => handleChange("name", event.target.value)} required />
            <Input label="Slug" value={product.slug || ""} onChange={(event) => handleChange("slug", event.target.value)} required />
            <Input label="SKU" value={product.sku || ""} onChange={(event) => handleChange("sku", event.target.value)} required />
            <Input label="Price" type="number" value={product.price || 0} onChange={(event) => handleChange("price", Number(event.target.value))} required />
            <Input
              label="Discount price"
              type="number"
              value={product.discountPrice ?? ""}
              onChange={(event) => handleChange("discountPrice", event.target.value === "" ? undefined : Number(event.target.value))}
            />
            <Input label="Stock" type="number" value={product.stock || 0} onChange={(event) => handleChange("stock", Number(event.target.value))} required />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <select
                value={product.category || ""}
                onChange={(event) => handleChange("category", event.target.value)}
                className="w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                required
              >
                <option value="">Select category</option>
                {categories.map((categoryItem) => (
                  <option key={categoryItem._id} value={categoryItem._id}>
                    {categoryItem.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={product.status || "draft"}
                onChange={(event) => handleChange("status", event.target.value)}
                className="w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={product.isFeatured || false}
                onChange={(event) => handleChange("isFeatured", event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500"
              />
              Featured Product
            </label>
            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={product.isSponsored || false}
                onChange={(event) => handleChange("isSponsored", event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500"
              />
              Sponsored Product
            </label>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              value={product.description || ""}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => router.push("/admin/products")}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Update product</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
