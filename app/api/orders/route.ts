import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Product from "@/lib/db/models/Product";
import Payment from "@/lib/db/models/Payment";
import DeliveryLocation from "@/lib/db/models/DeliveryLocation";
import { CheckoutSchema } from "@/lib/validators/order.schema";
import { generateOrderNumber } from "@/lib/utils/helpers";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_ACCESS_TOKEN } from "@/lib/utils/constants";
import { Coupon, StoreSettings, ProductVariant } from "@/lib/db/models";
import mongoose from "mongoose";
import { getRequestUser } from "@/lib/auth/getIdentity";
import { upsertGuest } from "@/lib/auth/mergeGuest";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await dbConnect();
    const body = await req.json();

    // Validate checkout schema
    const result = CheckoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const {
      shippingAddress,
      items,
      notes,
      couponUsed,
      isGuest,
      guestEmail,
      guestPhone,
      paymentRef,
      checkoutMethod,
    } = result.data;

    await upsertGuest(req, {
      email: guestEmail,
      name: shippingAddress.fullName,
      phone: guestPhone,
    });
    // Identify user from cookie if present
    const { _id: userId, email: userEmail } = await getRequestUser(req);

    // Recalculate and verify pricing on server
    let subtotal = 0;
    const verifiedItems: any[] = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.name}` },
          { status: 400 },
        );
      }

      let activePrice = dbProduct.discountPrice || dbProduct.price;
      let stockAvailable = dbProduct.stock;
      let variantName = "";

      if (item.variantId) {
        const dbVariant = await ProductVariant.findById(item.variantId);
        if (
          !dbVariant ||
          dbVariant.productId.toString() !== item.productId.toString()
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Variant not found or invalid: ${item.name}`,
            },
            { status: 400 },
          );
        }
        if (dbVariant.price) activePrice = dbVariant.price;
        stockAvailable = dbVariant.stock;
        variantName = Array.from(dbVariant.attributes.entries())
          .map(([k, v]) => `${k}: ${v}`)
          .join(" / ");
      }

      if (dbProduct.trackStock && stockAvailable < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for product: ${dbProduct.name} ${variantName}`,
          },
          { status: 400 },
        );
      }

      subtotal += activePrice * item.quantity;

      verifiedItems.push({
        productId: dbProduct._id,
        variantId: item.variantId || undefined,
        name: variantName
          ? `${dbProduct.name} (${variantName})`
          : dbProduct.name,
        price: activePrice,
        quantity: item.quantity,
        image: dbProduct.images?.[0]?.url || item.image,
      });
    }

    // Apply coupon discount on server
    let discount = 0;
    if (couponUsed) {
      const dbCoupon = await Coupon.findOne({ code: couponUsed });
      if (dbCoupon) {
        if (dbCoupon.maxUses && dbCoupon.usedCount >= dbCoupon.maxUses) {
          return NextResponse.json(
            { success: false, message: "Coupon has reached its maximum uses" },
            { status: 400 },
          );
        }
        const isExpired = dbCoupon.expiresAt && dbCoupon.expiresAt < new Date();
        const isStarted = dbCoupon.startsAt && dbCoupon.startsAt < new Date();
        if (!isExpired && isStarted && dbCoupon.isActive) {
          if (dbCoupon.type === "percentage") {
            discount = Math.round(subtotal * (dbCoupon.value / 100));
          } else if (dbCoupon.type === "fixed") {
            discount = dbCoupon.value;
          }
        }
      }
    }

    // Validate selected delivery location and determine delivery fee
    let deliveryLocation = null;
    let deliveryFee = 0;
    if (result.data.deliveryLocationId) {
      deliveryLocation = await DeliveryLocation.findById(
        result.data.deliveryLocationId,
      );
      if (!deliveryLocation || !deliveryLocation.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected delivery location is not available",
          },
          { status: 400 },
        );
      }
      if (deliveryLocation.type !== result.data.deliveryMethod) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected delivery location does not match the chosen delivery method",
          },
          { status: 400 },
        );
      }
      deliveryFee = deliveryLocation.price;
    }

    const total = subtotal + deliveryFee - discount;

    // Create unique order number & payment reference
    const orderNumber = generateOrderNumber();
    const paymentReference =
      paymentRef || `BT-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Create Order in DB (status: pending)
    const order = new Order({
      userId: userId || undefined,
      orderNumber,
      items: verifiedItems,
      shippingAddress,
      subtotal,
      deliveryFee,
      deliveryMethod: result.data.deliveryMethod,
      deliveryLocationId: deliveryLocation?._id,
      discount,
      total,
      couponUsed: couponUsed || undefined,
      notes,
    });

    const payment = new Payment({
      orderId: order._id,
      userId: userId || undefined,
      reference: paymentReference,
      amount: total,
      status: "pending",
      provider: checkoutMethod,
    });
    order.paymentId = payment._id;
    await order.save({ session });
    await payment.save({ session });

    await session.commitTransaction();
    return NextResponse.json({
      success: true,
      message: "Order created",
      orderId: order._id,
      paymentReference,
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error("Create order (bank transfer) error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: message || "Internal server error",
        error: message,
      },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
