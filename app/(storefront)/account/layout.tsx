"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { User, Package, MapPin, Heart, LogOut } from "lucide-react";
import { useAppDispatch } from "@/lib/store/hooks";
import { logout } from "@/lib/store/slices/authSlice";

const SIDEBAR_LINKS = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  // { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Or a skeleton loader
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-surface border border-border rounded-xl p-4 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl uppercase">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {SIDEBAR_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-error-600 hover:bg-error-50 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
