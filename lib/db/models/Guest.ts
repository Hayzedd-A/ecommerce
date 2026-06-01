import mongoose, { Schema, type Document } from "mongoose";

export interface IGuestDocument extends Document {
  guestId: string;
  userId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuestDocument>(
  {
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Guest ||
  mongoose.model<IGuestDocument>("Guest", GuestSchema);
