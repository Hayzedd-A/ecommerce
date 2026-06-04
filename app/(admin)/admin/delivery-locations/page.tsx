"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Trash, Pencil, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { Toggle } from "@/components/ui/Toggle";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

export default function AdminDeliveryLocationsPage() {
  const { pickupEnabled, deliveryEnabled, refetchSettings } =
    useStoreSettings();
  const [locations, setLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [enablePickup, setEnablePickup] = useState(pickupEnabled);
  const [enableDelivery, setEnableDelivery] = useState(deliveryEnabled);

  const handlePickupDeliveryChange = async (
    type: "pickup" | "delivery",
    value: boolean,
  ) => {
    try {
      type === "pickup" ? setEnablePickup(value) : setEnableDelivery(value);
      await apiClient.put("/admin/settings", {
        pickupEnabled: type === "pickup" ? value : enablePickup,
        deliveryEnabled: type === "delivery" ? value : enableDelivery,
      });
      refetchSettings();
      toast.success(`${type} ${value ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${type} ${value ? "enable" : "disable"}`,
      );
    }
  };

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/delivery-locations", {
        params: { page, limit: 20, search },
      });
      setLocations(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to load delivery locations",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this delivery location?")) return;
    try {
      await apiClient.delete(`/admin/delivery-locations/${id}`);
      setLocations(locations.filter((loc) => loc._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("Delivery location deleted");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete delivery location",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Delivery Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage supported cities, pickup points, and pricing.
          </p>
        </div>
        <div className="flex flex-col items-center sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-80">
            <Input
              // label="Search locations"
              placeholder="Search by name, city, state or country"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Link
            href="/admin/delivery-locations/new"
            className="w-full sm:w-auto"
          >
            <Button variant="primary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Create Location
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6" glass>
        <div className="flex flex-wrap gap-6 mb-3 border-b-2 border-dashed p-4">
          <Toggle
            checked={enableDelivery}
            onChange={(val) => {
              handlePickupDeliveryChange("delivery", val);
            }}
            label="Enable delivery"
          />
          <Toggle
            checked={enablePickup}
            onChange={(val) => {
              handlePickupDeliveryChange("pickup", val);
            }}
            label="Enable pickup"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="space-y-3">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading locations...
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No delivery locations found.
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr
                    key={location._id}
                    className="bg-surface rounded-3xl shadow-sm"
                  >
                    <td className="px-4 py-4 text-sm text-muted-foreground capitalize">
                      {location.type}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      <div>{location.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[location.city, location.state, location.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      {location.address && (
                        <div className="text-xs text-muted-foreground">
                          {location.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {location.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {location.estimatedDays || "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {location.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Link
                        href={`/admin/delivery-locations/${location._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                      <button
                        className="inline-flex items-center gap-2 rounded-xl border border-error-300 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700 hover:bg-error-100"
                        onClick={() => handleDelete(location._id)}
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
          <span>{total} locations</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">
              Page {page}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={locations.length < 20}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
