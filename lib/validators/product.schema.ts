import { z } from "zod";

const ProductImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Cloudinary public ID is required"),
  alt: z.string().optional(),
  order: z.number().default(0),
});

export const ProductSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name cannot exceed 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z
    .string()
    .max(300, "Short description cannot exceed 300 characters")
    .optional(),
  price: z.number().nonnegative("Price cannot be negative"),
  discountPrice: z
    .number()
    .nonnegative("Discount price cannot be negative")
    .optional()
    .nullable(),
  sku: z.string().min(3, "SKU is required"),
  images: z.array(ProductImageSchema).min(1, "At least one product image is required"),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  subcategory: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Subcategory ID")
    .optional()
    .nullable(),
  tags: z.array(z.string().trim()).default([]),
  isFeatured: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  specifications: z.record(z.string(), z.string()).optional(),
  weight: z.number().nonnegative().optional().nullable(),
  dimensions: z
    .object({
      length: z.number().nonnegative().optional(),
      width: z.number().nonnegative().optional(),
      height: z.number().nonnegative().optional(),
      unit: z.enum(["cm", "in"]).default("cm"),
    })
    .optional()
    .nullable(),
  seoMeta: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
    })
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      return data.discountPrice < data.price;
    }
    return true;
  },
  {
    message: "Discount price must be less than the regular price",
    path: ["discountPrice"],
  }
);

export const ProductVariantSchema = z.object({
  type: z.enum(["color", "size", "material"]),
  value: z.string().min(1, "Variant value is required"),
  label: z.string().optional(),
  price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  images: z.array(ProductImageSchema).default([]),
  isActive: z.boolean().default(true),
});

export const ReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  title: z.string().max(100, "Title cannot exceed 100 characters").optional().or(z.literal("")),
  comment: z.string().min(5, "Comment must be at least 5 characters").max(1000),
});

export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
