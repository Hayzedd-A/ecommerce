import { z } from "zod";

export const CategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  image: z
    .object({
      url: z.string().url("Invalid image URL"),
      publicId: z.string().min(1, "Public ID is required"),
      alt: z.string().optional(),
    })
    .optional()
    .nullable(),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Parent Category ID")
    .optional()
    .nullable()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
