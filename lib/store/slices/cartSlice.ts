import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ICartItem } from "@/lib/types";

interface CartState {
  items: ICartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  couponCode: null,
  total: 0,
};

function recalculate(state: CartState) {
  state.subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  state.total = state.subtotal + state.deliveryFee - state.discount;
  if (state.total < 0) state.total = 0;
}

/**
 * Generate a unique key for a cart item (product + variant combo).
 */
function cartItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}_${variantId}` : productId;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<ICartItem>) {
      const item = action.payload;
      const key = cartItemKey(item.productId, item.variantId);
      const existing = state.items.find(
        (i) => cartItemKey(i.productId, i.variantId) === key
      );

      if (existing) {
        const newQty = existing.quantity + item.quantity;
        existing.quantity = Math.min(newQty, existing.stock);
      } else {
        state.items.push({ ...item, quantity: Math.min(item.quantity, item.stock) });
      }
      recalculate(state);
    },

    removeFromCart(
      state,
      action: PayloadAction<{ productId: string; variantId?: string }>
    ) {
      const { productId, variantId } = action.payload;
      const key = cartItemKey(productId, variantId);
      state.items = state.items.filter(
        (i) => cartItemKey(i.productId, i.variantId) !== key
      );
      recalculate(state);
    },

    updateQuantity(
      state,
      action: PayloadAction<{
        productId: string;
        variantId?: string;
        quantity: number;
      }>
    ) {
      const { productId, variantId, quantity } = action.payload;
      const key = cartItemKey(productId, variantId);
      const item = state.items.find(
        (i) => cartItemKey(i.productId, i.variantId) === key
      );
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock));
      }
      recalculate(state);
    },

    setDeliveryFee(state, action: PayloadAction<number>) {
      state.deliveryFee = action.payload;
      recalculate(state);
    },

    applyCoupon(
      state,
      action: PayloadAction<{ code: string; discount: number }>
    ) {
      state.couponCode = action.payload.code;
      state.discount = action.payload.discount;
      recalculate(state);
    },

    removeCoupon(state) {
      state.couponCode = null;
      state.discount = 0;
      recalculate(state);
    },

    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.deliveryFee = 0;
      state.discount = 0;
      state.couponCode = null;
      state.total = 0;
    },

    /** Hydrate cart from localStorage or server */
    hydrateCart(_state, action: PayloadAction<CartState>) {
      return action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setDeliveryFee,
  applyCoupon,
  removeCoupon,
  clearCart,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;
