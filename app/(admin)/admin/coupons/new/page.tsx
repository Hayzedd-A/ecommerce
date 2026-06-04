"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { Checkbox } from "@mui/material";

export default function AdminNewCouponPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState(0);
  const [minPurchase, setMinPurchase] = useState<number | "">("");
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/coupons", {
        code,
        type,
        value,
        minPurchase: minPurchase === "" ? undefined : Number(minPurchase),
        maxUses: maxUses === "" ? undefined : Number(maxUses),
        expiresAt: expiresAt || undefined,
        startsAt: startsAt || undefined,
        isActive,
      });
      toast.success("Coupon created");
      router.push("/admin/coupons");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">New Coupon</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a promotional coupon code.
        </p>
      </div>

      <Card className="p-6" glass>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SAVE10"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <Input
              label="Value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Purchase (optional)"
              type="number"
              isMoney
              value={minPurchase}
              onChange={(e) =>
                setMinPurchase(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
            <Input
              label="Max Uses (optional)"
              type="number"
              value={maxUses}
              onChange={(e) =>
                setMaxUses(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts At (optional)"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <Input
              label="Expires At (optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" className="text-xs text-muted-foreground">
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push("/admin/coupons")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Coupon
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
