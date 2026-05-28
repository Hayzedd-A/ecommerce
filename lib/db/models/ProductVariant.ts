import mongoose, { Schema, type Document } from "mongoose";

export interface IProductVariantDocument extends Document {
  productId: mongoose.Types.ObjectId;
  type: "color" | "size" | "material";
  value: string;
  label?: string;
  price?: number;
  stock: number;
  images: {
    url: string;
    publicId: string;
    alt?: string;
    order: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VariantImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: String,
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["color", "size", "material"],
      required: [true, "Variant type is required"],
    },
    value: {
      type: String,
      required: [true, "Variant value is required"],
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    images: [VariantImageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* Compound unique index: one variant per type+value per product */
ProductVariantSchema.index(
  { productId: 1, type: 1, value: 1 },
  { unique: true }
);

export default mongoose.models.ProductVariant ||
  mongoose.model<IProductVariantDocument>("ProductVariant", ProductVariantSchema);
