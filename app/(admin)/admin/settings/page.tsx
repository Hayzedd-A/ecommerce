"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiClient.get("/settings");
        setSettings(response.data.data);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load store settings");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings((current: any) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await apiClient.put("/admin/settings", settings);
      toast.success("Settings updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">Settings could not be loaded.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Store Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update shop details, contact info, and delivery preferences.</p>
      </div>

      <Card className="p-6" glass>
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Input label="Store Name" value={settings.storeName || ""} onChange={(event) => handleChange("storeName", event.target.value)} />
            <Input label="Store Email" type="email" value={settings.email || ""} onChange={(event) => handleChange("email", event.target.value)} />
            <Input label="Phone" value={settings.phone || ""} onChange={(event) => handleChange("phone", event.target.value)} />
            <Input label="Currency Code" value={settings.currency || "NGN"} onChange={(event) => handleChange("currency", event.target.value)} />
            <Input label="Currency Symbol" value={settings.currencySymbol || "₦"} onChange={(event) => handleChange("currencySymbol", event.target.value)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Input label="Address" value={settings.address || ""} onChange={(event) => handleChange("address", event.target.value)} />
            <Input label="Pickup Address" value={settings.pickupAddress || ""} onChange={(event) => handleChange("pickupAddress", event.target.value)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup enabled</label>
              <input
                type="checkbox"
                checked={settings.pickupEnabled || false}
                onChange={(event) => handleChange("pickupEnabled", event.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-500"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store description</label>
            <textarea
              value={settings.description || ""}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button isLoading={isSaving} onClick={handleSave}>Save settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
