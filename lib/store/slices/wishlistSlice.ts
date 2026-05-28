import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface WishlistState {
  items: string[]; // Array of product IDs
  isLoading: boolean;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<string>) {
      if (state.items.includes(action.payload)) {
        state.items = state.items.filter((id) => id !== action.payload);
      } else {
        state.items.push(action.payload);
      }
    },

    removeFromWishlist(state, action: PayloadAction<string>) {
      state.items = state.items.filter((id) => id !== action.payload);
    },

    setWishlist(state, action: PayloadAction<string[]>) {
      state.items = action.payload;
    },

    clearWishlist(state) {
      state.items = [];
    },

    setWishlistLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  toggleWishlist,
  removeFromWishlist,
  setWishlist,
  clearWishlist,
  setWishlistLoading,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
