import { z } from "zod";

export const AddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[0-9+]{11,14}$/, "Please provide a valid phone number"),
  street: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const OrderItemSchema = z.object({
  productId: z.string(),
  variantId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Variant ID")
    .optional()
    .nullable(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  image: z.string().optional(),
});

export const CheckoutSchema = z
  .object({
    shippingAddress: AddressSchema,
    items: z
      .array(OrderItemSchema)
      .min(1, "Your cart must contain at least one item"),
    notes: z.string().max(500).optional().or(z.literal("")),
    couponUsed: z.string().optional().or(z.literal("")),
    isGuest: z.boolean().optional(),
    deliveryMethod: z.enum(["delivery", "pickup"]),
    deliveryLocationId: z.string().optional().or(z.literal("")),
    discount: z.number().optional(),
    paymentRef: z.string().optional(),
    total: z.number(),
    subtotal: z.number(),
    guestEmail: z.email("Invalid email address").optional().or(z.literal("")),
    guestPhone: z
      .string()
      .regex(/^[0-9+]{11,14}$/, "Please provide a valid phone number")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.isGuest) {
        return !!data.guestEmail && !!data.guestPhone;
      }
      return true;
    },
    {
      message: "Guest email and phone number are required for guest checkout",
      path: ["guestEmail"],
    },
  );

export type AddressInput = z.infer<typeof AddressSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
