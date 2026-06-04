import mongoose, { Schema, type Document } from "mongoose";

export interface IDeliveryLocationDocument extends Document {
  name?: string;
  type: "delivery" | "pickup";
  country: string;
  state: string;
  city: string;
  address?: string;
  price: number;
  estimatedDays?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryLocationSchema = new Schema<IDeliveryLocationDocument>(
  {
    name: {
      type: String,
      //   required: [true, "Location name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["delivery", "pickup"],
      required: [true, "Location type is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    state: {
      type: String,
      //   required: [true, "State is required"],
      trim: true,
    },
    city: {
      type: String,
      // required: [true, "City is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    estimatedDays: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

DeliveryLocationSchema.index({ country: 1, state: 1, city: 1, type: 1 });

const DeliveryLocation =
  (mongoose.models
    .DeliveryLocation as mongoose.Model<IDeliveryLocationDocument>) ||
  mongoose.model<IDeliveryLocationDocument>(
    "DeliveryLocation",
    DeliveryLocationSchema,
  );

export default DeliveryLocation;
