"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { toggleCartDrawer, closeModal } from "@/lib/store/slices/uiSlice";
import { updateQuantity, removeFromCart } from "@/lib/store/slices/cartSlice";
import { Button } from "../ui/Button";
import { useStoreSettings } from "../providers/SettingsProvider";

export default function CartDrawer() {
  const { formatMoney } = useStoreSettings();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector((state) => state.ui.isCartDrawerOpen);
  const { items, subtotal } = useAppSelector((state) => state.cart);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        dispatch(closeModal());
        dispatch(toggleCartDrawer());
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleQtyChange = (
    productId: string,
    variantId: string | undefined,
    currentQty: number,
    change: number,
  ) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    dispatch(updateQuantity({ productId, variantId, quantity: newQty }));
  };

  const handleCheckout = () => {
    dispatch(toggleCartDrawer());
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        ref={drawerRef}
        className="w-full max-w-md h-full bg-surface border-l border-border flex flex-col shadow-overlay animate-slide-left"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <ShoppingBag className="h-5 w-5 text-primary-500" />
            <span>Shopping Cart ({items.length})</span>
          </div>
          <button
            onClick={() => dispatch(toggleCartDrawer())}
            className="p-2 -mr-2 rounded-full hover:bg-surface-secondary text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-surface-secondary flex items-center justify-center text-muted">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  Your cart is empty
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add items to get started!
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => dispatch(toggleCartDrawer())}
                className="rounded-full px-6"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || ""}`}
                className="flex gap-4 p-3 rounded-xl border border-border bg-surface-secondary transition-all hover:border-border-hover"
              >
                {/* Product Image */}
                <div className="h-20 w-20 rounded-lg overflow-hidden border bg-white flex-shrink-0 flex items-center justify-center">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-muted" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {item.name}
                    </h4>
                    {item.variantLabel && (
                      <span className="inline-block text-[11px] font-medium text-muted-foreground uppercase bg-surface border px-2 py-0.5 rounded-full">
                        {item.variantLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-border rounded-lg bg-surface">
                      <button
                        onClick={() =>
                          handleQtyChange(
                            item.productId,
                            item.variantId,
                            item.quantity,
                            -1,
                          )
                        }
                        className="p-1 hover:bg-surface-secondary text-muted-foreground hover:text-foreground rounded-l-lg transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-foreground w-8 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQtyChange(
                            item.productId,
                            item.variantId,
                            item.quantity,
                            1,
                          )
                        }
                        className="p-1 hover:bg-surface-secondary text-muted-foreground hover:text-foreground rounded-r-lg transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Price and delete */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              productId: item.productId,
                              variantId: item.variantId,
                            }),
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-error-50 text-muted-foreground hover:text-error-500 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-surface space-y-4">
            <div className="flex items-center justify-between text-base font-bold text-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and discounts are calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => dispatch(closeModal())}
                className="w-full py-3"
              >
                View Cart
              </Button>
              <Button
                variant="primary"
                onClick={handleCheckout}
                className="w-full py-3 gap-1.5"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
