"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import {
  formatDate,
  formatDateTime,
  formatOrderStatus,
  formatPhone,
} from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import type { ICoupon, OrderStatus } from "@/lib/types";
import {
  ArrowBigLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  X,
  XCircle,
} from "lucide-react";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import { orderStatusOptions } from "@/lib/utils/helpers";

function buildAddressLines(address: any) {
  const lines: string[] = [];
  if (address?.street) lines.push(address.street);
  if (address?.city || address?.state)
    lines.push([address?.city, address?.state].filter(Boolean).join(", "));
  if (address?.country || address?.zipCode)
    lines.push([address?.country, address?.zipCode].filter(Boolean).join(" "));
  return lines;
}

function capitalize(value: string | undefined) {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatMoney } = useStoreSettings();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<OrderStatus>("awaiting_confirmation");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New states for payment verification
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await apiClient.get(`/admin/orders/${orderId}`);
        const orderData = response.data.data;
        setOrder(orderData);
        setStatus(orderData.status || "pending");
        setNotes(orderData.notes || "");
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load order");
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) loadOrder();
  }, [orderId]);

  const handleSave = async (quickStatus?: OrderStatus) => {
    if (!order) return;
    setIsSaving(true);
    try {
      const payload: any = { notes, status };
      if (quickStatus) {
        setStatus(quickStatus);
        payload.status = quickStatus;
      }
      await apiClient.put(`/admin/orders/${orderId}`, payload);
      setOrder({ ...order, status, notes });
      toast.success("Order updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPayment = async (action: "verified" | "declined") => {
    if (!order?.payment?._id) return;
    const isActionVerified = action === "verified";
    if (isActionVerified) setIsVerifying(true);
    else setIsDeclining(true);

    try {
      const res = await apiClient.post(
        `/admin/payments/${order.payment._id}/verify`,
        {
          action,
          notes: `Handled by admin at ${new Date().toLocaleString()}`,
        },
      );
      if (res.data.success) {
        toast.success(`Payment ${action} successfully`);
        // Refresh local state
        const updatedOrder = { ...order };
        updatedOrder.payment = res.data.payment;
        if (isActionVerified && order.status === "pending") {
          updatedOrder.status = "processing";
          setStatus("processing");
        }
        setOrder(updatedOrder);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || `Failed to ${action} payment`,
      );
    } finally {
      setIsVerifying(false);
      setIsDeclining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">
        Order not found.
      </div>
    );
  }

  const renderCouponType = (coupon: ICoupon) => {
    if (coupon.type === "fixed") {
      return `-${formatMoney(coupon.value)}`;
    } else if (coupon.type === "percentage") {
      return `-${coupon.value}%`;
    }
    return "";
  };

  const shippingLines = buildAddressLines(order.shippingAddress);
  const deliveryLocation = order.deliveryLocation;
  const payment = order.payment;
  const customerEmail =
    order.guestEmail || order.shippingAddress?.email || "Not provided";
  const customerPhone =
    order.guestPhone || order.shippingAddress?.phone || "Not provided";
  const orderNotes = notes ?? order.notes ?? "";

  const renderPaymentStatus = () => {
    if (["pay_on_delivery", "bank_transfer"].includes(payment.provider)) {
      if (payment?.adminVerified) {
        return (
          <div className="flex items-center gap-1.5 text-success-500 font-bold">
            <CheckCircle className="h-4 w-4" />
            <span>ADMIN APPROVED</span>
          </div>
        );
      }
      if (payment?.adminAction === "declined") {
        return (
          <div className="flex items-center gap-1.5 text-error-500 font-bold">
            <XCircle className="h-4 w-4" />
            <span>ADMIN DECLINED</span>
          </div>
        );
      } else
        return (
          <div className="flex items-center gap-1.5 text-warning-500 font-bold">
            <Clock className="h-4 w-4" />
            <span>AWAITING APPROVAL</span>
          </div>
        );
    }
    if (payment.webhookVerified || payment.status === "paid") {
      return (
        <div className="flex items-center gap-1.5 text-success-500 font-bold">
          <CheckCircle className="h-4 w-4" />
          <span>PROVIDER APPROVED</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-warning-500 font-bold">
        <Clock className="h-4 w-4" />
        <span>AWAITING VERIFICATION</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* back button */}
      <Button
        onClick={() => router.back()}
        variant="secondary"
        className="flex items-center margin-0 gap-2"
      >
        <ArrowBigLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Order details
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            {order.orderNumber}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-foreground">
              {formatOrderStatus(order.status)}
            </span>
            <span className="text-sm text-muted-foreground">
              Placed {formatDateTime(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 text-right shadow-sm">
          <p className="text-sm text-muted-foreground">Order total</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatMoney(order.total)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
            {capitalize(order.deliveryMethod)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6" glass>
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Customer
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {order.shippingAddress?.fullName || "Guest"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customerEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customerPhone !== "Not provided"
                      ? formatPhone(customerPhone)
                      : customerPhone}
                  </p>
                  {order.isGuest && (
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Guest order
                    </p>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Delivery
                  </h2>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">
                        Method:
                      </span>{" "}
                      {capitalize(order.deliveryMethod)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">
                        Location:
                      </span>{" "}
                      {deliveryLocation?.name || "Not set"}
                    </div>
                    {deliveryLocation?.address ? (
                      <div>{deliveryLocation.address}</div>
                    ) : null}
                    <div>
                      <span className="font-semibold text-foreground">
                        Price:
                      </span>{" "}
                      {formatMoney(order.deliveryFee || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Shipping address
                </h2>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {shippingLines.length > 0 ? (
                    shippingLines.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))
                  ) : (
                    <p>Address information not available.</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" glass>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Ordered items
                </h2>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} product
                  {order.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div
                    key={`${item._id || item.productId}-${item.variantId || item.name}`}
                    className="rounded-3xl border border-border bg-surface p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <div className="h-16 w-16 overflow-hidden rounded-3xl bg-muted">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : null}
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(item.price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6" glass>
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-foreground">
                Order summary
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between border-b border-border pb-3">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span>
                    Discount <br />
                    {order.couponUsed && (
                      <span className="text-xs text-foreground">
                        (code: {order?.couponUsed})
                      </span>
                    )}
                  </span>
                  <span className="text-end">
                    {formatMoney(order.discount || 0)} <br />
                    {order.couponUsed && (
                      <span className="text-xs align-end text-foreground">
                        ({renderCouponType(order?.coupon)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span>Delivery fee</span>
                  <span>{formatMoney(order.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" glass>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Payment details
                  </h2>
                  {/* <p className="text-sm text-muted-foreground mt-1">
                    Track payment reference, provider, and status.
                  </p> */}
                </div>
                {renderPaymentStatus()}
              </div>

              <div className="space-y-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment provider</span>
                    <span className="text-foreground">
                      {payment?.provider || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference</span>
                    <span className="text-foreground">
                      {payment?.reference || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment status</span>
                    <span className="text-foreground capitalize font-bold">
                      {payment?.status || "pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount paid</span>
                    <span className="text-foreground font-bold">
                      {formatMoney(payment?.amount || order.total)}
                    </span>
                  </div>
                  {payment?.paidAt ? (
                    <div className="flex justify-between">
                      <span>Paid at</span>
                      <span>{formatDateTime(payment.paidAt)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  {payment?.evidenceFile && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary-500" />
                        <span className="text-sm font-bold text-foreground">
                          Payment Receipt
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowReceiptModal(true)}
                        className="h-9 px-4 rounded-xl flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  )}
                  {["pay_on_delivery", "bank_transfer"].includes(
                    payment.provider,
                  ) &&
                    (payment.adminAction === "pending" ||
                      !payment.adminAction) && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          className="bg-error-500/10 text-error-500 hover:bg-error-500/20 border-none rounded-xl"
                          isLoading={isDeclining}
                          disabled={isVerifying}
                          onClick={() => handleVerifyPayment("declined")}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          className="bg-success-600 hover:bg-success-700 text-white shadow-lg shadow-success-600/20 rounded-xl"
                          isLoading={isVerifying}
                          disabled={isDeclining}
                          onClick={() => handleVerifyPayment("verified")}
                        >
                          Approve Payment
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" glass>
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Order management
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Update order status and internal notes.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order status
                  </label>
                  <div className="flex gap-4">
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as OrderStatus)
                      }
                      className="w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                    >
                      {orderStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {status === "awaiting_confirmation" && (
                      <div className="flex gap-2">
                        <Button
                          color="success"
                          variant="primary"
                          disabled={isVerifying}
                          onClick={() => handleSave("processing")}
                        >
                          Confirm
                        </Button>
                        <Button
                          color="error"
                          variant="danger"
                          disabled={isDeclining}
                          onClick={() => handleSave("cancelled")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Order notes
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setOrder({ ...order, notes: event.target.value });
                    }}
                    rows={5}
                    className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                  />
                </div>
                <Button isLoading={isSaving} onClick={() => handleSave()}>
                  Save changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Dialog
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              overflow: "hidden",
              bgcolor: "var(--background)",
              backgroundImage: "none",
            },
          },
        }}
      >
        <div className="relative bg-background">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-xl font-black text-foreground">
              Payment Receipt
            </h3>
            <IconButton
              onClick={() => setShowReceiptModal(false)}
              className="bg-surface-secondary"
            >
              <X className="h-5 w-5" />
            </IconButton>
          </div>
          <DialogContent className="p-0 flex flex-col items-center justify-center min-h-[500px] bg-slate-100 dark:bg-slate-900">
            {payment?.evidenceFile ? (
              <div className="relative w-full h-full p-4">
                {payment.evidenceFile.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={payment.evidenceFile}
                    className="w-full h-[600px] rounded-xl border border-border shadow-xl"
                    title="Payment Evidence PDF"
                  />
                ) : (
                  <img
                    src={payment.evidenceFile}
                    alt="Payment Evidence"
                    className="max-w-full h-auto rounded-xl shadow-2xl mx-auto border border-border"
                  />
                )}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 opacity-20" />
                <p>No receipt file found.</p>
              </div>
            )}
          </DialogContent>
          <div className="p-6 border-t border-border flex justify-between items-center bg-surface">
            <div className="text-xs text-muted-foreground">
              Reference:{" "}
              <span className="font-mono font-bold text-foreground">
                {payment?.reference}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(payment?.evidenceFile, "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Original
              </Button>
              <Button size="sm" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
