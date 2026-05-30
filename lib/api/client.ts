/* ============================================== */
/*  API Client — axios wrapper with interceptors   */
/* ============================================== */

import axios from "axios";
import { API_BASE_URL } from "@/lib/utils/constants";

/** Routes that require authentication */
export const protectedPaths = ["/account"];

/** Routes that require admin role */
export const adminPaths = ["/admin"];

/** Routes that authenticated users should NOT see */
export const authPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export const isPublicRoute = (path: string) => {
  return ![...protectedPaths, ...adminPaths].some((p) => path.includes(p));
};

const apiClient = axios.create({
  baseURL: typeof window === "undefined" ? `${API_BASE_URL}/api` : "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies (access/refresh tokens)
});

/** ---------- Response interceptor ---------- */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet → attempt token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !isPublicRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        // Retry original request with new token
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — redirect to login
        const isAuth = authPaths.find((path) =>
          window.location.pathname.includes(path),
        );
        if (typeof window !== "undefined" && !isAuth) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
