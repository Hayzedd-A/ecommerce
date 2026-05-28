"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Lock,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useTheme } from "@/components/providers/ThemeProvider";
import { clearUser } from "@/lib/store/slices/authSlice";
import apiClient from "@/lib/api/client";
import { cn } from "@/lib/utils/helpers";

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();

  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Secure admin routing
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?callbackUrl=/admin");
      } else if (user?.role !== "admin" && user?.role !== "staff") {
        toast.error("Unauthorized: Admin access required.");
        router.push("/");
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      dispatch(clearUser());
      toast.success("Successfully logged out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-t-transparent border-primary-500 border-4" />
      </div>
    );
  }

  // Double check authorization
  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "staff")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-6 space-y-4">
        <Lock className="h-12 w-12 text-error-500" />
        <h1 className="text-xl font-bold text-foreground">Unauthorized Access</h1>
        <p className="text-sm text-muted-foreground">You do not have the credentials to view this area.</p>
        <Link href="/" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              ADMIN CONTROL
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                  isActive
                    ? "bg-primary-500 text-white shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-secondary"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{link.label}</span>
                <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100", isActive && "opacity-100")} />
              </Link>
            );
          })}
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-border bg-surface-secondary space-y-2">
          {/* User profile brief */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
              {user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-foreground truncate">{user.name}</h4>
              <span className="text-[10px] text-muted-foreground capitalize font-semibold bg-surface border px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-error-500 hover:bg-error-50/50 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-secondary text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
              <span>Admin Portal</span>
              <span>/</span>
              <span className="text-foreground capitalize">{pathname.split("/").pop() || "Dashboard"}</span>
            </div>
          </div>

          {/* Settings / Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-surface-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5 text-warning-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Front Store link */}
            <Link
              href="/"
              className="text-xs font-bold border border-border px-3.5 py-2 rounded-xl hover:bg-surface-secondary text-foreground transition-all"
            >
              View Storefront
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-surface-secondary/40">{children}</main>
      </div>
    </div>
  );
}
