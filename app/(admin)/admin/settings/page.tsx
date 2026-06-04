"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Globe,
  Clock,
  CreditCard,
  Truck,
  ShoppingCart,
  Palette,
  Search,
  Building2,
  Share2,
} from "lucide-react";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import { Toggle } from "@/components/ui/Toggle";

/* ─── Zod Schema ──────────────────────────────────────────────────────────── */

const settingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required").max(100),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  currency: z.string().min(1, "Currency code is required").max(10),
  currencySymbol: z.string().min(1, "Currency symbol is required").max(5),
  description: z.string().max(1000).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  pickupAddress: z.string().max(300).optional().or(z.literal("")),
  favicon: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),

  socialLinks: z.object({
    facebook: z.string().url("Invalid URL").optional().or(z.literal("")),
    instagram: z.string().url("Invalid URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid URL").optional().or(z.literal("")),
    tiktok: z.string().url("Invalid URL").optional().or(z.literal("")),
    youtube: z.string().url("Invalid URL").optional().or(z.literal("")),
    whatsapp: z.string().max(20).optional().or(z.literal("")),
  }),

  businessHours: z.array(
    z.object({
      day: z.string().min(1, "Day is required"),
      open: z.string().optional().or(z.literal("")),
      close: z.string().optional().or(z.literal("")),
      isClosed: z.boolean(),
    }),
  ),

  seoMeta: z.object({
    metaTitle: z.string().max(70).optional().or(z.literal("")),
    metaDescription: z.string().max(160).optional().or(z.literal("")),
    ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  }),

  themeColors: z.object({
    primary: z.string().optional().or(z.literal("")),
    secondary: z.string().optional().or(z.literal("")),
    accent: z.string().optional().or(z.literal("")),
  }),

  // deliveryZones: z.array(
  //   z.object({
  //     name: z.string().min(1, "Zone name is required"),
  //     fee: z
  //       .number({ "invalid_type_error": "Fee must be a number" })
  //       .min(0, "Fee cannot be negative"),
  //     estimatedDays: z.string().optional().or(z.literal("")),
  //   }),
  // ),

  checkoutMethod: z.object({
    allowGuestCheckout: z.boolean(),
    acceptOnlinePayment: z.boolean(),
    acceptCashOnDelivery: z.boolean(),
    acceptBankTransfer: z.boolean(),
    acceptWhatsappOrder: z.boolean(),
    defaultCheckoutMethod: z.enum(["online", "cash", "bank", "whatsapp"]),
  }),

  personalAccount: z.object({
    bankName: z.string().max(100).optional().or(z.literal("")),
    accountNumber: z.string().max(20).optional().or(z.literal("")),
    accountName: z.string().max(100).optional().or(z.literal("")),
  }),

  paymentSettings: z.object({
    activeProvider: z.enum(["monnify", "paystack"]),
    monnify: z.object({
      apiKey: z.string().optional().or(z.literal("")),
      secretKey: z.string().optional().or(z.literal("")),
      contractCode: z.string().optional().or(z.literal("")),
      baseUrl: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    }),
    paystack: z.object({
      publicKey: z.string().optional().or(z.literal("")),
      secretKey: z.string().optional().or(z.literal("")),
    }),
  }),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_VALUES: SettingsForm = {
  storeName: "",
  email: "",
  phone: "",
  currency: "NGN",
  currencySymbol: "₦",
  description: "",
  address: "",
  pickupAddress: "",
  favicon: "",
  pickupEnabled: false,
  deliveryEnabled: true,
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    whatsapp: "",
  },
  businessHours: DAYS.map((day) => ({
    day,
    open: "09:00",
    close: "18:00",
    isClosed: false,
  })),
  seoMeta: { metaTitle: "", metaDescription: "", ogImage: "" },
  themeColors: { primary: "", secondary: "", accent: "" },
  // deliveryZones: [],
  checkoutMethod: {
    allowGuestCheckout: true,
    acceptOnlinePayment: false,
    acceptCashOnDelivery: false,
    acceptBankTransfer: false,
    acceptWhatsappOrder: true,
    defaultCheckoutMethod: "whatsapp",
  },
  personalAccount: { bankName: "", accountNumber: "", accountName: "" },
  paymentSettings: {
    activeProvider: "monnify",
    monnify: {
      apiKey: "",
      secretKey: "",
      contractCode: "",
      baseUrl: "https://sandbox.monnify.com",
    },
    paystack: { publicKey: "", secretKey: "" },
  },
};

