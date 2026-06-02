import mongoose, { Schema, type Document } from "mongoose";

export interface IWishlistDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    guestId: {
      type: String,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/* One product per user/guest in wishlist */
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
WishlistSchema.index({ guestId: 1, productId: 1 }, { unique: true, sparse: true });

const Wishlist =  (mongoose.models.Wishlist as mongoose.Model<IWishlistDocument>) ||
  mongoose.model<IWishlistDocument>("Wishlist", WishlistSchema);

export default Wishlist;