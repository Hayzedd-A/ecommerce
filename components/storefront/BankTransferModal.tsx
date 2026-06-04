"use client";

import React, { useEffect, useState } from "react";
import { Copy, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/api/client";
import { useStoreSettings } from "@/components/providers/SettingsProvider";
import { toast } from "react-hot-toast";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { formatNumber } from "@/lib/utils/formatters";


type Props = {
    open: boolean;
    onClose: () => void;
    data: any;
    total: number;
    onCompleted?: (orderId: string) => void;
};

export default function BankTransferModal({
    open,
    onClose,
    data,
    total,
    onCompleted,
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentRef, setPaymentRef] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const settings = useStoreSettings();

    useEffect(() => {
        async function fetchPaymentRef() {
            const res = await apiClient.get("/payments/initialize");
            if (res.data.success) setPaymentRef(res.data.reference);
        }
        if (open) fetchPaymentRef();
    }, [open]);
    if (!open) return null;

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


    const handleSubmit = async () => {
        if (!data || !data.items || data.items.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        setIsSubmitting(true);
        try {
            // 1. Create order (bank transfer)
            const payload = { ...data, paymentRef, total };
            const createRes = await apiClient.post("/orders", payload);
            if (!createRes.data?.success) {
                throw new Error(createRes.data?.message || "Failed to create order");
            }
            const orderId = createRes.data.orderId as string;

            // 2. Upload evidence if provided
            if (file) {
                const fd = new FormData();
                fd.append("file", file);
                const uploadRes = await apiClient.post(
                    `/orders/${orderId}/evidence`,
                    fd,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    },
                );
                if (!uploadRes.data?.success) {
                    throw new Error(uploadRes.data?.message || "Upload failed");
                }
            }

            toast.success("Order placed. Awaiting payment verification.");
            setFile(null);
            onClose();
            if (onCompleted) onCompleted(orderId);
        } catch (err: any) {
            toast.error(err?.message || "Failed to place order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                Bank Transfer
                <IconButton onClick={onClose}>
                    <X />
                </IconButton>
            </DialogTitle>
            <DialogContent>
            <Typography>
                Send payment to the account below and upload proof.
            </Typography>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                            Bank
                        </label>
                        <div className="mt-1 p-3 rounded-lg border border-border bg-surface">
                            <div className="text-sm font-semibold">
                                {settings.personalAccount?.bankName || "N/A"}
                            </div>
                            <div className="text-sm">
                                {settings.personalAccount?.accountNumber || "N/A"}
                            </div>
                            <div className="text-sm">
                                {settings.personalAccount?.accountName || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                            Amount
                        </label>
                        <div className="mt-1 p-3 rounded-lg border border-border bg-surface">
                            <div className="text-sm font-semibold">
                                {settings.currencySymbol || "₦"}
                                {formatNumber(total)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Include the payment reference in your transfer notes.
                            </div>

                            <div className="mt-2">
                                <label className="text-xs font-semibold text-muted-foreground">
                                    Payment Reference
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface">
                                        <span className="text-sm font-mono">
                                            {paymentRef || "-"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyReference}
                                        disabled={!paymentRef}
                                        className="px-3 py-2 rounded-lg border border-border hover:bg-surface-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Copy to clipboard"
                                    >
                                        {isCopied ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="text-xs font-semibold text-muted-foreground">
                        Upload proof (image / pdf)
                    </label>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="block mt-2"
                    />
                </div>

            </DialogContent>

            <DialogActions>

                <div className="mt-6 flex items-center gap-3">
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        className="px-6"
                    >
                        Submit
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </DialogActions>

        </Dialog>
    );
}
