"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminCouponDetailPage() {
  const params = useParams();
  const id = (params as any)?.id;
  const router = useRouter();

  const [coupon, setCoupon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/admin/coupons/${id}`);
      setCoupon(res.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load coupon");
    } finally { setIsLoading(false); }
  };

  const loadOrders = async () => {
    try {
      const res = await apiClient.get(`/admin/coupons/${id}/orders`, { params: { page: 1, limit: 20 } });
      setOrders(res.data.data.items || []);
    } catch (error: any) {
      // ignore silently for now
    }
  };

  useEffect(() => { if (id) { load(); loadOrders(); } }, [id]);

  const handleSave = async () => {
    if (!coupon) return;
    setIsSaving(true);
    try {
      const { _id, ...payload } = coupon;
      const res = await apiClient.put(`/admin/coupons/${id}`, payload);
      setCoupon(res.data.data);
      toast.success("Coupon updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update coupon");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!coupon) return;
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
      toast.success("Coupon deleted");
      router.push('/admin/coupons');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete coupon");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!coupon) return <div className="text-sm text-muted-foreground">Coupon not found.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Coupon: {coupon.code}</h1>
        <p className="text-sm text-muted-foreground mt-1">Edit coupon details and view orders that used it.</p>
      </div>

      <Card className="p-6" glass>
        <div className="space-y-4">
          <Input label="Code" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Type</label>
              <select value={coupon.type} onChange={(e) => setCoupon({ ...coupon, type: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <Input label="Value" type="number" value={coupon.value} onChange={(e) => setCoupon({ ...coupon, value: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum Purchase" type="number" value={coupon.minPurchase || ''} onChange={(e) => setCoupon({ ...coupon, minPurchase: e.target.value === '' ? undefined : Number(e.target.value) })} />
            <Input label="Max Uses" type="number" value={coupon.maxUses || ''} onChange={(e) => setCoupon({ ...coupon, maxUses: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Starts At</label>
              <input type="datetime-local" value={coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0,16) : ''} onChange={(e) => setCoupon({ ...coupon, startsAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full rounded-lg border border-border px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Expires At</label>
              <input type="datetime-local" value={coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0,16) : ''} onChange={(e) => setCoupon({ ...coupon, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full rounded-lg border border-border px-3 py-2" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm">Active</label>
            <input type="checkbox" checked={!!coupon.isActive} onChange={(e) => setCoupon({ ...coupon, isActive: e.target.checked })} />
            <span className="text-sm text-muted-foreground">Used: {coupon.usedCount || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => router.push('/admin/coupons')}>Back</Button>
            <Button onClick={handleSave} isLoading={isSaving}>Save</Button>
            <Button onClick={handleDelete} variant="outline" disabled={(coupon.usedCount || 0) > 0}>Delete</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6" glass>
        <h3 className="text-lg font-semibold">Orders using this coupon</h3>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">No orders found.</div>
          ) : (
            orders.map((o) => (
              <div key={o._id} className="flex items-center justify-between border rounded-xl p-3">
                <div>
                  <div className="font-semibold">{o.orderNumber}</div>
                  <div className="text-xs text-muted-foreground">Total: ₦{o.total} — {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-muted-foreground">Status: {o.status}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
