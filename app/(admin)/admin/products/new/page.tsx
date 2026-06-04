"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import { DEFAULTS, onSubmit, ProductFormValues } from "./controller";

// ─── Shared style tokens ────────────────────────────────────────────────────

const SELECT_CLS =
  "w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all duration-200";

const TEXTAREA_CLS =
  "w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all duration-200";

const LABEL_CLS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

const CHECKBOX_CLS = "h-4 w-4 rounded border-border text-primary-500";

const CHECKBOX_LABEL_CLS =
  "flex items-center gap-3 text-sm font-semibold text-muted-foreground cursor-pointer select-none";

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminNewProductPage() {
  const router = useRouter();
  const { currencySymbol } = useStoreSettings();

  // Non-form state
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({ defaultValues: DEFAULTS });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "specifications",
  });

  const trackStock = watch("trackStock");

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await apiClient.get("/admin/categories", {
          params: { page: 1, limit: 100 },
        });
        setCategories(response.data.data.items || []);
      } catch {
        toast.error("Unable to load categories");
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    console.log("error in form", errors);
  }, [errors]);

  // ─── Submit ─────────────────────────────────────────────────────────────

  // ─── JSX ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new product to your catalog.
        </p>
      </div>

      <form
        className="grid gap-8"
        onSubmit={handleSubmit((formData) =>
          onSubmit(formData, images)
            .then(() => {
              toast.success("Product created successfully");
              router.push("/admin/products");
            })
            .catch((error) => {
              toast.error(
                error?.response?.data?.message || "Failed to create product",
              );
              return;
            }),
        )}
      >
        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Basic Info</h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                label="Product Name"
                error={errors.name?.message}
                {...register("name", { required: "Name is required" })}
              />
              <Input
                label="SKU"
                placeholder="Leave blank to autogenerate"
                error={errors.sku?.message}
                {...register("sku")}
              />

              <div className="grid gap-2">
                <label className={LABEL_CLS}>Category</label>
                <select
                  className={SELECT_CLS}
                  {...register("category", {
                    required: "Category is required",
                  })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <span className="text-xs text-error-600 font-medium">
                    {errors.category.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label className={LABEL_CLS}>Short Description</label>
              <textarea
                rows={2}
                placeholder="A brief summary for cards and snippets..."
                className={TEXTAREA_CLS}
                {...register("shortDescription")}
              />
            </div>

            <div className="grid gap-2">
              <label className={LABEL_CLS}>Full Description</label>
              <textarea
                rows={6}
                className={TEXTAREA_CLS}
                {...register("description", {
                  required: "Description is required",
                })}
              />
              {errors.description && (
                <span className="text-xs text-error-600 font-medium">
                  {errors.description.message}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* ── Media ──────────────────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Media</h2>
            <ImageUpload value={images} onChange={setImages} />
          </div>
        </Card>

        {/* ── Pricing & Inventory ────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">
              Pricing &amp; Inventory
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <Controller
                control={control}
                name="price"
                rules={{ required: "Price is required" }}
                render={({ field }) => (
                  <Input
                    label={`Base Price (${currencySymbol})`}
                    isMoney
                    error={errors.price?.message}
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="discountPrice"
                render={({ field }) => (
                  <Input
                    label={`Discount Price (${currencySymbol})`}
                    isMoney
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                )}
              />

              <Input
                label="Current Stock"
                type="number"
                error={errors.stock?.message}
                {...register("stock", {
                  required: "Stock is required",
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Low Stock Threshold"
                type="number"
                {...register("lowStockThreshold", { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className={CHECKBOX_LABEL_CLS}>
                <input
                  type="checkbox"
                  className={CHECKBOX_CLS}
                  {...register("trackStock")}
                />
                Track Inventory
              </label>

              <label
                className={`${CHECKBOX_LABEL_CLS} ${!trackStock ? "opacity-40 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  className={CHECKBOX_CLS}
                  disabled={!trackStock}
                  {...register("allowNegativeStock")}
                />
                Allow Negative Stock
              </label>
            </div>
          </div>
        </Card>

        {/* ── Specifications ─────────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-bold">Specifications</h2>
              <Button
                type="button"
                variant="secondary"
                className="text-xs px-4 py-1.5"
                onClick={() => append({ key: "", value: "" })}
              >
                + Add Row
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No specifications yet. Click &ldquo;Add Row&rdquo; to add
                key/value pairs (e.g. Material → Stainless Steel).
              </p>
            )}

            <div className="grid gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <Input
                    label={index === 0 ? "Key" : undefined}
                    placeholder="e.g. Material"
                    {...register(`specifications.${index}.key`, {
                      required: "Key is required",
                    })}
                    error={errors.specifications?.[index]?.key?.message}
                  />
                  <Input
                    label={index === 0 ? "Value" : undefined}
                    placeholder="e.g. Stainless Steel"
                    {...register(`specifications.${index}.value`)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-error-500 hover:text-error-500 transition-colors"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Shipping ───────────────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">Shipping</h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <Input
                label="Weight (kg)"
                type="number"
                placeholder="0.00"
                {...register("weight", { valueAsNumber: true })}
              />

              <div className="grid gap-2">
                <label className={LABEL_CLS}>Dimension Unit</label>
                <select className={SELECT_CLS} {...register("dimensionUnit")}>
                  <option value="cm">Centimetres (cm)</option>
                  <option value="in">Inches (in)</option>
                </select>
              </div>

              <Input
                label="Length"
                type="number"
                placeholder="0"
                {...register("dimensionLength", { valueAsNumber: true })}
              />
              <Input
                label="Width"
                type="number"
                placeholder="0"
                {...register("dimensionWidth", { valueAsNumber: true })}
              />
              <Input
                label="Height"
                type="number"
                placeholder="0"
                {...register("dimensionHeight", { valueAsNumber: true })}
              />
            </div>
          </div>
        </Card>

        {/* ── Organisation & Status ──────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">
              Organisation &amp; Status
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-2">
                <label className={LABEL_CLS}>Status</label>
                <select className={SELECT_CLS} {...register("status")}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <Input
                label="Tags (comma separated)"
                placeholder="tech, gadget, new"
                {...register("tags")}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className={CHECKBOX_LABEL_CLS}>
                <input
                  type="checkbox"
                  className={CHECKBOX_CLS}
                  {...register("isFeatured")}
                />
                Featured on Homepage
              </label>
              <label className={CHECKBOX_LABEL_CLS}>
                <input
                  type="checkbox"
                  className={CHECKBOX_CLS}
                  {...register("isSponsored")}
                />
                Sponsored Product
              </label>
            </div>
          </div>
        </Card>

        {/* ── SEO ───────────────────────────────────────────────────────── */}
        <Card className="p-6" glass>
          <div className="grid gap-6">
            <h2 className="text-xl font-bold border-b pb-2">SEO</h2>

            <div className="grid gap-6">
              <Input label="Meta Title" {...register("metaTitle")} />

              <div className="grid gap-2">
                <label className={LABEL_CLS}>Meta Description</label>
                <textarea
                  rows={3}
                  className={TEXTAREA_CLS}
                  placeholder="Brief summary for search engines..."
                  {...register("metaDescription")}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Actions ────────────────────────────────────────────────────── */}
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
