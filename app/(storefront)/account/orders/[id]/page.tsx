"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/formatters";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export default function OrderDetailPage() {
  const pathname = usePathname();
  const id = pathname?.split("/").pop();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/orders/${id}`);
      return res.data.order;
    },
    enabled: !!id,
  });

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const order: any = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge>{order.status}</Badge>
          <div className="text-lg font-bold">{formatCurrency(order.total)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-medium">Items</h2>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item._id || item.productId} className="flex items-center gap-4 border p-3 rounded-lg">
                <div className="h-16 w-16 bg-surface-secondary overflow-hidden rounded">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                </div>
                <div className="font-medium">{formatCurrency(item.price)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium">Shipping</h3>
            <div className="text-sm text-muted-foreground mt-2">
              <div>{order.shippingAddress.fullName}</div>
              <div>{order.shippingAddress.street}</div>
              <div>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
              <div>{order.shippingAddress.country}</div>
            </div>
          </div>

          <div className="border p-4 rounded-lg">
            <h3 className="font-medium">Summary</h3>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span>{formatCurrency(order.deliveryFee)}</span></div>
              <div className="flex justify-between font-medium"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>

          <div className="border p-4 rounded-lg">
            <h3 className="font-medium">Payment</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              {order.payment ? (
                <div>
                  <div>Status: {order.payment.status}</div>
                  <div>Provider: {order.payment.provider}</div>
                  <div>Amount: {formatCurrency(order.payment.amount)}</div>
                </div>
              ) : (
                <div>Payment not found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
