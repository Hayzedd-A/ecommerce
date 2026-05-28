import mongoose, { Schema, type Document } from "mongoose";

export interface IOrderDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  orderNumber: string;
  items: {
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
  };
  status:
    | "pending_payment"
    | "paid"
    | "processing"
    | "ready_for_pickup"
    | "completed"
    | "cancelled";
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponUsed?: string;
  paymentId?: mongoose.Types.ObjectId;
  notes?: string;
  isGuest: boolean;
  guestEmail?: string;
  guestPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: String,
  },
  { _id: true }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "Nigeria" },
    zipCode: String,
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
      default: "pending_payment",
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponUsed: String,
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    notes: String,
    isGuest: { type: Boolean, default: false },
    guestEmail: String,
    guestPhone: String,
  },
  {
    timestamps: true,
  }
);

/* Indexes */
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);
