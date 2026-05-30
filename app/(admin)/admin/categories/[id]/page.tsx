"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminEditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;

  const [category, setCategory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const response = await apiClient.get(`/admin/categories/${categoryId}`);
        setCategory(response.data.data);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load category");
      } finally {
        setIsLoading(false);
      }
    };
    if (categoryId) loadCategory();
  }, [categoryId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category?.name || !category?.slug) {
      toast.error("Name and slug are required.");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.put(`/admin/categories/${categoryId}`, {
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
      });
      toast.success("Category updated successfully");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">Loading category…</div>;
  }

  if (!category) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">Category not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Edit Category</h1>
        <p className="text-sm text-muted-foreground mt-1">Update category details and visibility.</p>
      </div>

      <Card className="p-6" glass>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <Input label="Name" value={category.name || ""} onChange={(event) => setCategory({ ...category, name: event.target.value })} required />
          <Input label="Slug" value={category.slug || ""} onChange={(event) => setCategory({ ...category, slug: event.target.value })} required />
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <input type="checkbox" checked={category.isActive || false} onChange={(event) => setCategory({ ...category, isActive: event.target.checked })} className="h-4 w-4 rounded border-border text-primary-500" />
            Active
          </label>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => router.push("/admin/categories")}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