/* ─── Small helpers ───────────────────────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4 mb-6">
      <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-xs text-error-600 font-medium mt-1 block">
      {message}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { refetchSettings } = useStoreSettings();

  // const {
  //   fields: zoneFields,
  //   append: appendZone,
  //   remove: removeZone,
  // } = useFieldArray({ control, name: "deliveryZones" });
  const { fields: hourFields } = useFieldArray({
    control,
    name: "businessHours",
  });

  const activeProvider = watch("paymentSettings.activeProvider");
  const pickupEnabled = watch("pickupEnabled");
  const deliveryEnabled = watch("deliveryEnabled");

  /* Load settings */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/settings");
        const data = res.data.data;
        // Ensure businessHours covers all 7 days
        const existingHours: typeof DEFAULT_VALUES.businessHours = data
          .businessHours?.length
          ? data.businessHours
          : DEFAULT_VALUES.businessHours;
        reset({
          ...DEFAULT_VALUES,
          ...data,
          businessHours: existingHours,
          socialLinks: { ...DEFAULT_VALUES.socialLinks, ...data.socialLinks },
          seoMeta: { ...DEFAULT_VALUES.seoMeta, ...data.seoMeta },
          themeColors: { ...DEFAULT_VALUES.themeColors, ...data.themeColors },
          checkoutMethod: {
            ...DEFAULT_VALUES.checkoutMethod,
            ...data.checkoutMethod,
          },
          personalAccount: {
            ...DEFAULT_VALUES.personalAccount,
            ...data.personalAccount,
          },
          paymentSettings: {
            ...DEFAULT_VALUES.paymentSettings,
            ...data.paymentSettings,
            monnify: {
              ...DEFAULT_VALUES.paymentSettings.monnify,
              ...data.paymentSettings?.monnify,
            },
            paystack: {
              ...DEFAULT_VALUES.paymentSettings.paystack,
              ...data.paymentSettings?.paystack,
            },
          },
        });
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Unable to load settings");
      }
    })();
  }, [reset]);

  const onSubmit = async (values: SettingsForm) => {
    try {
      await apiClient.put("/admin/settings", values);
      toast.success("Settings saved successfully");
      refetchSettings();
      reset(values); // clear dirty state
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Store Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all store configuration in one place.
          </p>
        </div>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="px-10"
          disabled={!isDirty && !isSubmitting}
        >
          Save Changes
        </Button>
      </div>

      {/* ── 1. General Info ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Globe size={18} />}
          title="General Info"
          subtitle="Basic store identity, location and contact information"
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <Input
              label="Store Name *"
              {...register("storeName")}
              error={errors.storeName?.message}
            />
          </div>
          <div>
            <Input
              label="Store Email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div>
            <Input
              label="Phone"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>
          <div>
            <Input
              label="Currency Code"
              placeholder="NGN"
              {...register("currency")}
              error={errors.currency?.message}
            />
          </div>
          <div>
            <Input
              label="Store Address"
              {...register("address")}
              error={errors.address?.message}
            />
          </div>
          <div>
            <Input
              label="Favicon URL"
              placeholder="https://..."
              {...register("favicon")}
              error={errors.favicon?.message}
            />
          </div>
        </div>
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Store Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Tell customers about your store..."
            className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground placeholder:text-muted outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all"
          />
          <FieldError message={errors.description?.message} />
        </div>
      </Card>

      {/* ── 2. Address & Delivery ── */}
      {/* <Card className="p-6" glass>
        <SectionHeader
          icon={<Truck size={18} />}
          title="Address & Delivery"
          subtitle="Physical address, pickup and delivery zone configuration"
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <Input
              label="Pickup Address"
              {...register("pickupAddress")}
              error={errors.pickupAddress?.message}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-6">
          <Controller
            control={control}
            name="deliveryEnabled"
            render={({ field }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="Delivery enabled"
              />
            )}
          />
          <Controller
            control={control}
            name="pickupEnabled"
            render={({ field }) => (
              <Toggle
                checked={field.value}
                onChange={field.onChange}
                label="Pickup enabled"
              />
            )}
          />
        </div>

      </Card> */}

      {/* ── 3. Business Hours ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Clock size={18} />}
          title="Business Hours"
          subtitle="Set your store opening hours for each day"
        />
        <div className="space-y-3">
          {hourFields.map((field, i) => {
            const isClosed = watch(`businessHours.${i}.isClosed`);
            return (
              <div
                key={field.id}
                className="grid grid-cols-[100px_1fr_1fr_auto] gap-4 items-center py-3 border-b border-border last:border-0"
              >
                <span className="text-sm font-medium text-foreground">
                  {field.day}
                </span>
                <input
                  type="time"
                  disabled={isClosed}
                  {...register(`businessHours.${i}.open`)}
                  className="rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary-500 disabled:opacity-40"
                />
                <input
                  type="time"
                  disabled={isClosed}
                  {...register(`businessHours.${i}.close`)}
                  className="rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary-500 disabled:opacity-40"
                />
                <Controller
                  control={control}
                  name={`businessHours.${i}.isClosed`}
                  render={({ field: f }) => (
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <div
                        onClick={() => f.onChange(!f.value)}
                        className={`relative w-8 h-5 rounded-full transition-colors ${f.value ? "bg-error-500" : "bg-border"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${f.value ? "translate-x-3" : ""}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Closed
                      </span>
                    </label>
                  )}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 4. Social Links ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Share2 size={18} />}
          title="Social Links"
          subtitle="Connect your social media profiles"
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {(
            ["facebook", "instagram", "twitter", "tiktok", "youtube"] as const
          ).map((platform) => (
            <div key={platform}>
              <Input
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                placeholder={`https://${platform}.com/yourstore`}
                {...register(`socialLinks.${platform}`)}
                error={errors.socialLinks?.[platform]?.message}
              />
            </div>
          ))}
          <div>
            <Input
              label="WhatsApp Number"
              placeholder="08012345678"
              {...register("socialLinks.whatsapp")}
              error={errors.socialLinks?.whatsapp?.message}
            />
          </div>
        </div>
      </Card>

      {/* ── 5. SEO ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Search size={18} />}
          title="SEO & Meta"
          subtitle="Help search engines find your store"
        />
        <div className="grid gap-5">
          <div>
            <Input
              label="Meta Title"
              placeholder="My Store — Best Products Online"
              {...register("seoMeta.metaTitle")}
              error={errors.seoMeta?.metaTitle?.message}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 50–70 characters
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Meta Description
            </label>
            <textarea
              {...register("seoMeta.metaDescription")}
              rows={3}
              placeholder="A brief description of your store for search engines (max 160 chars)..."
              className="w-full rounded-lg border border-border bg-input-bg px-4 py-3 text-foreground placeholder:text-muted outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all"
            />
            <FieldError message={errors.seoMeta?.metaDescription?.message} />
          </div>
          <div>
            <Input
              label="OG Image URL"
              placeholder="https://..."
              {...register("seoMeta.ogImage")}
              error={errors.seoMeta?.ogImage?.message}
            />
          </div>
        </div>
      </Card>

      {/* ── 6. Theme Colors ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Palette size={18} />}
          title="Theme Colors"
          subtitle="Brand colors used across the storefront"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {(["primary", "secondary", "accent"] as const).map((color) => (
            <div key={color}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </label>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name={`themeColors.${color}`}
                  render={({ field }) => (
                    <input
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer bg-input-bg p-0.5"
                    />
                  )}
                />
                <Input
                  placeholder="#3B82F6"
                  {...register(`themeColors.${color}`)}
                  containerClassName="flex-1"
                />
              </div>
              <FieldError message={errors.themeColors?.[color]?.message} />
            </div>
          ))}
        </div>
      </Card>

      {/* ── 7. Checkout Methods ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<ShoppingCart size={18} />}
          title="Checkout Methods"
          subtitle="Control how customers can place and pay for orders"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["allowGuestCheckout", "Allow Guest Checkout"],
              ["acceptOnlinePayment", "Accept Online Payment"],
              ["acceptCashOnDelivery", "Accept Cash on Delivery"],
              ["acceptBankTransfer", "Accept Bank Transfer"],
              ["acceptWhatsappOrder", "Accept WhatsApp Orders"],
            ] as const
          ).map(([field, label]) => (
            <Controller
              key={field}
              control={control}
              name={`checkoutMethod.${field}`}
              render={({ field: f }) => (
                <Toggle checked={f.value} onChange={f.onChange} label={label} />
              )}
            />
          ))}
        </div>

        <div className="mt-6 max-w-xs">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Default Checkout Method
          </label>
          <select
            {...register("checkoutMethod.defaultCheckoutMethod")}
            className="w-full rounded-lg border border-border bg-input-bg px-4 py-2.5 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all"
          >
            <option value="online">Online Payment</option>
            <option value="cash">Cash on Delivery</option>
            <option value="bank">Bank Transfer</option>
            <option value="whatsapp">WhatsApp Order</option>
          </select>
        </div>
      </Card>

      {/* ── 8. Personal / Bank Account ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<Building2 size={18} />}
          title="Bank Account Details"
          subtitle="Used for bank transfer payment acceptance"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <Input
            label="Bank Name"
            placeholder="First Bank"
            {...register("personalAccount.bankName")}
            error={errors.personalAccount?.bankName?.message}
          />
          <Input
            label="Account Number"
            placeholder="0123456789"
            {...register("personalAccount.accountNumber")}
            error={errors.personalAccount?.accountNumber?.message}
          />
          <Input
            label="Account Name"
            placeholder="Your Account Name"
            {...register("personalAccount.accountName")}
            error={errors.personalAccount?.accountName?.message}
          />
        </div>
      </Card>

      {/* ── 9. Payment Gateway Settings ── */}
      <Card className="p-6" glass>
        <SectionHeader
          icon={<CreditCard size={18} />}
          title="Payment Gateway"
          subtitle="Configure your online payment provider credentials"
        />

        <div className="max-w-xs mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Active Provider
          </label>
          <select
            {...register("paymentSettings.activeProvider")}
            className="w-full rounded-lg border border-border bg-input-bg px-4 py-2.5 text-foreground outline-none focus:border-primary-500 focus:ring-4 focus:ring-ring transition-all"
          >
            <option value="monnify">Monnify</option>
            <option value="paystack">Paystack</option>
          </select>
        </div>

        <div className="grid gap-6">
          {/* Monnify */}
          <div className="p-5 border border-border rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Monnify Configuration
              {activeProvider === "monnify" && (
                <span className="text-[10px] bg-success-500/15 text-success-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Active
                </span>
              )}
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="API Key"
                {...register("paymentSettings.monnify.apiKey")}
              />
              <Input
                label="Secret Key"
                type="password"
                {...register("paymentSettings.monnify.secretKey")}
              />
              <Input
                label="Contract Code"
                {...register("paymentSettings.monnify.contractCode")}
              />
              <Input
                label="Base URL"
                placeholder="https://sandbox.monnify.com"
                {...register("paymentSettings.monnify.baseUrl")}
                error={errors.paymentSettings?.monnify?.baseUrl?.message}
              />
            </div>
          </div>

          {/* Paystack */}
          <div className="p-5 border border-border rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Paystack Configuration
              {activeProvider === "paystack" && (
                <span className="text-[10px] bg-success-500/15 text-success-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Active
                </span>
              )}
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Public Key"
                {...register("paymentSettings.paystack.publicKey")}
              />
              <Input
                label="Secret Key"
                type="password"
                {...register("paymentSettings.paystack.secretKey")}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Sticky footer save */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="px-14"
          disabled={!isDirty && !isSubmitting}
        >
          Save All Settings
        </Button>
      </div>
    </form>
  );
}
