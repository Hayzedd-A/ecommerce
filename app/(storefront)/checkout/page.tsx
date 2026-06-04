"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  CreditCard,
  Shield,
  Truck,
  MapPin,
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BanknoteArrowDown,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { CheckoutSchema, CheckoutInput } from "@/lib/validators/order.schema";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { formatCurrency } from "@/lib/utils/formatters";
import { clearCart } from "@/lib/store/slices/cartSlice";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import apiClient from "@/lib/api/client";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import BankTransferModal from "@/components/storefront/BankTransferModal";
import { IDeliveryLocationDocument } from "@/lib/db/models/DeliveryLocation";
import { IDeliveryLocation } from "@/lib/types";
import { SocialIcon } from "react-social-icons";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { deliveryEnabled, pickupEnabled, checkoutMethod } = useStoreSettings();

  const { items, subtotal } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [deliveryLocations, setDeliveryLocations] = useState<
    IDeliveryLocation[]
  >([]);
  const [selectedDeliveryLocationId, setSelectedDeliveryLocationId] =
    useState<string>("");

  // Cascading filter state
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] =
    useState<IDeliveryLocation | null>(null);
  const [couponResponse, setCouponResponse] = useState<{
    message: string;
    status: "success" | "error";
  }>({ message: "", status: "success" });

  const [verificationReference, setVerificationReference] =
    useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "pending" | "paid" | "failed" | "timeout"
  >("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      deliveryLocationId: "",
      deliveryMethod: "delivery",
    },
  });

  useEffect(() => {
    setValue("items", items);
    setValue("isGuest", !isAuthenticated);
    setValue("subtotal", subtotal);
    setValue("total", subtotal);
    setValue("deliveryMethod", deliveryMethod);
    if (user) {
      setValue("shippingAddress.fullName", user.name);
      setValue("shippingAddress.phone", user.phone || "");
    }
  }, [items, isAuthenticated, user, setValue]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await apiClient.get("/delivery-locations");
        const locations = response.data.data || [];
        setDeliveryLocations(locations);
      } catch (error: any) {
        console.error("Failed to load delivery locations:", error);
        toast.error("Unable to load delivery locations");
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    const paymentReference =
      searchParams.get("reference") ||
      searchParams.get("paymentReference") ||
      searchParams.get("trxref");

    if (!paymentReference) {
      return;
    }

    setVerificationReference(paymentReference);
    setVerificationStatus("pending");
    setVerificationMessage("Checking payment status...");
    setShowVerificationModal(true);
  }, [searchParams]);

  useEffect(() => {
    if (!verificationReference || verificationStatus !== "pending") {
      return;
    }

    let attempts = 0;
    let active = true;

    const checkStatus = async () => {
      if (!active) return;
      attempts += 1;

      try {
        const response = await apiClient.get("/payments/verify", {
          params: { reference: verificationReference },
        });
        const data = response.data;

        if (data.success && data.status === "paid") {
          setVerificationStatus("paid");
          setVerificationMessage("Payment verified. Redirecting...");
          window.setTimeout(() => {
            router.push(
              `/checkout/success?ref=${encodeURIComponent(
                verificationReference,
              )}`,
            );
          }, 250);
          return;
        }

        if (
          data.status === "failed" ||
          data.status === "reversed" ||
          data.status === "expired"
        ) {
          setVerificationStatus("failed");
          setVerificationMessage(data.message || "Payment failed.");
          window.setTimeout(() => {
            setShowVerificationModal(false);
          }, 2200);
          return;
        }

        if (attempts >= 5) {
          setVerificationStatus("timeout");
          setVerificationMessage(
            "Payment is still pending. Webhook may take a few more seconds.",
          );
          window.setTimeout(() => {
            setShowVerificationModal(false);
          }, 2200);
          return;
        }

        setVerificationMessage("Waiting for payment confirmation...");
        window.setTimeout(checkStatus, 2000);
      } catch (error: any) {
        setVerificationMessage(
          error.response?.data?.message ||
            "Unable to verify payment at the moment.",
        );

        if (attempts >= 5) {
          setVerificationStatus("timeout");
          window.setTimeout(() => {
            setShowVerificationModal(false);
          }, 2200);
        } else {
          window.setTimeout(checkStatus, 2000);
        }
      } finally {
        // remove the query params from the URL to prevent re-triggering verification on page reload
        router.replace("/checkout", { scroll: false });
      }
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, [verificationReference, verificationStatus, router]);

  // --- Cascading dropdown derived data ---
  const filteredByMethod = useMemo(
    () => deliveryLocations.filter((loc) => loc.type === deliveryMethod),
    [deliveryLocations, deliveryMethod],
  );

  // Reset cascade when delivery method changes
  useEffect(() => {
    setSelectedCountry(filteredByMethod[0]?.country ?? "");
    setSelectedState("");
    setSelectedCity("");
    setSelectedDeliveryLocationId("");
  }, [deliveryMethod, filteredByMethod]);

  const countries = useMemo(
    () =>
      [
        ...new Set(filteredByMethod.map((loc) => loc.country).filter(Boolean)),
      ].sort(),
    [filteredByMethod],
  );

  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return [
      ...new Set(
        filteredByMethod
          .filter((loc) => loc.country === selectedCountry)
          .map((loc) => loc.state)
          .filter(Boolean),
      ),
    ].sort();
  }, [filteredByMethod, selectedCountry]);

  const cities = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    return [
      ...new Set(
        filteredByMethod
          .filter(
            (loc) =>
              loc.country === selectedCountry && loc.state === selectedState,
          )
          .map((loc) => loc.city)
          .filter(Boolean),
      ),
    ].sort();
  }, [filteredByMethod, selectedCountry, selectedState]);

  const locationsForCity = useMemo(() => {
    if (!selectedCountry || !selectedState || !selectedCity) return [];
    return filteredByMethod.filter(
      (loc) =>
        loc.country === selectedCountry &&
        loc.state === selectedState &&
        loc.city === selectedCity,
    );
  }, [filteredByMethod, selectedCountry, selectedState, selectedCity]);

  // Auto-select state if only one available
  useEffect(() => {
    if (states.length === 1) {
      setSelectedState(states[0]);
      setValue("shippingAddress.state", states[0]);
    } else {
      setSelectedState("");
    }
  }, [states]);

  // Auto-select city if only one available
  useEffect(() => {
    if (cities.length === 1) {
      setSelectedCity(cities[0]);
      setValue("shippingAddress.city", cities[0]);
    } else {
      setSelectedCity("");
    }
  }, [cities]);

  useEffect(() => {
    if (selectedCity) {
      const location = locationsForCity.find(
        (loc) => loc.city === selectedCity,
      );
      if (location) {
        setSelectedDeliveryLocationId(location._id);
        setSelectedDeliveryLocation(location);
        setValue("deliveryLocationId", location._id);
      }
    } else if (selectedState && locationsForCity.length === 0) {
      const location = filteredByMethod.find(
        (loc) => loc.state === selectedState,
      );
      if (location) {
        setSelectedDeliveryLocationId(location._id);
        setSelectedDeliveryLocation(location);
        setValue("deliveryLocationId", location._id);
      }
    } else {
      setSelectedDeliveryLocationId("");
    }
  }, [selectedCity, selectedState]);

  if (showVerificationModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Payment verification
              </p>
              <h2 className="mt-2 text-lg font-bold text-foreground">
                Verifying transaction
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowVerificationModal(false)}
              className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-secondary"
            >
              Close
            </button>
          </div>

          <div className="mt-5 space-y-4 text-sm text-muted-foreground">
            <p>
              Reference:{" "}
              <span className="font-mono text-foreground">
                {verificationReference}
              </span>
            </p>
            <p>{verificationMessage}</p>
            {verificationStatus === "pending" && (
              <div className="overflow-hidden rounded-full bg-surface-secondary h-2">
                <div className="h-2 w-3/4 animate-pulse rounded-full bg-primary-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <div className="h-16 w-16 rounded-full bg-surface-secondary flex items-center justify-center text-muted mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Your cart is empty
        </h2>
        <p className="text-sm text-muted-foreground">
          Add items to your cart before checking out.
        </p>
        <Button
          onClick={() => router.push("/products")}
          variant="primary"
          className="w-full"
        >
          Browse Products
        </Button>
      </div>
    );
  }

  const clearCoupon = (code?: string) => {
    if (code) setCouponCode(code);
    setCouponDiscount(0);
    setCouponResponse({ message: "", status: "success" });
  };

  // const selectedDeliveryLocation =
  //   locationsForCity.find((loc) => loc._id === selectedDeliveryLocationId) ||
  //   locationsForCity[0] ||
  //   null;
  // const selectedDeliveryFee = selectedDeliveryLocation?.price ?? 0;
  // const selectedDeliveryLabel = selectedDeliveryLocation
  //   ? `${selectedDeliveryLocation.name} — ${selectedDeliveryLocation.city}, ${selectedDeliveryLocation.state}`
  //   : "No location selected";

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    clearCoupon(couponCode);
    try {
      const res = await apiClient.post("/coupons/validate", {
        code: couponCode,
        subtotal,
      });
      if (res.data?.success && res.data.data) {
        setCouponResponse({
          message: res.data?.message || "Coupon applied successfully",
          status: "success",
        });
        const { discount, code } = res.data.data;
        setCouponDiscount(Number(discount) || 0);
        setCouponCode((code || couponCode).toString().toUpperCase());
        toast.success(`Coupon ${code || couponCode} applied.`);
      } else {
        toast.error(res.data?.message || "Failed to apply coupon");
      }
    } catch (err: any) {
      setCouponResponse({
        message: err.response?.data?.message || "Failed to apply coupon",
        status: "error",
      });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handlePlaceOrder = async (data: CheckoutInput) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        deliveryMethod,
        deliveryLocationId: selectedDeliveryLocation?._id,
        deliveryFee: selectedDeliveryLocation?.price,
        discount: couponDiscount,
        couponUsed: couponDiscount > 0 ? couponCode.toUpperCase() : undefined,
        total:
          subtotal + (selectedDeliveryLocation?.price ?? 0) - couponDiscount,
        subtotal,
      };

      const response = await apiClient.post("/payments/initialize", payload);
      const resData = response.data;

      if (resData.success) {
        toast.success("Order created! Redirecting to checkout portal...");
        if (resData.checkoutUrl) {
          router.push(resData.checkoutUrl);
        } else {
          dispatch(clearCart());
          router.push(`/checkout/success?ref=${resData.paymentReference}`);
        }
      } else {
        toast.error(resData.message || "Checkout failed to initialize");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong during checkout.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount =
    subtotal + (selectedDeliveryLocation?.price ?? 0) - couponDiscount;
  setValue("total", totalAmount);

  // ─── Select field shared style ───────────────────────────────────────────────
  const selectClass =
    "w-full bg-surface text-foreground text-sm px-3.5 py-2.5 rounded-xl border border-border " +
    "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 " +
    "disabled:opacity-40 disabled:cursor-not-allowed transition appearance-none cursor-pointer";

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">
          Secure Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LHS ─────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 md:p-8" glass>
              <form
                onSubmit={handleSubmit(handlePlaceOrder, (formError) => {
                  console.log("Validation errors:", formError);
                  toast.error(
                    "Please fix the highlighted errors and try again.",
                  );
                })}
                className="space-y-6"
              >
                {/* Section 1 – Shipping */}
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">
                    1. Contact Info
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Specify the delivery address for your items
                  </p>
                </div>

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
                  {/* <div className="grid grid-cols-2 gap-4">
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
                </div> */}
                </div>

                {/* ── Section 2 – Delivery Option ─────────────────────────────── */}
                {(deliveryEnabled || pickupEnabled) && (
                  <div className="space-y-5 pt-6 border-t border-border/80">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        2. Select Delivery Option
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Choose how you want to receive your order.
                      </p>
                    </div>

                    {/* ── Delivery / Pickup Switch ────────────────────────────── */}
                    <div className="flex items-center gap-4">
                      {/* Label: Delivery */}
                      {deliveryEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setValue("deliveryMethod", "delivery");
                            setDeliveryMethod("delivery");
                          }}
                          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                            deliveryMethod === "delivery"
                              ? "text-primary-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Truck className="h-4 w-4" />
                          Delivery
                        </button>
                      )}

                      {/* The switch track */}
                      {deliveryEnabled && pickupEnabled && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={deliveryMethod === "pickup"}
                          onClick={() => {
                            setDeliveryMethod((prev) => {
                              const selected =
                                prev === "delivery" ? "pickup" : "delivery";
                              setValue("deliveryMethod", selected);
                              return selected;
                            });
                          }}
                          className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            deliveryMethod === "pickup"
                              ? "bg-primary-500"
                              : "bg-primary-500"
                          }`}
                          style={{
                            background:
                              deliveryMethod === "pickup"
                                ? "var(--color-primary-500, #6366f1)"
                                : "var(--color-primary-500, #6366f1)",
                          }}
                        >
                          {/* Thumb */}
                          <span
                            className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                              deliveryMethod === "pickup"
                                ? "translate-x-7"
                                : "translate-x-0"
                            }`}
                          >
                            {deliveryMethod === "pickup" ? (
                              <Package className="h-3 w-3 text-primary-500" />
                            ) : (
                              <Truck className="h-3 w-3 text-primary-500" />
                            )}
                          </span>
                        </button>
                      )}
                      {/* Label: Pickup */}
                      {pickupEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryMethod("pickup");
                            setValue("deliveryMethod", "pickup");
                          }}
                          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                            deliveryMethod === "pickup"
                              ? "text-primary-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Package className="h-4 w-4" />
                          Pickup
                        </button>
                      )}
                    </div>

                    {/* Active method pill / description */}
                    <div
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
                        deliveryMethod === "delivery"
                          ? "bg-primary-50/60 border-primary-300 text-primary-700"
                          : "bg-amber-50/60 border-amber-300 text-amber-700"
                      }`}
                    >
                      {deliveryMethod === "delivery" ? (
                        <>
                          <Truck className="h-4 w-4 flex-shrink-0" />
                          <span>
                            Your order will be delivered to your address.
                          </span>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 flex-shrink-0" />
                          <span>
                            You'll pick up your order from a store near you.
                          </span>
                        </>
                      )}
                    </div>

                    {/* ── Cascading Dropdowns ─────────────────────────────────── */}
                    {deliveryLocations.length <= 6 ? (
                      <div className="grid md:grid-cols-2 gap-3 pt-1">
                        {/* {locationsForCity.length === 0 ? (
                            <div className="rounded-xl border border-border bg-surface-secondary p-4 text-sm text-muted-foreground">
                              No {deliveryMethod} locations available for{" "}
                              <strong>{selectedCity}</strong>.
                            </div>
                          ) : ( */}
                        {deliveryLocations.map((location) => (
                          <button
                            key={location._id}
                            type="button"
                            onClick={() => {
                              setSelectedDeliveryLocationId(location._id);
                              setSelectedDeliveryLocation(location);
                            }}
                            className={`flex flex-col gap-2 w-full rounded-2xl border p-4 text-left transition ${
                              selectedDeliveryLocationId === location._id
                                ? "border-primary-500 bg-primary-50/10 ring-1 ring-primary-400"
                                : "border-border bg-surface hover:bg-surface-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm font-semibold text-foreground">
                                  {location.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {[
                                    location.city,
                                    location.state,
                                    location.country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                              </div>
                              <span className="text-sm font-black text-primary-500 whitespace-nowrap">
                                {formatCurrency(location.price)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                              <span>
                                {location.estimatedDays || "No estimate"}
                              </span>
                              {location.address && (
                                <span>· {location.address}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {deliveryMethod === "delivery"
                            ? "Delivery Location"
                            : "Pickup Location"}
                        </div>

                        {/* Country */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Country
                          </label>
                          <div className="relative">
                            <select
                              value={selectedCountry}
                              onChange={(e) => {
                                setSelectedCountry(e.target.value);
                                setSelectedState("");
                                setSelectedCity("");
                                setSelectedDeliveryLocationId("");
                              }}
                              className={selectClass}
                              disabled={countries.length === 0}
                            >
                              <option value=""> --Select Country -- </option>
                              {/* <option value={countries[0]}>{countries[0]}</option> */}
                              {countries.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ▾
                            </span>
                          </div>
                        </div>

                        {/* State */}
                        <div className="space-y-1">
                          <label
                            className={`text-xs font-medium transition-colors ${
                              selectedCountry
                                ? "text-muted-foreground"
                                : "text-muted-foreground/40"
                            }`}
                          >
                            State / Region
                          </label>
                          <div className="relative">
                            <select
                              value={selectedState}
                              onChange={(e) => {
                                setSelectedState(e.target.value);
                                setSelectedCity("");
                                setSelectedDeliveryLocationId("");
                                setValue(
                                  "shippingAddress.state",
                                  e.target.value,
                                );
                              }}
                              className={selectClass}
                              disabled={!selectedCountry || states.length === 0}
                            >
                              <option value="">— Select state —</option>
                              {states.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ▾
                            </span>
                          </div>
                        </div>

                        {/* City */}
                        {cities.length > 0 && (
                          <div className="space-y-1">
                            <label
                              className={`text-xs font-medium transition-colors ${
                                selectedState
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/40"
                              }`}
                            >
                              City
                            </label>
                            <div className="relative">
                              <select
                                value={selectedCity}
                                onChange={(e) => {
                                  setSelectedCity(e.target.value);
                                  setSelectedDeliveryLocationId("");
                                  setValue(
                                    "shippingAddress.city",
                                    e.target.value,
                                  );
                                }}
                                className={selectClass}
                                disabled={!selectedState || cities.length === 0}
                              >
                                <option value="">— Select city —</option>
                                {cities.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ▾
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Location cards within the chosen city */}
                      </div>
                    )}
                    {deliveryMethod === "delivery" && (
                      <Input
                        label="Detailed Address"
                        type="text"
                        placeholder="House number, street, landmark, etc."
                        error={errors.shippingAddress?.street?.message}
                        {...register("shippingAddress.street")}
                      />
                    )}
                  </div>
                )}
                {/* Payment & Submit */}
                <div className="pt-6 border-t border-border/80 space-y-4">
                  <>
                    <div className="flex items-center gap-2">
                      {checkoutMethod.acceptOnlinePayment && (
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full py-4 uppercase font-bold tracking-wider h-14"
                          isLoading={isLoading}
                          leftIcon={<CreditCard className="h-5 w-5" />}
                        >
                          Pay Now {formatCurrency(totalAmount)}
                        </Button>
                      )}
                      {checkoutMethod.acceptCashOnDelivery && (
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full py-4 uppercase font-bold tracking-wider h-14"
                          isLoading={isLoading}
                          leftIcon={<CreditCard className="h-5 w-5" />}
                        >
                          Pay on Delivery {formatCurrency(totalAmount)}
                        </Button>
                      )}
                    </div>
                    {(true || checkoutMethod.acceptBankTransfer) && (
                      <Button
                        type="button"
                        variant="primary"
                        className="w-full py-4 uppercase font-bold tracking-wider h-14"
                        onClick={() => {
                          setShowBankModal(true);
                        }}
                        leftIcon={<BanknoteArrowDown className="h-5 w-5" />}
                      >
                        Pay via Bank Transfer {formatCurrency(totalAmount)}
                      </Button>
                    )}
                    {/* <div className="flex items-start gap-3 p-3 bg-surface-secondary border border-border rounded-xl text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                      <span>
                        Your payment will be secured and processed via our
                        secure payment gateway. Your financial data is encrypted
                        and completely private.
                      </span>
                    </div> */}
                    {checkoutMethod.acceptWhatsappOrder && (
                      <Button
                        type="button"
                        variant="green"
                        className="w-full py-4 uppercase font-bold tracking-wider h-14"
                        onClick={() => {}}
                        leftIcon={
                          <SocialIcon
                            network="whatsapp"
                            fgColor="green"
                            bgColor="white"
                            className="h-5 w-5"
                            style={{ height: 32, width: 32 }}
                          />
                        }
                      >
                        Send Order to WhatsApp
                      </Button>
                    )}
                  </>
                  {checkoutMethod.acceptCashOnDelivery && (
                    <>
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-4 uppercase font-bold tracking-wider h-14"
                        isLoading={isLoading}
                        leftIcon={<CreditCard className="h-5 w-5" />}
                      >
                        Pay Now {formatCurrency(totalAmount)}
                      </Button>
                      {/* <div className="flex items-start gap-3 p-3 bg-surface-secondary border border-border rounded-xl text-xs text-muted-foreground">
                        <Shield className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                        <span>
                          Your payment will be secured and processed via our
                          secure payment gateway. Your financial data is
                          encrypted and completely private.
                        </span>
                      </div> */}
                    </>
                  )}
                </div>
              </form>
            </Card>
          </div>

          {/* ── RHS – Order Summary ──────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6" glass>
              <h2 className="text-lg font-bold text-foreground border-b border-border pb-4 mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary-500" />
                Order Summary
              </h2>

              <div className="divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || ""}`}
                    className="flex gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="h-14 w-14 rounded-lg overflow-hidden border bg-white flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-4 w-4 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-foreground truncate">
                        {item.name}
                      </h4>
                      {item.variantLabel && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {item.variantLabel}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
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
                <span
                  className={`text-[10px] ${
                    couponResponse.status === "error"
                      ? "text-red-500"
                      : "text-green-500"
                  } mt-1.5 block`}
                >
                  {couponResponse.message}
                </span>
              </div>

              {/* Totals */}
              <div className="pt-6 border-t border-border mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee </span>
                  <span>
                    {selectedDeliveryLocation?.price === 0
                      ? "Free"
                      : formatCurrency(selectedDeliveryLocation?.price || 0)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success-500 font-medium">
                    <span>Coupon Discount</span>
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
        <BankTransferModal
          open={showBankModal}
          onClose={() => setShowBankModal(false)}
          data={getValues()}
          total={totalAmount}
          onCompleted={(orderId: string) => {
            dispatch(clearCart());
            router.push(`/checkout/success?ref=${encodeURIComponent(orderId)}`);
          }}
        />
      </div>
    </>
  );
}

const PaymentVerificationModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  status: "pending" | "paid" | "failed" | "timeout";
  message: string;
  reference: string;
}> = ({ isOpen, setIsOpen, status, message, reference }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-5 w-5 animate-spin text-primary-500" />;
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "timeout":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payment verification
            </p>
            <h2 className="mt-2 text-lg font-bold text-foreground">
              Verifying transaction
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-secondary"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-muted-foreground">
          <p>
            Reference:{" "}
            <span className="font-mono text-foreground">{reference}</span>
          </p>
          <p>{message}</p>
          {status === "pending" && (
            <div className="overflow-hidden rounded-full bg-surface-secondary h-2">
              <div className="h-2 w-3/4 animate-pulse rounded-full bg-primary-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
