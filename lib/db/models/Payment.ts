import mongoose, { Schema, type Document } from "mongoose";

export interface IPaymentDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  reference: string;
  provider: string;
  amount: number;
  status:
    | "initialized"
    | "pending"
    | "paid"
    | "failed"
    | "expired"
    | "reversed"
    | "refunded";
  metadata?: Record<string, unknown>;
  adminVerified?: boolean;
  adminAction?: string;
  webhookVerified: boolean;
  providerReference?: string;
  evidenceFile: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reference: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
      default: "monnify",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "initialized",
        "pending",
        "paid",
        "failed",
        "expired",
        "reversed",
        "refunded",
      ],
      default: "initialized",
    },
    evidenceFile: {
      type: String, // cloudinary public link
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    adminAction: {
      type: String,
      enum: ["pending", "verified", "declined"],
      default: "pending",
    },
    adminVerified: {
      type: Boolean,
      default: false,
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
    providerReference: String,
    paidAt: Date,
  },
  {
    timestamps: true,
  },
);

/* Indexes */
PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

const Payment =
  (mongoose.models.Payment as mongoose.Model<IPaymentDocument>) ||
  mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export default Payment;
