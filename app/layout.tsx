import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import getStoreSettings from "@/lib/settings.server";

// Providers are composed via the `Providers` component imported below

import "./globals.css";
// Script import removed; theme initialization handled in ThemeProvider
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Store — Shop the Best Deals",
    template: "%s | Store",
  },
  description:
    "Discover quality products at great prices. Shop our curated collection with fast delivery and secure payments.",
  keywords: ["ecommerce", "shop", "online store", "buy", "deals"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Store",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await getStoreSettings();
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {/* <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var theme = localStorage.getItem('theme');

                if (theme) {
                  document.documentElement.setAttribute('data-theme', theme);
                } else if (
                  window.matchMedia('(prefers-color-scheme: dark)').matches
                ) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch (e) {}
            })();
          `} 
        </Script>
          */}
        <Providers initialSettings={initialSettings}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                boxShadow: "var(--shadow-elevated)",
              },
              success: {
                iconTheme: {
                  primary: "oklch(0.6 0.18 145)",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "oklch(0.58 0.22 25)",
                  secondary: "white",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
