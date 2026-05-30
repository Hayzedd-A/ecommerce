import mongoose, { Schema, type Document } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    publicId: string;
    alt?: string;
  };
  parent?: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      url: String,
      publicId: String,
      alt: String,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/* Indexes */
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ isActive: 1 });

export default mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);
