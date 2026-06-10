import { NextRequest } from "next/server";
import { Order, Wishlist, Cart, Guest } from "../db/models";
import mongoose from "mongoose";

export async function mergeGuestData(guestId: string, userId: string) {
  if (!guestId || !userId) return;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Update Guest record
  await Guest.findOneAndUpdate(
    { guestId },
    { userId: userObjectId },
    { upsert: true },
  );

  // 2. Link Orders
  await Order.updateMany(
    { guestId, userId: { $exists: false } },
    { userId: userObjectId },
  );

  // 3. Merge Wishlist
  const guestWishlist = await Wishlist.find({ guestId });
  for (const item of guestWishlist) {
    try {
      await Wishlist.create({
        userId: userObjectId,
        productId: item.productId,
      });
    } catch (e) {
      // Ignore duplicate key error
    }
  }
  await Wishlist.deleteMany({ guestId });

  // 4. Merge Cart
  const guestCart = await Cart.findOne({ guestId });
  if (guestCart && guestCart.items.length > 0) {
    const userCart = await Cart.findOne({ userId: userObjectId });
    if (userCart) {
      // Merge items
      const mergedItems = [...userCart.items];
      for (const guestItem of guestCart.items) {
        const existingItem = mergedItems.find(
          (i) =>
            i.productId.toString() === guestItem.productId.toString() &&
            i.variantId?.toString() === guestItem.variantId?.toString(),
        );
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      }
      userCart.items = mergedItems;
      await userCart.save();
    } else {
      // Convert guest cart to user cart
      await Cart.create({
        userId: userObjectId,
        items: guestCart.items,
      });
    }
    await Cart.deleteOne({ guestId });
  }
}

export const upsertGuest = async (
  req: NextRequest,
  { email, name, phone }: { email?: string; name?: string; phone?: string },
) => {
  try {
    const guest = await Guest.findOneAndUpdate(
      { guestId: req.headers.get("x-guest-id") },
      {
        ...(email && { email }),
        ...(name && { name }),
        ...(phone && { phone }),
      },
      { upsert: true },
    );
    return guest;
  } catch (error) {
    return error;
  }
};
