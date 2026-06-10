"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { IStoreSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { getCurrencySymbol } from "@/currencies";

interface SettingsContextValue extends IStoreSettings {
  // settings: IStoreSettings | null;
  formatMoney: (amount: number) => string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetchSettings: () => Promise<void>;
  updateStoreSettings: (
    updatedSettings: Partial<IStoreSettings>,
  ) => Promise<void>;
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

  const formatMoney = (amount: number) =>
    formatCurrency(amount, data?.currencySymbol);

  const updateStoreSettings = async (
    updatedSettings: Partial<IStoreSettings>,
  ) => {
    try {
      const response = await apiClient.put("/admin/settings", updatedSettings);
      return response.data;
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={
        {
          ...(data || {}),
          formatMoney,
          isLoading: isLoading,
          isError: isError,
          error: error,
          refetchSettings: async () => {
            await refetch();
          },
          updateStoreSettings,
        } as SettingsContextValue
      }
    >
      {children}
    </SettingsContext.Provider>
  );
}
