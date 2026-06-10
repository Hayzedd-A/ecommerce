"use client";

import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { SocialIcon } from "react-social-icons";
import { useStoreSettings } from "@/components/providers/SettingsProvider";

export default function Footer() {
  const { socialLinks, storeName, description, address, phone, email, aboutUs } =
    useStoreSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-secondary border-t border-border mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Description */}
          <div className="space-y-4">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              {storeName || "STOREFRONT"}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description ||
                "Your one-stop destination for premium and reliable products. Crafted for convenience and exceptional value."}
            </p>
            <div className="flex items-center gap-3">
              {Object.entries(socialLinks ?? {}).map(
                ([key, value]) =>
                  value && (
                    <SocialIcon
                      key={key}
                      style={{ width: 30, height: 30 }}
                      url={value}
                    />
                  ),
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/products"
                  className="hover:text-primary-500 transition-colors"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-primary-500 transition-colors"
                >
                  Shop Categories
                </Link>
              </li>
              {aboutUs?.showAboutUsPage !== false && (
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary-500 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/account"
                  className="hover:text-primary-500 transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/checkout"
                  className="hover:text-primary-500 transition-colors"
                >
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:text-primary-500 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary-500 transition-colors"
                >
                  Shipping & Delivery Info
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary-500 transition-colors"
                >
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary-500 transition-colors"
                >
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-primary-500 flex-shrink-0" />
                <span>{address || "123 Commerce Avenue, Lagos, Nigeria"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <span>{phone || "+234 800 123 4567"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary-500 flex-shrink-0" />
                <span>{email || "support@email.com"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>&copy; {currentYear} Storefront. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
