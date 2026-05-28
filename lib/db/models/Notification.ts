import mongoose, { Schema, type Document } from "mongoose";

export interface INotificationDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  type:
    | "order_new"
    | "order_status"
    | "payment_success"
    | "payment_failed"
    | "low_stock"
    | "review_new"
    | "general";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_new",
        "order_status",
        "payment_success",
        "payment_failed",
        "low_stock",
        "review_new",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/* Indexes */
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

/* Auto-delete notifications older than 30 days */
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export default mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
