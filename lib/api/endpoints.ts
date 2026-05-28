/* ============================================== */
/*  API endpoint constants                         */
/* ============================================== */

export const ENDPOINTS = {
  /* Auth */
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    ME: "/users/me",
  },

  /* Products */
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id: string) => `/products/${id}`,
    REVIEWS: (id: string) => `/products/${id}/reviews`,
  },

  /* Categories */
  CATEGORIES: {
    LIST: "/categories",
    DETAIL: (id: string) => `/categories/${id}`,
  },

  /* Orders */
  ORDERS: {
    LIST: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
  },

  /* Payments */
  PAYMENTS: {
    INITIALIZE: "/payments/initialize",
    VERIFY: "/payments/verify",
    LIST: "/payments",
  },

  /* Users */
  USERS: {
    LIST: "/users",
    DETAIL: (id: string) => `/users/${id}`,
    ME: "/users/me",
  },

  /* Cart (server-side persistence) */
  CART: "/cart",

  /* Wishlist */
  WISHLIST: "/wishlist",

  /* Coupons */
  COUPONS: {
    LIST: "/coupons",
    DETAIL: (id: string) => `/coupons/${id}`,
    VALIDATE: "/coupons/validate",
  },

  /* Reviews */
  REVIEWS: {
    LIST: "/reviews",
    DETAIL: (id: string) => `/reviews/${id}`,
  },

  /* Banners */
  BANNERS: {
    LIST: "/banners",
    DETAIL: (id: string) => `/banners/${id}`,
  },

  /* Notifications */
  NOTIFICATIONS: "/notifications",

  /* Settings */
  SETTINGS: "/settings",

  /* Upload */
  UPLOAD: "/upload",
} as const;
