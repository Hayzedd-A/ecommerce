"use client";

import React, { useState } from "react";
import {
  Copy,
  CheckCircle,
  X,
  Building2,
  UploadCloud,
  Info,
  ShieldCheck,
  ArrowRight,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import { formatNumber } from "@/lib/utils/formatters";

type Props = {
  open: boolean;
  onClose: () => void;
  total: number;
  paymentRef: string | null;
  onCompleted?: ({
    ref,
    file,
  }: {
    ref: string | null;
    file: File | null;
  }) => Promise<void>;
};

export default function BankTransferModal({
  open,
  onClose,
  total,
  paymentRef,
  onCompleted,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const settings = useStoreSettings();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleCopyReference = async () => {
    if (!paymentRef) return;
    try {
      await navigator.clipboard.writeText(paymentRef);
      setIsCopied(true);
      toast.success("Reference copied!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleComplete = async () => {
    if (!file) {
      toast.error("Please upload proof of payment");
      return;
    }
    try {
      setIsSubmitting(true);
      if (onCompleted && paymentRef) {
        await onCompleted({ file, ref: paymentRef });
        setFile(null);
        toast.success("Proof submitted successfully");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

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
            overflow: "auto",
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
            <div className="bg-surface-secondary p-8 pt-10 border-b border-border text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-foreground leading-tight">
                Bank Transfer
              </h2>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Complete your payment by transferring to our account.
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Amount Display */}
              <div className="bg-foreground rounded-2xl p-6 text-background shadow-xl shadow-foreground/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    Total Amount
                  </span>
                  <div className="text-3xl font-black">
                    {settings.currencySymbol || "₦"}
                    {formatNumber(total)}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold bg-background/10 px-2 py-1 rounded-full text-background/80 uppercase tracking-tighter">
                  <ShieldCheck className="h-3 w-3 text-green-400" />
                  Secure Order
                </div>
              </div>

              {/* Bank Details Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-500" />
                  Account Details
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-surface-secondary p-4 rounded-xl border border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Bank Name
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {settings.personalAccount?.bankName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          Account Number
                        </p>
                        <p className="text-sm font-bold text-foreground font-mono">
                          {settings.personalAccount?.accountNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Account Name
                      </p>
                      <p className="text-sm font-bold text-foreground uppercase tracking-tight">
                        {settings.personalAccount?.accountName || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Payment Reference */}
                  <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase">
                          Payment Reference
                        </p>
                        <p className="text-lg font-mono font-black text-amber-700">
                          {paymentRef || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        disabled={!paymentRef}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition shadow-md shadow-amber-500/20"
                      >
                        {isCopied ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-600/80 font-medium mt-2">
                      Please include this reference in your transfer
                      description.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-primary-500" />
                  Proof of Payment
                </h3>

                <label
                  className={`
                  relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                  ${file ? "border-primary-500 bg-primary-500/5" : "border-border bg-surface-secondary hover:border-primary-500/50"}
                `}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <div className="flex flex-col items-center text-primary-600">
                        <FileText className="w-8 h-8 mb-1" />
                        <p className="text-xs font-bold truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] opacity-70">
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold">
                          Click to upload transfer receipt
                        </p>
                        <p className="text-[10px]">JPG, PNG or PDF (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action Buttons */}
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
                  onClick={handleComplete}
                  isLoading={isSubmitting}
                  className="flex-[2] h-14 rounded-2xl font-bold shadow-lg shadow-primary-500/25"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Submit Proof
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground font-medium px-4">
                After submission, our team will verify your payment within 24
                hours. Need help?{" "}
                <span className="text-primary-500 cursor-pointer hover:underline">
                  Contact Support
                </span>
              </p>
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
