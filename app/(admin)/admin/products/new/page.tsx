"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [trackStock, setTrackStock] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await apiClient.get("/admin/categories", {
          params: { page: 1, limit: 100 },
        });
        setCategories(response.data.data.items || []);
      } catch (error: any) {
        toast.error("Unable to load categories");
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/products", {
        name,
        slug,
        price,
        discountPrice: discountPrice === "" ? undefined : Number(discountPrice),
        sku,
        stock,
        category,
        description,
        shortDescription,
        status,
        isFeatured,
        isSponsored,
        trackStock,
        lowStockThreshold,
        images,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new product to your catalog.
        </p>
      </div>

      <form className="grid gap-8" onSubmit={handleSubmit}>
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Basic Info</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                label="Product name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Input
                label="Slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                required
              />
              <Input
                label="SKU"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                required
              />
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
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
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Short Description
              </label>
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                placeholder="A brief summary for cards and snippets..."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                required
              />
            </div>
          </div>
        </Card>

        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Media</h2>
            <ImageUpload value={images} onChange={setImages} />
          </div>
        </Card>

        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Pricing & Inventory</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                label="Base Price (₦)"
                type="number"
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
                required
              />
              <Input
                label="Discount Price (₦)"
                type="number"
                value={discountPrice}
                onChange={(event) =>
                  setDiscountPrice(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
              />
              <Input
                label="Current Stock"
                type="number"
                value={stock}
                onChange={(event) => setStock(Number(event.target.value))}
                required
              />
              <Input
                label="Low Stock Threshold"
                type="number"
                value={lowStockThreshold}
                onChange={(event) =>
                  setLowStockThreshold(Number(event.target.value))
                }
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={(event) => setTrackStock(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-500"
                />
                Track Inventory
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Organization & Status</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Input
                label="Tags (comma separated)"
                placeholder="tech, gadget, new"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-500"
                />
                Featured on Homepage
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSponsored}
                  onChange={(event) => setIsSponsored(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-500"
                />
                Sponsored Product
              </label>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="px-10"
            variant="primary"
          >
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
