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
import { COOKIE_ACCESS_TOKEN } from "@/lib/utils/constants";
import { Coupon } from "@/lib/db/models";
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

    console.log("checkout body: ", body);
    console.log("result: ", result);

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

    if (!userId) {
      const accessToken = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
      if (accessToken) {
        try {
          const payload = AuthService.verifyAccessToken(accessToken);
          userId = payload.id;
          userEmail = payload.email;
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

      // Check stock
      if (dbProduct.trackStock && dbProduct.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for product: ${dbProduct.name}`,
          },
          { status: 400 },
        );
      }

      const activePrice = dbProduct.discountPrice || dbProduct.price;
      subtotal += activePrice * item.quantity;

      verifiedItems.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: activePrice,
        quantity: item.quantity,
        image: dbProduct.images?.[0]?.url || item.image,
      });
    }

    // Apply coupon discount on server
    let discount = 0;
    if (couponUsed) {
      console.log("coupon used: ", couponUsed);
      const dbCoupon = await Coupon.findOne({ code: couponUsed });
      console.log("coupon: ", dbCoupon);
      if (dbCoupon) {
        if (dbCoupon.usedCount >= dbCoupon.maxUses) {
          return NextResponse.json(
            { success: false, message: "Coupon has reached its maximum uses" },
            { status: 400 },
          );
        }
        const isExpired = dbCoupon.expiresAt < new Date();
        const isStarted = dbCoupon.startsAt < new Date();
        console.log("isExpired: ", isExpired);
        console.log("isStarted: ", isStarted);
        if (!isExpired && isStarted && dbCoupon.isActive) {
          if (dbCoupon.type === "percentage") {
            discount = Math.round(subtotal * (dbCoupon.value / 100));
          } else if (dbCoupon.type === "fixed") {
            discount = dbCoupon.value;
          }
          await Coupon.updateOne(
            { _id: dbCoupon._id },
            { $inc: { usedCount: 1 } },
            { session },
          );
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
    const paymentReference = `PAY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Create Order in DB (status: pending_payment)
    const order = new Order({
      userId: userId || undefined,
      orderNumber,
      items: verifiedItems,
      shippingAddress,
      status: "pending_payment",
      subtotal,
      deliveryFee,
      deliveryMethod: result.data.deliveryMethod,
      deliveryLocationId: deliveryLocation?._id,
      deliveryLocationLabel: deliveryLocation
        ? `${deliveryLocation.name} (${deliveryLocation.city}, ${deliveryLocation.state})`
        : undefined,
      discount,
      total,
      couponUsed: couponUsed || undefined,
      isGuest,
      guestEmail: isGuest ? guestEmail : undefined,
      guestPhone: isGuest ? guestPhone : undefined,
      notes,
    });
    const payment = new Payment({
      orderId: order._id,
      userId: userId || undefined,
      reference: paymentReference,
      amount: total,
      status: "initialized",
      provider: "monnify",
    });
    order.paymentId = payment._id;
    await order.save({ session });
    await payment.save({ session });

    // Link payment inside order

    // Decrement inventory stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -item.quantity, salesCount: item.quantity },
        },
        { session },
      );
    }

    // Attempt Monnify Initialization
    let checkoutUrl = "";
    let checkoutSuccess = false;

    const hasCredentials =
      !!process.env.MONNIFY_API_KEY &&
      !!process.env.MONNIFY_SECRET_KEY &&
      !!process.env.MONNIFY_CONTRACT_CODE;

    if (hasCredentials) {
      const email = isGuest ? guestEmail! : userEmail!;
      const name = isGuest ? shippingAddress.fullName : "Store User";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const paymentResult = await paymentManager
        .getProvider("monnify")
        .initializePayment({
          amount: total,
          customerEmail: email,
          customerName: name,
          paymentReference,
          callbackUrl: `${appUrl}/api/payments/callback`,
          description: `Order ${orderNumber} payment`,
        });
      console.log("paymentResult: ", paymentResult);
      if (paymentResult.success && paymentResult.checkoutUrl) {
        checkoutUrl = paymentResult.checkoutUrl;
        checkoutSuccess = true;

        // Update payment gateway response
        payment.status = "pending";
        payment.metadata = paymentResult.gatewayResponse;
        await payment.save({ session });
      }
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
      // Graceful Development/Mock mode when credentials are not configured
      // Set payment status directly to "paid" & order status to "paid" for immediate validation
      throw new Error("Payment initialization failed");
      // payment.status = "paid";
      // payment.paidAt = new Date();
      // await payment.save({ session });

      // order.status = "paid";
      // await order.save({ session });

      // return NextResponse.json({
      //   success: true,
      //   message: "Mock payment initialized successfully (Development Mode)",
      //   paymentReference,
      // });
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
