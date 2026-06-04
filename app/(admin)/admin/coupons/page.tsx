"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Trash, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

export default function AdminCouponsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { formatMoney } = useStoreSettings();

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/admin/coupons", {
        params: { page, limit: 20, search },
      });
      setItems(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, search]);

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await apiClient.put(`/admin/coupons/${id}`, {
        isActive: !active,
      });
      setItems(items.map((it) => (it._id === id ? res.data.data : it)));
      toast.success("Coupon updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
      setItems(items.filter((it) => it._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Coupon deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Coupons
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage promotional codes and usage.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/admin/coupons/new" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </Link>
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <Card className="p-6" glass>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type / Value</th>
                <th className="px-4 py-3">Min Purchase</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="space-y-3">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading coupons...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No coupons found.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className="bg-surface rounded-3xl shadow-sm">
                    <td className="px-4 py-4 font-semibold text-foreground max-w-[220px] truncate">
                      {c.code}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {c.type} /{" "}
                      {c.type === "percentage" ? `${c.value}%` : `₦${c.value}`}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {c.minPurchase ? `${formatMoney(c.minPurchase)}` : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {c.usedCount || 0}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {c.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Link
                        href={`/admin/coupons/${c._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary"
                      >
                        Edit
                      </Link>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                        onClick={() => toggleActive(c._id, c.isActive)}
                      >
                        {c.isActive ? (
                          <ToggleLeft className="h-4 w-4" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        )}
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        disabled={(c.usedCount || 0) > 0}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${(c.usedCount || 0) > 0 ? "opacity-50 cursor-not-allowed" : "border border-error-300 bg-error-50 text-error-700 hover:bg-error-100"}`}
                        onClick={() => handleDelete(c._id)}
                      >
                        <Trash className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} coupons</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">
              Page {page}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={items.length < 20}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
