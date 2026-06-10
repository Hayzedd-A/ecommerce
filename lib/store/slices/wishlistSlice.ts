import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import apiClient from "@/lib/api/client";

export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async () => {
  const response = await apiClient.get("/wishlist");
  return response.data.data;
});

export const toggleWishlistServer = createAsyncThunk(
  "wishlist/toggleWishlistServer",
  async (product: any) => {
    const response = await apiClient.post("/wishlist", { productId: product._id });
    return { product, action: response.data.action };
  }
);

interface WishlistState {
  items: any[]; // Array of product objects
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
    setWishlist(state, action: PayloadAction<any[]>) {
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
      state.isLoading = false;
    });
    builder.addCase(fetchWishlist.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchWishlist.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(toggleWishlistServer.fulfilled, (state, action) => {
      const { product, action: wishlistAction } = action.payload;
      if (wishlistAction === "added") {
        if (!state.items.find((i) => i._id === product._id)) {
          state.items.push(product);
        }
      } else {
        state.items = state.items.filter((i) => i._id !== product._id);
      }
    });
  },
});

export const {
  setWishlist,
  clearWishlist,
  setWishlistLoading,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
