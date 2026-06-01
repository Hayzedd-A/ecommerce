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

  const handlePaymentChange = (provider: string, field: string, value: any) => {
    setSettings((current: any) => ({
      ...current,
      paymentSettings: {
        ...current.paymentSettings,
        [provider]: {
          ...current.paymentSettings?.[provider],
          [field]: value,
        },
      },
    }));
  };

  const handleActiveProviderChange = (value: string) => {
    setSettings((current: any) => ({
      ...current,
      paymentSettings: {
        ...current.paymentSettings,
        activeProvider: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">
        Settings could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">
          Store Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update shop details, contact info, and delivery preferences.
        </p>
      </div>

      <Card className="p-6" glass>
        <div className="grid gap-6">
          <h2 className="text-xl font-bold border-b pb-2">General Info</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Input
              label="Store Name"
              value={settings.storeName || ""}
              onChange={(event) => handleChange("storeName", event.target.value)}
            />
            <Input
              label="Store Email"
              type="email"
              value={settings.email || ""}
              onChange={(event) => handleChange("email", event.target.value)}
            />
            <Input
              label="Phone"
              value={settings.phone || ""}
              onChange={(event) => handleChange("phone", event.target.value)}
            />
            <Input
              label="Currency Code"
              value={settings.currency || "NGN"}
              onChange={(event) => handleChange("currency", event.target.value)}
            />
            <Input
              label="Currency Symbol"
              value={settings.currencySymbol || "₦"}
              onChange={(event) =>
                handleChange("currencySymbol", event.target.value)
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Input
              label="Address"
              value={settings.address || ""}
              onChange={(event) => handleChange("address", event.target.value)}
            />
            <Input
              label="Pickup Address"
              value={settings.pickupAddress || ""}
              onChange={(event) =>
                handleChange("pickupAddress", event.target.value)
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pickup enabled
              </label>
              <input
                type="checkbox"
                checked={settings.pickupEnabled || false}
                onChange={(event) =>
                  handleChange("pickupEnabled", event.target.checked)
                }
                className="h-4 w-4 rounded border-border text-primary-500"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Store description
            </label>
            <textarea
              value={settings.description || ""}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              rows={4}
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6" glass>
        <div className="grid gap-6">
          <h2 className="text-xl font-bold border-b pb-2">Payment Settings</h2>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Payment Provider
            </label>
            <select
              value={settings.paymentSettings?.activeProvider || "monnify"}
              onChange={(e) => handleActiveProviderChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring"
            >
              <option value="monnify">Monnify</option>
              <option value="paystack">Paystack</option>
            </select>
          </div>

          <div className="grid gap-8 mt-4">
            {/* Monnify Settings */}
            <div className="p-4 border border-border rounded-xl space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                Monnify Configuration
                {settings.paymentSettings?.activeProvider === "monnify" && (
                  <span className="text-[10px] bg-success-500/20 text-success-500 px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Monnify API Key"
                  value={settings.paymentSettings?.monnify?.apiKey || ""}
                  onChange={(e) =>
                    handlePaymentChange("monnify", "apiKey", e.target.value)
                  }
                />
                <Input
                  label="Monnify Secret Key"
                  type="password"
                  value={settings.paymentSettings?.monnify?.secretKey || ""}
                  onChange={(e) =>
                    handlePaymentChange("monnify", "secretKey", e.target.value)
                  }
                />
                <Input
                  label="Contract Code"
                  value={settings.paymentSettings?.monnify?.contractCode || ""}
                  onChange={(e) =>
                    handlePaymentChange(
                      "monnify",
                      "contractCode",
                      e.target.value,
                    )
                  }
                />
                <Input
                  label="Base URL"
                  placeholder="https://sandbox.monnify.com"
                  value={settings.paymentSettings?.monnify?.baseUrl || ""}
                  onChange={(e) =>
                    handlePaymentChange("monnify", "baseUrl", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Paystack Settings */}
            <div className="p-4 border border-border rounded-xl space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                Paystack Configuration
                {settings.paymentSettings?.activeProvider === "paystack" && (
                  <span className="text-[10px] bg-success-500/20 text-success-500 px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input
                  label="Paystack Public Key"
                  value={settings.paymentSettings?.paystack?.publicKey || ""}
                  onChange={(e) =>
                    handlePaymentChange("paystack", "publicKey", e.target.value)
                  }
                />
                <Input
                  label="Paystack Secret Key"
                  type="password"
                  value={settings.paymentSettings?.paystack?.secretKey || ""}
                  onChange={(e) =>
                    handlePaymentChange("paystack", "secretKey", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button isLoading={isSaving} onClick={handleSave} className="px-12">
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
