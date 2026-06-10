import mongoose, { Schema, type Document } from "mongoose";
import User from "./User";
import Guest from "./Guest";
import { OrderStatus, OrderStatusEnum } from "@/lib/types";

export interface IOrderDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  userModel: "User" | "Guest";
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
    street?: string;
    city?: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  deliveryMethod: "delivery" | "pickup";
  deliveryLocationId?: mongoose.Types.ObjectId;
  discount: number;
  total: number;
  couponUsed?: string;
  paymentId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  getOrderUser(): Promise<{
    email?: string;
    name?: string;
    [key: string]: any;
  }>;
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
  { _id: true },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "Nigeria" },
    zipCode: String,
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userModel: {
      type: String,
      enum: ["User", "Guest"],
      default: "User",
    },
    orderNumber: {
      type: String,
      required: true,
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
      enum: Object.keys(OrderStatusEnum),
      default: "draft",
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    deliveryMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    deliveryLocationId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryLocation",
    },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponUsed: String,
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

/* Indexes */
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

OrderSchema.methods.getOrderUser = async function (this: IOrderDocument) {
  let user;
  if (this.userModel === "User") {
    user = await User.findById(this.userId);
  } else {
    user = await Guest.findById(this.userId);
  }
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const Order =
  (mongoose.models.Order as mongoose.Model<IOrderDocument>) ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);
export default Order;
