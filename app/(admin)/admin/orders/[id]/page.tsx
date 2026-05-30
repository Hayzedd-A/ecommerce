"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";

const statusOptions = [
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Paid", value: "paid" },
  { label: "Processing", value: "processing" },
  { label: "Ready for Pickup", value: "ready_for_pickup" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await apiClient.get(`/admin/orders/${orderId}`);
        setOrder(response.data.data);
        setStatus(response.data.data.status);
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
      await apiClient.put(`/admin/orders/${orderId}`, { status, notes: order.notes });
      toast.success("Order status updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">Loading order details...</div>;
  }

  if (!order) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">Order not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Order total</p>
          <p className="font-semibold text-foreground">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="p-6" glass>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Customer</h2>
              <p className="text-sm text-muted-foreground mt-1">{order.shippingAddress?.fullName || "Guest"}</p>
              <p className="text-sm text-muted-foreground">{order.guestEmail || order.shippingAddress?.phone}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">Shipping Address</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.country} {order.shippingAddress.zipCode}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">Items</h2>
              <div className="mt-3 space-y-3">
                {order.items.map((item: any) => (
                  <div key={`${item.productId}-${item.variantId || item.name}`} className="rounded-3xl border border-border bg-surface p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6" glass>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Order management</h2>
              <p className="text-sm text-muted-foreground mt-1">Update order status and notes.</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order notes</label>
                <textarea
                  value={order.notes || ""}
                  onChange={(event) => setOrder({ ...order, notes: event.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                />
              </div>
              <Button isLoading={isSaving} onClick={handleSave}>Save changes</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
