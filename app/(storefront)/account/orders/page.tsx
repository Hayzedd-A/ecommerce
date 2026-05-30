"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/formatters";
// import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Badge, ExternalLink, Package } from "lucide-react";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const response = await apiClient.get("/orders/me");
      return response.data.orders;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Order History</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">No orders yet</h2>
        <p className="text-muted-foreground mt-1 mb-6">
          When you place an order, it will appear here.
        </p>
        <Link
          href="/products"
          className="text-primary-600 font-medium hover:underline"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Order History</h1>

      <div className="space-y-4">
        {data.map((order: any) => (
          <div
            key={order._id}
            className="border border-border rounded-xl p-4 md:p-6 bg-surface"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order{" "}
                  <span className="font-bold text-foreground">
                    #{order.orderNumber}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  color={
                    order.status === "Completed"
                      ? "success"
                      : order.status === "Cancelled"
                        ? "danger"
                        : order.status === "Processing"
                          ? "warning"
                          : "default"
                  }
                >
                  {order.status}
                </Badge>
                <span className="font-bold text-foreground">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item: any, i: number) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-surface bg-surface-secondary overflow-hidden"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="h-10 w-10 rounded-full border-2 border-surface bg-surface-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>

              <Link
                href={`/account/orders/${order._id}`}
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
              >
                View Details
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
