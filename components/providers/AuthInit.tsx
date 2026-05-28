"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { setUser, clearUser, setLoading } from "@/lib/store/slices/authSlice";
import apiClient from "@/lib/api/client";

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiClient.get("/users/me");
        if (response.data?.success && response.data?.data) {
          dispatch(setUser(response.data.data));
        } else {
          dispatch(clearUser());
        }
      } catch (error) {
        dispatch(clearUser());
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkSession();
  }, [dispatch]);

  return <>{children}</>;
}
