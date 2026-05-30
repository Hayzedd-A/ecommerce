import mongoose, { Schema, type Document } from "mongoose";

export interface ICouponDocument extends Document {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  startsAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Coupon type is required"],
    },
    value: {
      type: Number,
      required: [true, "Coupon value is required"],
      min: [0, "Value cannot be negative"],
      validate: {
        validator: function (val: number) {
          if ((this as any).type === "percentage") return val <= 100;
          return true;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },
    minPurchase: {
      type: Number,
      min: 0,
    },
    maxUses: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: Date,
    startsAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/* Indexes */
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

export default mongoose.models.Coupon ||
  mongoose.model<ICouponDocument>("Coupon", CouponSchema);
