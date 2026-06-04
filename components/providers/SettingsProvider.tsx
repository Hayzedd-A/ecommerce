"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { IStoreSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";

interface SettingsContextValue extends IStoreSettings {
  // settings: IStoreSettings | null;
  formatMoney: (amount: number) => string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function useStoreSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useStoreSettings must be used within SettingsProvider");
  }
  return ctx;
}

async function fetchStoreSettings() {
  const response = await apiClient.get("/settings");
  return response.data.data as IStoreSettings;
}

export default function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: IStoreSettings | null;
}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["storeSettings"],
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: initialSettings ?? undefined,
  });

  function getSymbol(currencyCode: string) {
    // the api doesn't return the currency symbol for NGN, so we hardcode it for now
    if (currencyCode.toUpperCase() === "NGN") return "₦";

    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
    });

    // Extract the symbol part
    const parts = formatter.formatToParts();
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart ? symbolPart.value : null;
  }

  const currencySymbol = getSymbol(data ? data.currency : "NGN") || "₦";

  const formatMoney = (amount: number) =>
    formatCurrency(amount, data?.currency || "NGN");

  return (
    <SettingsContext.Provider
      value={
        {
          ...(data || {}),
          currencySymbol,
          formatMoney,
          isLoading: isLoading,
          isError: isError,
          error: error,
          refetchSettings: async () => {
            await refetch();
          },
        } as SettingsContextValue
      }
    >
      {children}
    </SettingsContext.Provider>
  );
}
