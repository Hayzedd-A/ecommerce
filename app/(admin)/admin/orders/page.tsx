"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import { formatDate } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import {
  orderStatusColors,
  orderStatusLabels,
  orderStatusOptions,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/utils/helpers";
import { IOrderObject, OrderStatus, OrderStatusEnum } from "@/lib/types";
import { useAppDispatch } from "@/lib/store/hooks";
import { markAdminNotificationsAsRead } from "@/lib/store/slices/notificationSlice";

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState<IOrderObject[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const { formatMoney } = useStoreSettings();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/orders", {
        params: { page, limit: 20, status: statusFilter },
      });
      setOrders(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Mark order notifications as read
    dispatch(markAdminNotificationsAsRead("order_new"));
  }, [page, statusFilter, refetch, dispatch]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setIsUpdating(true);
    try {
      const response = await apiClient.put(`/admin/orders/${orderId}`, {
        status,
      });
      toast.success("Order status updated successfully");
      setRefetch(!refetch);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load orders");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review order status, totals, and customer order history.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as OrderStatus)
            }
            className="rounded-lg border border-border bg-input-bg px-4 py-2 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
          >
            <option value="all">All</option>
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => fetchOrders()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-6" glass>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="bg-surface rounded-3xl shadow-sm"
                  >
                    <td className="px-4 py-4 font-mono text-sm text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {order.shippingAddress?.fullName || "Guest"} <br />
                      <span className="text-xs font-mono line-clamp-2">
                        {order.shippingAddress?.street}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {formatMoney(order.total)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground capitalize">
                      {order.deliveryLocation?.type === "pickup"
                        ? "Pick Up"
                        : "Delivery"}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm text-muted-foreground capitalize `}
                    >
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${
                          paymentStatusColors[order.payment?.status] ||
                          "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {paymentStatusLabels[order.payment?.status] ||
                          order.payment?.status}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-sm text-muted-foreground capitalize `}
                    >
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${
                          orderStatusColors[order.status] ||
                          "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {orderStatusLabels[order.status] ||
                          order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right flex gap-3 items-center">
                      <select
                        value={order.status}
                        onChange={(event) =>
                          updateStatus(
                            order._id,
                            event.target.value as OrderStatus,
                          )
                        }
                        className="w-32 text-sm rounded-lg border border-border bg-input-bg px-2 py-1 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
                      >
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-xs font-semibold text-primary-500 hover:text-primary-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} orders</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">
              Page {page}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={orders.length < 20}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
