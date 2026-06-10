import { ClientSession } from "mongoose";
import { Payment, Product, ProductVariant, Coupon } from "../db/models";
import { IOrderDocument } from "../db/models/Order";

/**
 * Generate a unique payment reference.
 */
export async function generatePaymentReference(): Promise<string> {
  const generateRef = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY-${timestamp}-${random}`.toUpperCase();
  };
  let ref = generateRef();
  let notFound = true;
  while (notFound) {
    const isRefExists = await Payment.findOne({ reference: ref });
    if (isRefExists) {
      ref = generateRef();
    } else {
      notFound = false;
    }
  }
  return ref;
}

export async function updateProductSalesAndStock(
  order: IOrderDocument,
  session: ClientSession,
) {
  if (!order || !Array.isArray(order.items)) return;

  const items = order.items;

  for (const item of items) {
    try {
      const productId = typeof item.productId === "string" ? item.productId : (item.productId as any)?._id;
      const variantId = item.variantId as string | undefined;
      const qty = Number(item.quantity) || 0;
      if (!productId || qty <= 0) continue;

      // Load product to check stock tracking rules
      const product = await Product.findById(productId);
      if (!product) continue;

      // If variant provided, update variant stock first
      if (variantId) {
        const variant = await ProductVariant.findById(variantId);
        if (variant) {
          if (product.trackStock) {
            let newStock = (variant.stock ?? 0) - qty;
            if (!product.allowNegativeStock && newStock < 0) newStock = 0;
            variant.stock = newStock;
            await variant.save({ session });
          }
        }

        // update product-level stock if tracked
        if (product.trackStock) {
          let newProdStock = (product.stock ?? 0) - qty;
          if (!product.allowNegativeStock && newProdStock < 0) newProdStock = 0;
          product.stock = newProdStock;
        }

        // increment sales count on product
        product.salesCount = (product.salesCount ?? 0) + qty;
        await product.save({ session });
      } else {
        // No variant: update product stock and salesCount
        if (product.trackStock) {
          let newProdStock = (product.stock ?? 0) - qty;
          if (!product.allowNegativeStock && newProdStock < 0) newProdStock = 0;
          product.stock = newProdStock;
        }
        product.salesCount = (product.salesCount ?? 0) + qty;
        await product.save({ session });
      }
    } catch (err) {
      // log and continue with other items
      // eslint-disable-next-line no-console
      console.error("Failed updating stock/sales for item:", item, err);
      continue;
    }
  }
}

export async function incrementCouponUsage(couponCode?: string, session?: ClientSession) {
  if (!couponCode) return;
  try {
    const code = couponCode.toString().toUpperCase();
    await Coupon.findOneAndUpdate(
      { code },
      { $inc: { usedCount: 1 } },
      { session },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to increment coupon usage:", couponCode, err);
  }
}
