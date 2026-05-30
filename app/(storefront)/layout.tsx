import React from "react";
import Navbar from "@/components/storefront/Navbar";
import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import ThemeProvider from "@/components/providers/ThemeProvider";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Dynamic Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Slide-in Cart Panel */}
      <CartDrawer />

      {/* Footnote and contact blocks */}
      <Footer />
    </div>
  );
}
