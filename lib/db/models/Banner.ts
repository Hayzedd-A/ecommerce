import mongoose, { Schema, type Document } from "mongoose";

export interface IBannerDocument extends Document {
  title: string;
  subtitle?: string;
  image: {
    url: string;
    publicId: string;
    alt?: string;
  };
  link?: string;
  productId?: mongoose.Types.ObjectId;
  type: "hero" | "sponsored";
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBannerDocument>(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      alt: String,
    },
    link: String,
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    type: {
      type: String,
      enum: ["hero", "sponsored"],
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* Indexes */
BannerSchema.index({ type: 1, isActive: 1, order: 1 });

export default mongoose.models.Banner ||
  mongoose.model<IBannerDocument>("Banner", BannerSchema);
