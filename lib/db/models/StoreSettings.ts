import mongoose, { Schema, type Document } from "mongoose";

export interface IStoreSettingsDocument extends Document {
  storeName: string;
  logo?: {
    url: string;
    publicId: string;
  };
  favicon?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    whatsapp?: string;
  };
  businessHours?: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  seoMeta?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  themeColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  deliveryZones: {
    name: string;
    fee: number;
    estimatedDays?: string;
  }[];
  pickupEnabled: boolean;
  pickupAddress?: string;
  currency: string;
  currencySymbol: string;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettingsDocument>(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
    },
    logo: {
      url: String,
      publicId: String,
    },
    favicon: String,
    description: String,
    address: String,
    phone: String,
    email: String,
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      tiktok: String,
      youtube: String,
      whatsapp: String,
    },
    businessHours: [
      {
        day: { type: String, required: true },
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
    ],
    seoMeta: {
      metaTitle: String,
      metaDescription: String,
      ogImage: String,
    },
    themeColors: {
      primary: String,
      secondary: String,
      accent: String,
    },
    deliveryZones: [
      {
        name: { type: String, required: true },
        fee: { type: Number, required: true, min: 0 },
        estimatedDays: String,
      },
    ],
    pickupEnabled: {
      type: Boolean,
      default: false,
    },
    pickupAddress: String,
    currency: {
      type: String,
      default: "NGN",
    },
    currencySymbol: {
      type: String,
      default: "₦",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Singleton pattern — ensure only one settings document exists.
 */
StoreSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      storeName: "My Store",
      currency: "NGN",
      currencySymbol: "₦",
      deliveryZones: [],
    });
  }
  return settings;
};

export default mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettingsDocument>("StoreSettings", StoreSettingsSchema);
