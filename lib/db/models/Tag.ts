import mongoose, { Schema, type Document } from "mongoose";

export interface ITagDocument extends Document {
  name: string;
  slug: string;
  createdAt: Date;
}

const TagSchema = new Schema<ITagDocument>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TagSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Tag ||
  mongoose.model<ITagDocument>("Tag", TagSchema);
