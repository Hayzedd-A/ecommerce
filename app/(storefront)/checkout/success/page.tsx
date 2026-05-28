"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Mail } from "lucide-react";

import { useAppDispatch } from "@/lib/store/hooks";
import { clearCart } from "@/lib/store/slices/cartSlice";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OrderSuccessPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const paymentRef = searchParams.get("ref") || "PAY-MOCK";

  // Clear local cart items since order has been placed and paid
  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 relative overflow-hidden bg-background">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-success-500/10 blur-[120px] pointer-events-none" />

      <div className="text-center space-y-6 z-10 relative">
        {/* Animated Check icon */}
        <div className="h-16 w-16 rounded-full bg-success-50 text-success-500 flex items-center justify-center mx-auto shadow-soft animate-bounce-soft">
          <CheckCircle2 className="h-10 w-10 fill-current bg-white rounded-full" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Thank you for shopping with us. Your payment has been secured and your order is currently processing.
          </p>
        </div>

        {/* Order Details card */}
        <Card className="p-6 text-left space-y-4" glass>
          <div className="flex justify-between items-center text-xs pb-3 border-b border-border">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">Payment Reference</span>
            <span className="font-mono font-bold text-foreground bg-surface-secondary px-2.5 py-1 rounded-md border border-border">
              {paymentRef}
            </span>
          </div>

          <div className="flex items-start gap-3.5 text-xs text-muted-foreground">
            <Mail className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">Email Notification</span>
              <p className="mt-0.5 leading-relaxed">
                We have sent an order confirmation along with your digital invoice to your registered/guest email address.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">Secured Transaction</span>
              <p className="mt-0.5 leading-relaxed">
                Your payment of this checkout session was processed safely using Monnify 256-bit encryption.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/products" className="flex-1">
            <Button variant="secondary" className="w-full py-3 gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
          <Link href="/account" className="flex-1">
            <Button variant="primary" className="w-full py-3 gap-1.5" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Go to Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
