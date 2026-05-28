import mongoose, { Schema, type Document } from "mongoose";

export interface IRoleDocument extends Document {
  name: string;
  permissions: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Role ||
  mongoose.model<IRoleDocument>("Role", RoleSchema);
