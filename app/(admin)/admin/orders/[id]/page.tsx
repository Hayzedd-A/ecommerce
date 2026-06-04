"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderStatus,
  formatPhone,
} from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import type { OrderStatus } from "@/lib/types";
import { ArrowBigLeft } from "lucide-react";

const statusOptions: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Ready for Pickup", value: "ready_for_pickup" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

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
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!order) return;
    setIsSaving(true);
    try {
      await apiClient.put(`/admin/orders/${orderId}`, { status, notes });
      setOrder({ ...order, status, notes });
      toast.success("Order updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setIsSaving(false);
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

  const shippingLines = buildAddressLines(order.shippingAddress);
  const deliveryLocation = order.deliveryLocation;
  const payment = order.payment;
  const customerEmail =
    order.guestEmail || order.shippingAddress?.email || "Not provided";
  const customerPhone =
    order.guestPhone || order.shippingAddress?.phone || "Not provided";
  const orderNotes = notes ?? order.notes ?? "";

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
            {formatCurrency(order.total)}
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
                      {formatCurrency(order.deliveryFee || 0)}
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
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} each
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
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span>Discount</span>
                  <span>{formatCurrency(order.discount || 0)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(order.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6" glass>
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Payment details
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Track payment reference, provider, and status.
                </p>
              </div>

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
                  <span className="text-foreground capitalize">
                    {payment?.status || "pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount paid</span>
                  <span className="text-foreground">
                    {formatCurrency(payment?.amount || order.total)}
                  </span>
                </div>
                {payment?.paidAt ? (
                  <div className="flex justify-between">
                    <span>Paid at</span>
                    <span>{formatDateTime(payment.paidAt)}</span>
                  </div>
                ) : null}
                {payment?.evidenceFile ? (
                  <div className="flex justify-between gap-4">
                    <span>Receipt</span>
                    <a
                      href={payment.evidenceFile}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary-500 hover:text-primary-600"
                    >
                      View receipt
                    </a>
                  </div>
                ) : null}
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
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as OrderStatus)
                    }
                    className="w-full rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                <Button isLoading={isSaving} onClick={handleSave}>
                  Save changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
