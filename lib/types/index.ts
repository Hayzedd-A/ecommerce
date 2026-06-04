/* ============================================== */
/*  Shared TypeScript types                        */
/* ============================================== */

import { ICategoryDocument } from "../db/models/Category";
import { ICouponDocument } from "../db/models/Coupon";
import { IDeliveryLocationDocument } from "../db/models/DeliveryLocation";
import { IProductDocument } from "../db/models/Product";
import { IProductVariantDocument } from "../db/models/ProductVariant";
import { IStoreSettingsDocument } from "../db/models/StoreSettings";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

/* ---------- User ---------- */

export type UserRole = "customer" | "admin" | "staff";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAdmin {
  _id: string;
  userId: string | IUser;
  permissions: string[];
  lastLogin?: string;
}

/* ---------- Product ---------- */

export type ProductStatus = "active" | "draft" | "archived";
export type VariantType = "color" | "size" | "material";

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  order: number;
}

export interface ISeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface IProductSpecs {
  [key: string]: string;
}

export interface IProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: "cm" | "in";
}

export type IProduct = Omit<IProductDocument, "_id"> & {
  _id: string;
  variants?: IProductVariant[];
  category: ICategoryDocument;
};

export type IProductVariant = Omit<IProductVariantDocument, "_id"> & {
  _id: string;
  images: IProductImage[];
};

/* ---------- Category ---------- */

export type ICategory = Omit<ICategoryDocument, "_id"> & {
  _id: string;
  image: IProductImage;
  children?: ICategory[];
};

/* ---------- Order ---------- */

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export interface IOrderItem {
  _id: string;
  productId: string | IProduct;
  variantId?: string | IProductVariant;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder {
  _id: string;
  userId?: string | IUser;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponUsed?: string;
  paymentId?: string | IPayment;
  notes?: string;
  isGuest: boolean;
  guestEmail?: string;
  guestPhone?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Payment ---------- */

export type PaymentStatus =
  | "initialized"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "reversed";

export interface IPayment {
  _id: string;
  orderId: string | IOrder;
  userId?: string;
  reference: string;
  provider: string;
  amount: number;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  webhookVerified: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Review ---------- */

export interface IReview {
  _id: string;
  productId: string | IProduct;
  userId: string | IUser;
  rating: number;
  title?: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Coupon ---------- */

export type CouponType = "percentage" | "fixed";

export type ICoupon = Omit<
  Omit<ICouponDocument, "_id">,
  "startsAt" | "expiresAt" | "orders"
> & {
  _id: string;
  startsAt?: string;
  expiresAt?: string;
  orders: IOrder[];
};

/* ---------- Banner ---------- */

export type BannerType = "hero" | "sponsored";

export interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  image: IProductImage;
  link?: string;
  productId?: string | IProduct;
  type: BannerType;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Address ---------- */

export interface IAddress {
  _id: string;
  userId?: string;
  label?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

/* ---------- Notification ---------- */

export type NotificationType =
  | "order_new"
  | "order_status"
  | "payment_success"
  | "payment_failed"
  | "low_stock"
  | "review_new"
  | "general";

export interface INotification {
  _id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Store Settings ---------- */

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface IBusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IDeliveryZone {
  name: string;
  fee: number;
  estimatedDays?: string;
}

export interface IThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

export type IStoreSettings = Omit<IStoreSettingsDocument, "_id"> & {
  _id: string;
};

/* ---------- Cart (client-side) ---------- */

export interface ICartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
  variantLabel?: string;
}

export interface ICartState {
  items: ICartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
}

/* --------------- Delivery location (client-side)------------------- */

export type IDeliveryLocation = Omit<IDeliveryLocationDocument, "_id"> & {
  _id: string;
};
