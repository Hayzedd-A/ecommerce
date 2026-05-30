"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/customers", { params: { page, limit: 20 } });
      setCustomers(response.data.data.items || []);
      setTotal(response.data.data.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">View shoppers with registered accounts and account status.</p>
      </div>

      <Card className="p-6" glass>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No customers found.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="bg-surface rounded-3xl shadow-sm">
                    <td className="px-4 py-4 font-semibold text-foreground">{customer.name}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{customer.phone || "—"}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground capitalize">{customer.role}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{customer.isActive ? "Active" : "Suspended"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} customers</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>Prev</Button>
            <span className="px-3 py-2 rounded-xl bg-surface border border-border">Page {page}</span>
            <Button variant="secondary" onClick={() => setPage((prev) => prev + 1)} disabled={customers.length < 20}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
