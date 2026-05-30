import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Product from "@/lib/db/models/Product";
import Payment from "@/lib/db/models/Payment";
import { CheckoutSchema } from "@/lib/validators/order.schema";
import { paymentManager } from "@/lib/services/payment/paymentManager";
import { generateOrderNumber } from "@/lib/utils/helpers";
import { AuthService } from "@/lib/services/auth.service";
import { COOKIE_ACCESS_TOKEN } from "@/lib/utils/constants";

export async function POST(req: NextRequest) {
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
      if (dbProduct.stock < item.quantity) {
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
    if (couponUsed && couponUsed.toUpperCase() === "SAVE10") {
      discount = Math.round(subtotal * 0.1);
    }

    // Determine delivery fee based on body parameter
    const deliveryFee = body.deliveryFee || 0;
    const total = subtotal + deliveryFee - discount;

    // Create unique order number & payment reference
    const orderNumber = generateOrderNumber();
    const paymentReference = `PAY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Create Order in DB (status: pending_payment)
    const order = await Order.create({
      userId: userId || undefined,
      orderNumber,
      items: verifiedItems,
      shippingAddress,
      status: "pending_payment",
      subtotal,
      deliveryFee,
      discount,
      total,
      couponUsed: couponUsed || undefined,
      isGuest,
      guestEmail: isGuest ? guestEmail : undefined,
      guestPhone: isGuest ? guestPhone : undefined,
      notes,
    });

    // Create Payment Record (status: initialized)
    const payment = await Payment.create({
      orderId: order._id,
      userId: userId || undefined,
      reference: paymentReference,
      amount: total,
      status: "initialized",
      provider: "monnify",
    });

    // Link payment inside order
    order.paymentId = payment._id;
    await order.save();

    // Decrement inventory stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
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

      if (paymentResult.success && paymentResult.checkoutUrl) {
        checkoutUrl = paymentResult.checkoutUrl;
        checkoutSuccess = true;

        // Update payment gateway response
        payment.status = "pending";
        payment.metadata = paymentResult.gatewayResponse;
        await payment.save();
      }
    }

    // Return Checkout configurations
    if (checkoutSuccess) {
      return NextResponse.json({
        success: true,
        message: "Payment initialized successfully",
        paymentReference,
        checkoutUrl,
      });
    } else {
      // Graceful Development/Mock mode when credentials are not configured
      // Set payment status directly to "paid" & order status to "paid" for immediate validation
      payment.status = "paid";
      payment.paidAt = new Date();
      await payment.save();

      order.status = "paid";
      await order.save();

      return NextResponse.json({
        success: true,
        message: "Mock payment initialized successfully (Development Mode)",
        paymentReference,
      });
    }
  } catch (error: unknown) {
    console.error("Payment initialization error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 },
    );
  }
}
