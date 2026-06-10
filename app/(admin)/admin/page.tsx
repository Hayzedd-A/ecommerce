import React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

import dbConnect from "@/lib/db/connect";
import Order from "@/lib/db/models/Order";
import Product from "@/lib/db/models/Product";
import User from "@/lib/db/models/User";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/Card";
import getStoreSettings from "@/lib/settings.server";
import {
  orderStatusColors,
  orderStatusLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/utils/helpers";
import { IOrder, IOrderObject } from "@/lib/types";

async function getDashboardData() {
  try {
    await dbConnect();

    // Query for total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "draft" } } },
      {
        $lookup: {
          from: "payments",
          localField: "paymentId",
          foreignField: "_id",
          as: "payment",
        },
      },
      {
        $addFields: {
          payment: { $arrayElemAt: ["$payment", 0] },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const totalRevenue = revenueResult?.[0]?.total || 0;

    // Counts
    const ordersCount = await Order.countDocuments({
      status: { $ne: "draft" },
    });
    const customersCount = await User.countDocuments({
      role: "customer",
    }).lean();
    const lowStockCount = await Product.countDocuments({
      stock: { $lte: 5 },
    }).lean();

    // Recent orders
    const recentOrders = await Order.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "paymentId",
          foreignField: "_id",
          as: "payment",
        },
      },
      {
        $addFields: {
          payment: { $arrayElemAt: ["$payment", 0] },
        },
      },
      { $match: { status: { $ne: "draft" } } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
    ]);

    return {
      stats: { totalRevenue, ordersCount, customersCount, lowStockCount },
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    };
  } catch (error) {
    console.error("Dashboard fetching error:", error);
    return {
      stats: {},
      recentOrders: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const { stats, recentOrders } = await getDashboardData();
  const settings = await getStoreSettings();

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time statistics and administrative analytics
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="p-6 relative overflow-hidden" glass>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Sales
              </span>
              <h3 className="text-2xl font-black text-foreground">
                {formatCurrency(stats.totalRevenue, settings.currencySymbol)}
              </h3>
            </div>
            <div className="p-3 bg-success-50 text-success-600 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          {/* <div className="flex items-center gap-1 mt-4 text-xs font-bold text-success-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+12.5%</span>
            <span className="text-muted-foreground font-medium">
              from last month
            </span>
          </div> */}
        </Card>

        {/* Total Orders */}
        <Card className="p-6 relative overflow-hidden" glass>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Orders
              </span>
              <h3 className="text-2xl font-black text-foreground">
                {stats.ordersCount}
              </h3>
            </div>
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          {/* <div className="flex items-center gap-1 mt-4 text-xs font-bold text-success-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+8.2%</span>
            <span className="text-muted-foreground font-medium">
              from last week
            </span>
          </div> */}
        </Card>

        {/* Total Customers */}
        <Card className="p-6 relative overflow-hidden" glass>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Customers
              </span>
              <h3 className="text-2xl font-black text-foreground">
                {stats.customersCount}
              </h3>
            </div>
            <div className="p-3 bg-accent-50 text-accent-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          {/* <div className="flex items-center gap-1 mt-4 text-xs font-bold text-success-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+14.1%</span>
            <span className="text-muted-foreground font-medium">
              from last month
            </span>
          </div> */}
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-6 relative overflow-hidden" glass>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Low Stock items
              </span>
              <h3 className="text-2xl font-black text-foreground">
                {stats.lowStockCount}
              </h3>
            </div>
            <div className="p-3 bg-error-50 text-error-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          {/* <div className="flex items-center gap-1 mt-4 text-xs font-bold text-error-600">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>-2.4%</span>
            <span className="text-muted-foreground font-medium">
              reordered items
            </span>
          </div> */}
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="p-6 overflow-hidden" glass>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">
              List of the latest client orders placed in the system
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            <ClipboardList className="h-4 w-4" />
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 px-4">Customer</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Payment Status</th>
                <th className="pb-3 px-4">Order Status</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {recentOrders.map((order: IOrderObject) => (
                <tr
                  key={order._id}
                  className="hover:bg-surface-secondary/40 transition-colors"
                >
                  <td className="py-3.5 pr-4 font-mono font-bold text-xs text-foreground truncate max-w-[120px]">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[150px]">
                    {order.shippingAddress?.fullName}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {formatCurrency(order.total, settings.currencySymbol)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${paymentStatusColors[order.payment?.status] || "bg-slate-50 border-slate-200"}`}
                    >
                      {paymentStatusLabels[order.payment?.status] ||
                        order.payment?.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${orderStatusColors[order.status] || "bg-slate-50 border-slate-200"}`}
                    >
                      {orderStatusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="text-xs font-bold text-primary-500 hover:text-primary-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
