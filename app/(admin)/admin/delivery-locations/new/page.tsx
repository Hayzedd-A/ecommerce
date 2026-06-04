"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminNewDeliveryLocationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("delivery");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [estimatedDays, setEstimatedDays] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await apiClient.get("/admin/delivery-locations", {
          params: { page: 1, limit: 200 },
        });
        setSuggestions(response.data.data.items || []);
      } catch {
        // ignore suggestion load errors
      }
    };
    loadSuggestions();
  }, []);

  const countries = Array.from(
    new Set(suggestions.map((item) => item.country)),
  ).sort();
  const states = Array.from(
    new Set(
      suggestions
        .filter((item) => item.country === country)
        .map((item) => item.state),
    ),
  ).sort();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/admin/delivery-locations", {
        name,
        type,
        country,
        state,
        city,
        address,
        price,
        estimatedDays,
        isActive,
      });
      toast.success("Delivery location created successfully");
      router.push("/admin/delivery-locations");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create delivery location",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">
          New Delivery Location
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a city-level delivery area or store pickup point.
        </p>
      </div>

      <Card className="p-6" glass>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Location name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lekki"
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Location type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
                State / Region
              </label>
              <input
                list="delivery-state-options"
                value={state}
                onChange={(e) => setState(e.target.value)}
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
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ikeja"
            />
          </div>

          <Input
            label="Street address / pickup address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Put a full store address or area description"
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <Input
              label="Estimated delivery days"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="1-2 days"
            />
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-500"
                />
                <span className="text-sm text-foreground">Enable</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push("/admin/delivery-locations")}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save location
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
