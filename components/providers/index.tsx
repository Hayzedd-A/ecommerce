"use client";

import QueryProvider from "./QueryProvider";
import StoreProvider from "./StoreProvider";
// import ThemeProvider from "./ThemeProvider";
import SettingsProvider from "./SettingsProvider";
import type { IStoreSettings } from "@/lib/types";
import { ThemeProvider } from "next-themes";

export function Providers({ children, initialSettings }: { children: React.ReactNode; initialSettings?: IStoreSettings | null }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
      <StoreProvider>
        <QueryProvider>
          <SettingsProvider initialSettings={initialSettings}>{children}</SettingsProvider>
        </QueryProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
