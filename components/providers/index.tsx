"use client";

import QueryProvider from "./QueryProvider";
import StoreProvider from "./StoreProvider";
import ThemeProvider from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <StoreProvider>
                <QueryProvider>
                    {children}
                </QueryProvider>
            </StoreProvider>
        </ThemeProvider>
    );
}