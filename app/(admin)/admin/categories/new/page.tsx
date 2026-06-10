"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { slugify } from "@/lib/utils/helpers";
import { toast } from "react-hot-toast";

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<{ url: string; publicId: string; order: number; alt?: string }[]>([]);
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
        slug: slugify(name),
        description: description || undefined,
        image: images[0]
          ? { url: images[0].url, publicId: images[0].publicId, alt: images[0].alt || undefined }
          : undefined,
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
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-2.5 text-foreground placeholder:text-muted transition-all duration-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
              rows={4}
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
          <Input
            label="Image alt text"
            value={images[0]?.alt || ""}
            onChange={(event) =>
              setImages((prev) =>
                prev.map((img, index) =>
                  index === 0
                    ? { ...img, alt: event.target.value }
                    : img,
                ),
              )
            }
            placeholder="Optional alt text for category image"
          />
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
