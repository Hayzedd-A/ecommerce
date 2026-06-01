import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/lib/api/client";

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async () => {
  const response = await apiClient.get("/wishlist");
  return response.data.data;
});

export const toggleWishlistServer = createAsyncThunk(
  "wishlist/toggleWishlistServer",
  async (productId: string) => {
    const response = await apiClient.post("/wishlist", { productId });
    return { productId, action: response.data.action };
  }
);

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
  extraReducers: (builder) => {
    builder.addCase(fetchWishlist.fulfilled, (state, action) => {
      state.items = action.payload;
    });
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
