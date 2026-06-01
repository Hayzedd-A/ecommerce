import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Order from "@/lib/db/models/Order";
import { paymentManager } from "@/lib/services/payment/paymentManager";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const url = new URL(req.url);
        const reference =
            url.searchParams.get("reference") ||
            url.searchParams.get("paymentReference") ||
            url.searchParams.get("trxref");

        if (!reference) {
            return NextResponse.json(
                { success: false, message: "Missing payment reference" },
                { status: 400 },
            );
        }

        const payment = await Payment.findOne({ reference });
        if (!payment) {
            return NextResponse.json(
                { success: false, message: "Payment not found", status: "not_found" },
                { status: 404 },
            );
        }

        if (!payment.webhookVerified) {
            const provider = await paymentManager.getConfiguredProvider(payment.provider);
            const verifyResult = await provider.verifyPayment(reference);

            if (verifyResult.status === "paid") {
                payment.status = "paid";
                payment.paidAt = payment.paidAt ?? new Date();
                payment.providerReference = verifyResult.reference || payment.providerReference;
                await payment.save();

                const order = await Order.findById(payment.orderId);
                if (order) {
                    order.status = "processing";
                    await order.save();
                }

                return NextResponse.json({
                    success: true,
                    status: "paid",
                    reference,
                    amount: verifyResult.amount,
                    message: "Payment verified successfully",
                });
            }


            if (
                verifyResult.status === "failed" ||
                verifyResult.status === "expired" ||
                verifyResult.status === "reversed"
            ) {
                payment.status = verifyResult.status;
                payment.paidAt = undefined;
                await payment.save();

                const order = await Order.findById(payment.orderId);
                if (order) {
                    order.status = "cancelled";
                    await order.save();
                }

                return NextResponse.json({
                    success: false,
                    status: verifyResult.status,
                    reference,
                    message: verifyResult.message || "Payment failed",
                });
            }

            return NextResponse.json({
                success: false,
                status: verifyResult.status || payment.status,
                reference,
                message: verifyResult.message || "Payment is still pending",
            });
        }

        return NextResponse.json({
            success: payment.status === "paid",
            status: payment.status,
            reference,
            message:
                payment.status === "paid"
                    ? "Payment already verified via webhook"
                    : "Payment is still pending",
        });
    } catch (error: any) {
        console.error("Payment verify route error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error?.message || "Unable to verify payment",
            },
            { status: 500 },
        );
    }
}
