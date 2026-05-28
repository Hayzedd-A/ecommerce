"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ShoppingBag, CreditCard, Shield, Truck, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

import { CheckoutSchema, CheckoutInput } from "@/lib/validators/order.schema";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { formatCurrency } from "@/lib/utils/formatters";
import { clearCart } from "@/lib/store/slices/cartSlice";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import apiClient from "@/lib/api/client";

// Delivery zones mapping
const DELIVERY_ZONES = [
  { name: "Lagos Main / Island", fee: 2500, days: "1-2 Days" },
  { name: "South West (Oyo, Ogun, Osun, etc.)", fee: 4000, days: "2-3 Days" },
  { name: "South South / East (Rivers, Enugu, etc.)", fee: 5500, days: "3-5 Days" },
  { name: "Abuja / North", fee: 6500, days: "4-6 Days" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items, subtotal } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [deliveryZone, setDeliveryZone] = useState(DELIVERY_ZONES[0]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      isGuest: !isAuthenticated,
      shippingAddress: {
        fullName: user?.name || "",
        phone: user?.phone || "",
        street: "",
        city: "",
        state: "",
        country: "Nigeria",
        zipCode: "",
      },
      items: [],
    },
  });

  // Hydrate items in form and update guest flags when store changes
  useEffect(() => {
    setValue("items", items);
    setValue("isGuest", !isAuthenticated);
    if (user) {
      setValue("shippingAddress.fullName", user.name);
      setValue("shippingAddress.phone", user.phone || "");
    }
  }, [items, isAuthenticated, user, setValue]);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <div className="h-16 w-16 rounded-full bg-surface-secondary flex items-center justify-center text-muted mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Add items to your cart before checking out.</p>
        <Button onClick={() => router.push("/products")} variant="primary" className="w-full">
          Browse Products
        </Button>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    try {
      // Mock validation logic to allow perfect frontend testing
      if (couponCode.toUpperCase() === "SAVE10") {
        const discountAmt = Math.round(subtotal * 0.1);
        setCouponDiscount(discountAmt);
        toast.success("Coupon code SAVE10 applied! 10% discount added.");
      } else {
        toast.error("Invalid coupon code. Try 'SAVE10'");
      }
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handlePlaceOrder = async (data: CheckoutInput) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        deliveryFee: deliveryZone.fee,
        discount: couponDiscount,
        couponUsed: couponDiscount > 0 ? "SAVE10" : undefined,
        total: subtotal + deliveryZone.fee - couponDiscount,
      };

      const response = await apiClient.post("/payments/initialize", payload);
      const resData = response.data;

      if (resData.success) {
        toast.success("Order created! Redirecting to checkout portal...");
        
        // If Monnify returned a dynamic checkout URL, send them there
        if (resData.checkoutUrl) {
          router.push(resData.checkoutUrl);
        } else {
          // Fallback to local success screen (mock payment mode)
          dispatch(clearCart());
          router.push(`/checkout/success?ref=${resData.paymentReference}`);
        }
      } else {
        toast.error(resData.message || "Checkout failed to initialize");
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.response?.data?.message || "Something went wrong during checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = subtotal + deliveryZone.fee - couponDiscount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LHS - Checkout Address form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 md:p-8" glass>
            <form onSubmit={handleSubmit(handlePlaceOrder)} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">1. Shipping & Contact Info</h2>
                <p className="text-xs text-muted-foreground">Specify the delivery address for your items</p>
              </div>

              {/* Guest Fields if not authenticated */}
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-surface-secondary">
                  <Input
                    label="Contact Email"
                    type="email"
                    placeholder="guest@example.com"
                    error={errors.guestEmail?.message}
                    {...register("guestEmail")}
                  />
                  <Input
                    label="Contact Phone"
                    type="tel"
                    placeholder="08012345678"
                    error={errors.guestPhone?.message}
                    {...register("guestPhone")}
                  />
                </div>
              )}

              {/* Address details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Recipient's Full Name"
                    type="text"
                    placeholder="John Doe"
                    error={errors.shippingAddress?.fullName?.message}
                    {...register("shippingAddress.fullName")}
                  />
                  <Input
                    label="Delivery Phone Number"
                    type="tel"
                    placeholder="08012345678"
                    error={errors.shippingAddress?.phone?.message}
                    {...register("shippingAddress.phone")}
                  />
                </div>

                <Input
                  label="Street Address"
                  type="text"
                  placeholder="No. 12 Commerce Street, Lekki Phase 1"
                  error={errors.shippingAddress?.street?.message}
                  {...register("shippingAddress.street")}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    type="text"
                    placeholder="Lekki"
                    error={errors.shippingAddress?.city?.message}
                    {...register("shippingAddress.city")}
                  />
                  <Input
                    label="State"
                    type="text"
                    placeholder="Lagos"
                    error={errors.shippingAddress?.state?.message}
                    {...register("shippingAddress.state")}
                  />
                </div>
              </div>

              {/* Shipping Method Zone Selection */}
              <div className="space-y-4 pt-6 border-t border-border/80">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">2. Select Shipping Method</h3>
                  <p className="text-xs text-muted-foreground">Select your region for delivery pricing</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DELIVERY_ZONES.map((zone) => (
                    <button
                      key={zone.name}
                      type="button"
                      onClick={() => setDeliveryZone(zone)}
                      className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        deliveryZone.name === zone.name
                          ? "border-primary-500 bg-primary-50/10 ring-2 ring-primary-100"
                          : "border-border bg-surface hover:bg-surface-secondary"
                      }`}
                    >
                      <span className="text-xs font-bold text-foreground">{zone.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {zone.days}
                      </span>
                      <span className="text-sm font-black text-primary-500 mt-2">
                        {formatCurrency(zone.fee)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment disclaimer & submit button */}
              <div className="pt-6 border-t border-border/80 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-surface-secondary border border-border rounded-xl text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                  <span>
                    Your payment will be secured and processed via Monnify. Your financial data is encrypted and completely private.
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-4 uppercase font-bold tracking-wider h-14"
                  isLoading={isLoading}
                  leftIcon={<CreditCard className="h-5 w-5" />}
                >
                  Pay Now {formatCurrency(totalAmount)}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* RHS - Order Summary Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6" glass>
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-4 mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary-500" />
              Order Summary
            </h2>

            {/* Items list */}
            <div className="divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId || ""}`} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 rounded-lg overflow-hidden border bg-white flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-4 w-4 text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-foreground truncate">{item.name}</h4>
                    {item.variantLabel && (
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        {item.variantLabel}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Codes */}
            <div className="pt-4 border-t border-border mt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Have a Coupon Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-surface-secondary text-foreground text-xs px-3.5 py-2.5 rounded-lg border border-border focus:border-primary-500 focus:outline-none"
                />
                <Button
                  onClick={handleApplyCoupon}
                  isLoading={isVerifyingCoupon}
                  variant="secondary"
                  className="px-4 py-2.5 text-xs font-semibold h-10 border border-border"
                >
                  Apply
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 block">
                Use coupon <span className="font-bold text-primary-500">SAVE10</span> to get 10% off.
              </span>
            </div>

            {/* Calculations breakdown */}
            <div className="pt-6 border-t border-border mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee ({deliveryZone.name})</span>
                <span>{formatCurrency(deliveryZone.fee)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-success-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Coupon Discount
                  </span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-foreground pt-4 border-t border-border/80">
                <span>Total Amount</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
