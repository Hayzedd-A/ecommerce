"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { IStoreSettings } from "@/lib/types";

interface SettingsContextValue {
  settings: IStoreSettings | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

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
  const query = useQuery({
    queryKey: ["storeSettings"],
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: initialSettings ?? undefined,
  });

  return (
    <SettingsContext.Provider
      value={{
        settings: query.data ?? null,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetchSettings: async () => {
          await query.refetch();
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
