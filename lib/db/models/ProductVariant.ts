import mongoose, { Schema, type Document } from "mongoose";

export interface IProductVariantDocument extends Document {
  productId: mongoose.Types.ObjectId;
  attributes: Map<string, string>; // e.g. { "size": "45", "color": "red" }
  attributeKey: string; // normalized string of attributes for unique constraint e.g. "color:red|size:45"
  price?: number;
  stock: number;
  sku?: string;
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
    attributes: {
      type: Map,
      of: String,
      required: [true, "Variant attributes are required"],
    },
    attributeKey: {
      type: String,
      required: true,
      index: true,
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
    sku: {
      type: String,
      trim: true,
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

/* Compound unique index: productId + attributeKey */
ProductVariantSchema.index(
  { productId: 1, attributeKey: 1 },
  { unique: true }
);

/**
 * Pre-save hook to generate attributeKey
 */
ProductVariantSchema.pre("validate", async function () {
  if (this.attributes) {
    const sortedKeys = Array.from(this.attributes.keys()).sort();
    console.log("Generating attributeKey for variant with attributes:", this.attributes);
    this.attributeKey = sortedKeys
      .map((key) => `${key}:${this.attributes.get(key)}`)
      .join("|");
  }
});

const ProductVariant =
  (mongoose.models.ProductVariant as mongoose.Model<IProductVariantDocument>) ||
  mongoose.model<IProductVariantDocument>(
    "ProductVariant",
    ProductVariantSchema
  );

export default ProductVariant;