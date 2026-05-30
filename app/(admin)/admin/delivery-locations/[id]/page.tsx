"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminDeliveryLocationDetailsPage() {
  const params = useParams();
  const id = (params as any)?.id;
  const router = useRouter();

  const [location, setLocation] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [locationRes, suggestionRes] = await Promise.all([
          apiClient.get(`/admin/delivery-locations/${id}`),
          apiClient.get("/admin/delivery-locations", {
            params: { page: 1, limit: 200 },
          }),
        ]);
        setLocation(locationRes.data.data);
        setSuggestions(suggestionRes.data.data.items || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Unable to load delivery location",
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const countries = Array.from(
    new Set(suggestions.map((item) => item.country)),
  ).sort();
  const states = Array.from(
    new Set(
      suggestions
        .filter((item) => item.country === location?.country)
        .map((item) => item.state),
    ),
  ).sort();

  const handleSave = async () => {
    if (!location) return;
    setIsSaving(true);
    try {
      const { _id, ...payload } = location;
      await apiClient.put(`/admin/delivery-locations/${id}`, payload);
      toast.success("Delivery location updated");
      router.back();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update delivery location",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this delivery location?")) return;
    try {
      await apiClient.delete(`/admin/delivery-locations/${id}`);
      toast.success("Delivery location deleted");
      router.push("/admin/delivery-locations");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete delivery location",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading delivery location...
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-error-500">
        Delivery location not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">
          Edit Delivery Location
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update city-level delivery rates or pickup addresses.
        </p>
      </div>

      <Card className="p-6" glass>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Location name"
              value={location.name || ""}
              onChange={(e) =>
                setLocation({ ...location, name: e.target.value })
              }
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Location type
              </label>
              <select
                value={location.type}
                onChange={(e) =>
                  setLocation({ ...location, type: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2"
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Country
              </label>
              <input
                list="delivery-country-options"
                value={location.country || ""}
                onChange={(e) =>
                  setLocation({ ...location, country: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2"
              />
              <datalist id="delivery-country-options">
                {countries.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                State
              </label>
              <input
                list="delivery-state-options"
                value={location.state || ""}
                onChange={(e) =>
                  setLocation({ ...location, state: e.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2"
              />
              <datalist id="delivery-state-options">
                {states.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <Input
              label="City"
              value={location.city || ""}
              onChange={(e) =>
                setLocation({ ...location, city: e.target.value })
              }
            />
          </div>

          <Input
            label="Street address / pickup address"
            value={location.address || ""}
            onChange={(e) =>
              setLocation({ ...location, address: e.target.value })
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Price"
              type="number"
              value={location.price || 0}
              onChange={(e) =>
                setLocation({ ...location, price: Number(e.target.value) })
              }
            />
            <Input
              label="Estimated delivery days"
              value={location.estimatedDays || ""}
              onChange={(e) =>
                setLocation({ ...location, estimatedDays: e.target.value })
              }
            />
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={location.isActive || false}
                  onChange={(e) =>
                    setLocation({ ...location, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-primary-500"
                />
                <span className="text-sm text-foreground">Enable</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/delivery-locations")}
            >
              Back
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
