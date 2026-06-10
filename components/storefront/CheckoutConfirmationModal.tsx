"use client";

import { IDeliveryLocation } from "@/lib/types";
import { Dialog, DialogContent, Avatar, IconButton } from "@mui/material";
import {
  CheckCircle,
  CreditCard,
  MessageSquare,
  Truck,
  Building2,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { JSX, useMemo } from "react";
import { useStoreSettings } from "../providers/SettingsProvider";
import { Button } from "../ui/Button";

interface CheckoutConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  selectedCheckoutMethod: string;
  deliveryMethod: string;
  selectedDeliveryLocation: IDeliveryLocation | null;
  items: any[];
  totalAmount: number;
}

const CheckoutConfirmationModal = ({
  open,
  onClose,
  onSubmit,
  selectedCheckoutMethod,
  deliveryMethod,
  selectedDeliveryLocation,
  totalAmount,
  items,
}: CheckoutConfirmationModalProps): JSX.Element => {
  const { formatMoney } = useStoreSettings();

  const getMethodInfo = useMemo(() => {
    switch (selectedCheckoutMethod) {
      case "online":
        return {
          label: "Online Payment",
          buttonLabel: "Confirm & Pay Online",
          icon: <CreditCard className="h-5 w-5" />,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        };
      case "bank_transfer":
        return {
          label: "Bank Transfer",
          buttonLabel: "Confirm & Show Bank Details",
          icon: <Building2 className="h-5 w-5" />,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        };
      case "whatsapp":
        return {
          label: "Order via WhatsApp",
          buttonLabel: "Confirm & Order via WhatsApp",
          icon: <MessageSquare className="h-5 w-5" />,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        };
      case "pay_on_delivery":
        return {
          label: "Pay on Delivery",
          buttonLabel: "Confirm & Pay on Delivery",
          icon: <Truck className="h-5 w-5" />,
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10",
        };
      default:
        return {
          label: "Other",
          buttonLabel: "Confirm Order",
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-muted-foreground",
          bgColor: "bg-muted/10",
        };
    }
  }, [selectedCheckoutMethod]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "24px",
            overflow: "hidden",
            bgcolor: "var(--background)",
            backgroundImage: "none",
          },
        },
      }}
    >
      <div className="relative bg-background">
        {/* Close Button */}
        <div className="absolute right-4 top-4 z-10">
          <IconButton
            onClick={onClose}
            size="small"
            className="bg-surface-secondary hover:bg-border transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </IconButton>
        </div>

        <DialogContent className="p-0">
          <div className="flex flex-col">
            {/* Header Section */}
            <div className="bg-surface-secondary p-8 pt-10 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground leading-tight">
                    Review Order
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    Almost there! One last look.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-secondary rounded-2xl p-4 border border-border flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Method
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`p-1.5 rounded-lg ${getMethodInfo.bgColor} ${getMethodInfo.color}`}
                    >
                      {getMethodInfo.icon}
                    </div>
                    <span className="font-bold text-foreground">
                      {getMethodInfo.label}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-secondary rounded-2xl p-4 border border-border flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery Option
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-1.5 rounded-lg bg-surface text-muted-foreground border border-border">
                      {deliveryMethod === "delivery" ? (
                        <Truck className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <span className="font-bold text-foreground">
                      {deliveryMethod === "delivery"
                        ? selectedDeliveryLocation?.name || "Standard Delivery"
                        : "Store Pickup"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Order Items ({items.length})
                  </h3>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {items.slice(0, 1).map((it) => (
                    <div
                      key={`${it.productId}-${it.variantId || ""}`}
                      className="relative flex items-center gap-4 bg-surface p-3 rounded-xl border border-border hover:border-primary-500/50 transition-colors group"
                    >
                      <div className="relative">
                        <Avatar
                          variant="rounded"
                          src={it.image}
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "12px",
                            border: "1px solid var(--border)",
                          }}
                        />
                        <div className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                          {it.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary-500 transition-colors">
                          {it.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {it.variantLabel ? `${it.variantLabel} • ` : ""}
                          {formatMoney(it.price)} each
                        </p>
                      </div>
                      <div className="text-sm font-black text-foreground">
                        {formatMoney(it.price * it.quantity)}
                      </div>

                      {items.length > 1 && (
                        <div className="absolute top-0 right-0 w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                          <span className="text-[10px] font-black text-background">
                            + {items.length - 1}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Section */}
              <div className="bg-foreground rounded-2xl p-6 text-background shadow-xl shadow-foreground/10">
                <div className="flex items-center justify-between mb-1 opacity-60">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Total to pay
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-black">
                    {formatMoney(totalAmount)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold bg-background/10 px-2 py-1 rounded-full text-background/80 uppercase tracking-tighter">
                    <ShieldCheck className="h-3 w-3 text-success-500" />
                    Secure Transaction
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl font-bold text-foreground border-none bg-surface-secondary hover:bg-border"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={onSubmit}
                  className="flex-[2] h-14 rounded-2xl font-bold shadow-lg shadow-primary-500/25"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  {getMethodInfo.buttonLabel}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                By clicking confirm, you agree to our terms of service and
                privacy policy. Your order will be processed immediately.
              </p>
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default CheckoutConfirmationModal;
