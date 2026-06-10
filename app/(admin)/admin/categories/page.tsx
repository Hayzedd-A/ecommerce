"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/admin/ImageUpload";
import apiClient from "@/lib/api/client";
import { slugify } from "@/lib/utils/helpers";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Toggle } from "@/components/ui/Toggle";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const { categoryView, updateStoreSettings } = useStoreSettings();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<
    { url: string; publicId: string; order: number; alt?: string }[]
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/categories", {
        params: { page, limit: 50 },
      });
      setCategories(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to load categories",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Category name is required");
      return;
    }
    try {
      await apiClient.post("/admin/categories", {
        name,
        slug: slugify(name),
        description: description || undefined,
        image: images[0]
          ? {
              url: images[0].url,
              publicId: images[0].publicId,
              alt: images[0].alt || undefined,
            }
          : undefined,
        isActive,
      });
      toast.success("Category created");
      setName("");
      setDescription("");
      setImages([]);
      setIsActive(true);
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to create category",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      setCategories(categories.filter((cat) => cat._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete category",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and organize product categories.
          </p>
        </div>
        {/* <Link href="/admin/categories/new" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        </Link> */}
      </div>

      <Card className="p-6" glass>
        <div className="grid gap-4 mb-6 sm:grid-cols-[1fr_auto] border-b border-border pb-4">
          <div className="grid gap-3">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-lg border border-border bg-input-bg px-4 py-2.5 text-foreground placeholder:text-muted transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                rows={3}
                placeholder="Optional category description"
              />
            </label>
            <ImageUpload
              value={images}
              onChange={setImages}
              folder="categories"
              maxFiles={1}
              label="Category image"
            />
            {/* <Input
              label="Image alt text"
              value={images[0]?.alt || ""}
              onChange={(event) => setImages((prev) =>
                prev.map((img, index) =>
                  index === 0
                    ? { ...img, alt: event.target.value }
                    : img,
                ),
              )}
              placeholder="Optional alt text for category image"
            /> */}
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500"
              />
              Active
            </label>
            <Button variant="secondary" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>

        <div className="flex my-6">
          <FormControl variant="outlined" sx={{ minWidth: 200, color: 'inherit' }}>
            <InputLabel id="category-view-label" sx={{ color: 'inherit' }}>
              Homepage category display
            </InputLabel>
            <Select
              labelId="category-view-label"
              id="category-view-select"
              value={categoryView || "text"}
              label="Homepage category display"
              onChange={(e) => {
                const value = e.target.value as "text" | "image";
                updateStoreSettings({ categoryView: value });
              }}
              displayEmpty
              className="text-inherit"
              sx={{ color: 'inherit' }}
            >
              <MenuItem value="text">Text only</MenuItem>
              <MenuItem value="image">Image + text</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category._id}
                    className="bg-surface rounded-3xl shadow-sm"
                  >
                    <td className="px-4 py-4 ">
                      <Image
                        src={category.image?.url || "/placeholder-image.png"}
                        alt={category.image?.alt || category.name}
                        width={40}
                        height={40}
                        className="inline-block h-10 w-10 rounded-full object-cover mr-3"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {category.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {category.isActive ? "Active" : "Disabled"}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Link
                        href={`/admin/categories/${category._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700 hover:bg-error-100"
                        onClick={() => handleDelete(category._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} categories</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">
              Page {page}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={categories.length < 50}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
