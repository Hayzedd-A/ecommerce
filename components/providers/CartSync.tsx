"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { syncCart, fetchCart } from "@/lib/store/slices/cartSlice";
import { fetchWishlist } from "@/lib/store/slices/wishlistSlice";

export default function CartSync() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const isFirstRender = useRef(true);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchWishlist());
  }, [dispatch]);

  // Sync on change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      dispatch(syncCart(items));
    }, 1000); // Debounce sync

    return () => clearTimeout(timer);
  }, [items, dispatch]);

  return null;
}
