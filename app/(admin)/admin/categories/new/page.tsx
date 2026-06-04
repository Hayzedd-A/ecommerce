"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) {
      toast.error("Category name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/categories", {
        name,
        slug: name.toLowerCase().replace(/\s/g, "-"),
        isActive,
      });
      toast.success("Category created successfully");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">
          New Category
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new category for your store products.
        </p>
      </div>

      <Card className="p-6" glass>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <Input
            label="Category name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          {/* <Input label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} required /> */}
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary-500"
            />
            Active
          </label>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push("/admin/categories")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create category
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
