import mongoose, { Schema, type Document } from "mongoose";

export interface IAdminDocument extends Document {
  userId: mongoose.Types.ObjectId;
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

AdminSchema.index({ userId: 1 }, { unique: true });

const Admin =
  (mongoose.models.Admin as mongoose.Model<IAdminDocument>) ||
  mongoose.model<IAdminDocument>("Admin", AdminSchema);

export default Admin;