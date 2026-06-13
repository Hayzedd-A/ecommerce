/* ============================================== */
/*  Formatting utilities — currency, dates, etc.   */
/* ============================================== */

// import { getCurrencySymbol } from "@/currencies";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

/**
 * Format a number as a currency string.
 * Pass `currency` explicitly from wherever settings are available.
 * — In client components: use `formatMoney()` from `useStoreSettings()`.
 * — In server components: call `getStoreSettings()` then pass `settings.currency`.
 */
export function formatCurrency(
  amount: number,
  currencySymbol: string = "$",
): string {
  // const currencySymbol = getCurrencySymbol(currency)
  // const formattedCurrency = new Intl.NumberFormat("en-NG", {
  //   style: "currency",
  //   currency: currencySymbol,
  //   minimumFractionDigits: 0,
  //   maximumFractionDigits: 2,
  // }).format(amount);

  const matchedCurrency = `${currencySymbol}${formatNumber(amount)}`;
  return matchedCurrency;
}

/**
 * Format a number with commas (e.g., 1000000 → "1,000,000").
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-NG").format(num);
}

/**
 * Format a date string as "Jan 15, 2025".
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format a date string as "Jan 15, 2025, 2:30 PM".
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/**
 * Get a relative time string (e.g., "2 hours ago", "just now").
 */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
}

/**
 * Format a phone number for display.
 */
export function formatPhone(phone: string): string {
  // Handles Nigerian phone numbers: 08012345678 → 0801 234 5678
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith("234")) {
    return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function normalizePhoneNumber(
  phoneNumber: string,
  countryCode: CountryCode = "NG",
): string {
  try {
    const phone = parsePhoneNumberFromString(phoneNumber, countryCode);

    if (!phone || !phone.isValid()) {
      throw new Error("Invalid phone number or country code");
    }

    return phone.number; // Returns E.164 format
  } catch (error) {
    throw error;
  }
}

/**
 * Format an order status for display.
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pending",
    pending_payment: "Pending Payment",
    paid: "Paid",
    processing: "Processing",
    in_progress: "In Progress",
    ready_for_pickup: "Ready for Pickup",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
}

/**
 * Get a CSS color class for an order status.
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: "text-warning-600 bg-warning-50",
    pending_payment: "text-warning-600 bg-warning-50",
    paid: "text-primary-600 bg-primary-50",
    processing: "text-accent-600 bg-accent-50",
    in_progress: "text-accent-600 bg-accent-50",
    ready_for_pickup: "text-primary-700 bg-primary-100",
    completed: "text-success-600 bg-success-50",
    cancelled: "text-error-600 bg-error-50",
  };
  return colorMap[status] || "text-neutral-600 bg-neutral-50";
}
