import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Product from "@/lib/db/models/Product";
import Payment from "@/lib/db/models/Payment";
import DeliveryLocation from "@/lib/db/models/DeliveryLocation";
import { CheckoutSchema } from "@/lib/validators/order.schema";
import { paymentManager } from "@/lib/services/payment/paymentManager";
import { generateOrderNumber } from "@/lib/utils/helpers";
import { AuthService } from "@/lib/services/auth.service";
import {
  COOKIE_ACCESS_TOKEN,
  PAYMENT_CALLBACK_URL,
} from "@/lib/utils/constants";
import { Coupon, StoreSettings, ProductVariant } from "@/lib/db/models";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    } = result.data;

    // Retrieve user identity from either proxy headers or access token cookie.
    let userId = req.headers.get("x-user-id");
    let userEmail = req.headers.get("x-user-email");
    const guestIdHeader = req.headers.get("x-guest-id");

    if (!userId) {
      const accessToken = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
      console.log("Access token from cookie:", accessToken);
      if (accessToken) {
        try {
          const payload = AuthService.verifyAccessToken(accessToken);
          userId = payload.id;
          userEmail = payload.email;
          console.log("Authenticated user from token:", payload);
        } catch {
          userId = null;
          userEmail = null;
        }
      }
    }

    // Recalculate and verify pricing on server
    let subtotal = 0;
    const verifiedItems = [];

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
        if (!dbVariant || dbVariant.productId.toString() !== item.productId.toString()) {
          return NextResponse.json(
            { success: false, message: `Variant not found or invalid: ${item.name}` },
            { status: 400 },
          );
        }
        if (dbVariant.price) {
          activePrice = dbVariant.price;
        }
        stockAvailable = dbVariant.stock;
        variantName = Array.from(dbVariant.attributes.entries())
          .map(([k, v]) => `${k}: ${v}`)
          .join(" / ");
      }

      // Check stock
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
        name: variantName ? `${dbProduct.name} (${variantName})` : dbProduct.name,
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
          // await Coupon.updateOne(
          //   { _id: dbCoupon._id },
          //   { $inc: { usedCount: 1 } },
          //   { session },
          // );
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

    // Fetch settings to determine active provider
    const settings = await (StoreSettings as any).getSettings();
    const activeProviderName = settings.paymentSettings?.activeProvider || "monnify";

    // Create unique order number & payment reference
    const orderNumber = generateOrderNumber();
    const paymentReference = `PAY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Create Order in DB (status: pending)
    const order = new Order({
      userId: userId || undefined,
      orderNumber,
      items: verifiedItems,
      shippingAddress,
      status: "pending",
      subtotal,
      deliveryFee,
      deliveryMethod: result.data.deliveryMethod,
      deliveryLocationId: deliveryLocation?._id,
      discount,
      total,
      couponUsed: couponUsed || undefined,
      isGuest,
      guestEmail: isGuest ? guestEmail : undefined,
      guestPhone: isGuest ? guestPhone : undefined,
      guestId: (isGuest && guestIdHeader) ? guestIdHeader : undefined,
      notes,
    });
    const payment = new Payment({
      orderId: order._id,
      userId: userId || undefined,
      reference: paymentReference,
      amount: total,
      status: "initialized",
      provider: activeProviderName,
    });
    order.paymentId = payment._id;
    await order.save({ session });
    await payment.save({ session });


    // Link payment inside order

    // Decrement inventory stock
    // for (const item of items) {
    //   await Product.findByIdAndUpdate(
    //     item.productId,
    //     {
    //       $inc: { stock: -item.quantity, salesCount: item.quantity },
    //     },
    //     { session },
    //   );
    // }

    // Attempt Payment Initialization
    let checkoutUrl = "";
    let checkoutSuccess = false;

    try {
      const activeProvider = await paymentManager.getActivatedProvider();
      console.log("Active payment provider:", activeProvider.name);
      console.log("email: ", userEmail, guestEmail);
      const email = isGuest ? guestEmail! : userEmail!;
      const name = isGuest ? shippingAddress.fullName : "Store User";

      const paymentResult = await activeProvider.initializePayment({
        amount: total,
        customerEmail: email,
        customerName: name,
        paymentReference,
        callbackUrl: PAYMENT_CALLBACK_URL,
        description: `Order ${orderNumber} payment`,
      });

      if (paymentResult.success && paymentResult.checkoutUrl) {
        checkoutUrl = paymentResult.checkoutUrl;
        checkoutSuccess = true;

        // Update payment record with provider and metadata
        payment.provider = activeProvider.name as any;
        payment.status = "pending";
        payment.metadata = paymentResult.gatewayResponse;
        await payment.save({ session });
      } else {
        throw new Error(paymentResult.message || "Payment initialization failed");
      }
    } catch (error: any) {
      console.error("Payment provider error:", error.message);
      throw error;
    }

    // Return Checkout configurations
    if (checkoutSuccess) {
      await session.commitTransaction();
      return NextResponse.json({
        success: true,
        message: "Payment initialized successfully",
        paymentReference,
        checkoutUrl,
      });
    } else {
      throw new Error("Payment initialization failed");
    }
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error("Payment initialization error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
