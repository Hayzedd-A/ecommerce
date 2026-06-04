"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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
        slug: name.toLowerCase().replace(/\s/g, "-"),
        isActive,
      });
      toast.success("Category created");
      setName("");
      setSlug("");
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
        <div className="grid gap-4 mb-6 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3 ">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {/* <Input label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} /> */}
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
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
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {category.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {category.slug}
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
