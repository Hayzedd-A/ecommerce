# Ecommerce Platform — Implementation Plan

A production-ready, reusable single-tenant ecommerce platform for small businesses, built with **Next.js 16.2.6**, **Tailwind CSS 4**, **TypeScript**, **MongoDB/Mongoose**, and **Monnify payments**.

---

## User Review Required

> [!IMPORTANT]
> **Phased Delivery**: This is a massive project (~150+ files). I'll build it in **8 phases**, each producing a working increment. Please confirm you're OK with this phased approach, or if you'd like to prioritize specific phases.

> [!WARNING]
> **Monnify Credentials**: You'll need a Monnify sandbox account (API Key, Secret Key, Contract Code) and IP whitelisting to test payments. I'll build the integration layer regardless, but live testing requires these.

> [!IMPORTANT]
> **MongoDB**: The plan assumes you have a MongoDB instance (local or Atlas). I'll use environment variables for the connection string.

---

## Open Questions

1. **Dark mode**: Should dark mode be toggle-based (user preference) or system-preference-based? The instructions mention dark mode as a bonus — I'll default to **toggle-based** with system preference as the initial value.
2. **Email provider**: For email notifications (order confirmation, password reset), which provider? I'll default to **Nodemailer with SMTP** (works with Gmail, SendGrid, etc.) unless you prefer a specific one.
3. **WhatsApp notifications**: Should this use the **WhatsApp Business API** (requires Meta business verification) or a simpler approach like generating `wa.me` links for order summaries? I'll default to **wa.me deep links** for MVP.
4. **Admin seeding**: Should I create a CLI seed script, or an initial admin registration endpoint? I'll default to **seed script**.

---

## Next.js 16 & Tailwind 4 Specific Features Used

| Feature | Usage |
|---|---|
| `proxy.ts` (replaces middleware.ts) | Auth token verification, route protection, admin role checking |
| `"use cache"` directive | Product listings, categories, store settings, static pages |
| `cacheLife()` / `cacheTag()` | TTL-based cache profiles + on-demand revalidation |
| React 19.2 View Transitions | Page transitions, product detail animations |
| `<Activity />` component | Cart drawer, search overlay (hidden but preserving state) |
| React Compiler (auto-memoization) | Enabled project-wide, no manual `useMemo`/`useCallback` needed |
| Tailwind 4 `@theme` directive | Design tokens defined in CSS (no `tailwind.config.js`) |
| Tailwind 4 `@import "tailwindcss"` | Single import replaces old `@tailwind` directives |
| Tailwind 4 `@theme inline` | Runtime CSS custom properties for dynamic theme colors |
| Async `params`/`searchParams` | All dynamic routes use `async` pattern (Next.js 16 requirement) |

---

## Project Folder Structure

```
/
├── app/
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/[token]/page.tsx
│   │
│   ├── (storefront)/              # Public storefront route group
│   │   ├── layout.tsx             # Storefront layout (nav + footer)
│   │   ├── page.tsx               # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx           # Product listing
│   │   │   └── [slug]/page.tsx    # Product detail
│   │   ├── categories/
│   │   │   └── [slug]/page.tsx    # Category listing
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── order-success/[id]/page.tsx
│   │   └── account/
│   │       ├── layout.tsx         # Account sidebar layout
│   │       ├── page.tsx           # Profile
│   │       ├── orders/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── addresses/page.tsx
│   │       ├── wishlist/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── admin/                     # Admin dashboard
│   │   ├── layout.tsx             # Admin layout (sidebar + topbar)
│   │   ├── page.tsx               # Dashboard analytics
│   │   ├── products/
│   │   │   ├── page.tsx           # Product list
│   │   │   ├── new/page.tsx       # Create product
│   │   │   └── [id]/edit/page.tsx # Edit product
│   │   ├── categories/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── users/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── banners/page.tsx
│   │   ├── coupons/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/
│   │       ├── page.tsx           # Store settings
│   │       ├── delivery/page.tsx
│   │       ├── payments/page.tsx
│   │       └── seo/page.tsx
│   │
│   ├── api/                       # API routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── products/
│   │   │   ├── route.ts           # GET (list), POST (create)
│   │   │   ├── [id]/route.ts      # GET, PUT, DELETE
│   │   │   └── [id]/reviews/route.ts
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── payments/
│   │   │   ├── initialize/route.ts
│   │   │   ├── verify/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── me/route.ts
│   │   ├── cart/route.ts
│   │   ├── wishlist/route.ts
│   │   ├── coupons/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── validate/route.ts
│   │   ├── banners/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── reviews/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── notifications/route.ts
│   │   ├── settings/route.ts
│   │   └── upload/route.ts        # Cloudinary upload
│   │
│   ├── globals.css                # Tailwind 4 theme + design system
│   ├── layout.tsx                 # Root layout
│   └── not-found.tsx
│
├── components/
│   ├── ui/                        # Base design system
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   ├── Pagination.tsx
│   │   ├── DataTable.tsx
│   │   ├── DropdownMenu.tsx
│   │   ├── Avatar.tsx
│   │   ├── Tabs.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ImageUploader.tsx
│   │
│   ├── storefront/                # Storefront-specific components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroBanner.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductImageGallery.tsx
│   │   ├── ProductVariantSelector.tsx
│   │   ├── ProductReviews.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── SearchOverlay.tsx
│   │   ├── ProductCarousel.tsx
│   │   ├── SocialShareButtons.tsx
│   │   ├── QuantitySelector.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── StarRating.tsx
│   │   └── CheckoutForm.tsx
│   │
│   ├── admin/                     # Admin-specific components
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── SalesChart.tsx
│   │   ├── RecentOrders.tsx
│   │   ├── ProductForm.tsx
│   │   ├── CategoryForm.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── CouponForm.tsx
│   │   ├── BannerForm.tsx
│   │   └── SettingsForm.tsx
│   │
│   └── providers/                 # Context providers
│       ├── StoreProvider.tsx       # Redux provider
│       ├── QueryProvider.tsx       # TanStack Query provider
│       └── ThemeProvider.tsx       # Dark mode provider
│
├── lib/
│   ├── db/
│   │   ├── connect.ts             # MongoDB connection
│   │   └── models/                # Mongoose models
│   │       ├── User.ts
│   │       ├── Admin.ts
│   │       ├── Role.ts
│   │       ├── Product.ts
│   │       ├── ProductVariant.ts
│   │       ├── Category.ts
│   │       ├── Tag.ts
│   │       ├── Order.ts
│   │       ├── OrderItem.ts
│   │       ├── Payment.ts
│   │       ├── Review.ts
│   │       ├── Wishlist.ts
│   │       ├── Coupon.ts
│   │       ├── Notification.ts
│   │       ├── StoreSettings.ts
│   │       ├── Banner.ts
│   │       ├── Address.ts
│   │       └── index.ts           # Barrel export
│   │
│   ├── store/                     # Redux store
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── cartSlice.ts
│   │       ├── authSlice.ts
│   │       ├── uiSlice.ts         # Modals, drawers, theme
│   │       └── wishlistSlice.ts
│   │
│   ├── api/                       # API client utilities
│   │   ├── client.ts              # Axios/fetch wrapper
│   │   └── endpoints.ts           # API endpoint constants
│   │
│   ├── queries/                   # TanStack Query hooks
│   │   ├── useProducts.ts
│   │   ├── useCategories.ts
│   │   ├── useOrders.ts
│   │   ├── useUsers.ts
│   │   ├── useReviews.ts
│   │   ├── useBanners.ts
│   │   ├── useCoupons.ts
│   │   ├── useNotifications.ts
│   │   └── useSettings.ts
│   │
│   ├── services/                  # Business logic services
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   ├── payment/
│   │   │   ├── paymentManager.ts  # Abstract payment interface
│   │   │   ├── monnify.provider.ts
│   │   │   └── types.ts
│   │   ├── email.service.ts
│   │   ├── upload.service.ts      # Cloudinary
│   │   └── notification.service.ts
│   │
│   ├── validators/                # Zod schemas
│   │   ├── auth.schema.ts
│   │   ├── product.schema.ts
│   │   ├── order.schema.ts
│   │   ├── category.schema.ts
│   │   ├── coupon.schema.ts
│   │   ├── review.schema.ts
│   │   ├── settings.schema.ts
│   │   └── common.schema.ts
│   │
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   ├── formatters.ts          # Currency, date, etc.
│   │   ├── slugify.ts
│   │   └── jwt.ts                 # JWT helpers
│   │
│   └── types/
│       ├── index.ts               # Shared TypeScript types
│       ├── api.types.ts           # API response types
│       └── models.types.ts        # Model interface types
│
├── proxy.ts                       # Next.js 16 proxy (replaces middleware.ts)
├── scripts/
│   └── seed.ts                    # Database seed script
├── .env.example                   # Environment variable template
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## Proposed Changes

### Phase 1 — Foundation & Configuration

Set up the project foundation, install all dependencies, configure Next.js 16 features, and establish the design system.

#### [MODIFY] [package.json](file:///home/zeddhub/Desktop/personal-project/--ecommerce/package.json)
Install all required dependencies:
- **State**: `@reduxjs/toolkit`, `react-redux`
- **Server state**: `@tanstack/react-query`
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Database**: `mongoose`
- **Auth**: `bcryptjs`, `jsonwebtoken`, `jose` (for Edge-compatible JWT in proxy.ts)
- **Upload**: `cloudinary`
- **Payments**: `axios` (for Monnify API calls)
- **Email**: `nodemailer`
- **UI utilities**: `clsx`, `class-variance-authority`, `lucide-react` (icons), `recharts` (charts), `embla-carousel-react` (carousels), `react-hot-toast`
- **Dev**: `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/nodemailer`, `tsx` (for seed script)

#### [MODIFY] [next.config.ts](file:///home/zeddhub/Desktop/personal-project/--ecommerce/next.config.ts)
- Enable React Compiler
- Enable `cacheComponents`
- Configure `images.remotePatterns` for Cloudinary
- Set `serverExternalPackages` for `mongoose`, `bcryptjs`

#### [MODIFY] [globals.css](file:///home/zeddhub/Desktop/personal-project/--ecommerce/app/globals.css)
Complete Tailwind 4 design system using `@theme` directive:
- Color palette (primary, secondary, accent, neutral, success, warning, error)
- Typography scale
- Spacing & border radius tokens
- Dark mode CSS variables
- Animation keyframes
- Component base styles

#### [NEW] [proxy.ts](file:///home/zeddhub/Desktop/personal-project/--ecommerce/proxy.ts)
Route protection using `jose` (Edge-compatible JWT verification):
- Protect `/account/*` routes (require auth)
- Protect `/admin/*` routes (require admin role)
- Redirect unauthenticated users to `/login`
- Redirect non-admin users away from admin routes
- Pass user info via request headers to downstream pages

#### [NEW] `.env.example`
Template with all required environment variables.

---

### Phase 2 — Database Models & Services

#### [NEW] `lib/db/connect.ts`
MongoDB connection with caching (reuse connection in development).

#### [NEW] `lib/db/models/*.ts` (18 models)

| Model | Key Fields | Indexes |
|---|---|---|
| **User** | name, email, password, phone, role, isActive | email (unique), phone |
| **Admin** | userId (ref), permissions, lastLogin | userId (unique) |
| **Role** | name, permissions[], description | name (unique) |
| **Product** | name, slug, description, price, discountPrice, sku, category, subcategory, tags[], images[], isFeatured, isSponsored, stock, lowStockThreshold, status, seoMeta, specs, weight, dimensions, avgRating, reviewCount | slug (unique), category, price, isFeatured, text search on name+description |
| **ProductVariant** | productId, type (color/size/material), value, price, stock, images[] | productId + type + value (compound unique) |
| **Category** | name, slug, description, image, parent (self-ref), isActive, order | slug (unique), parent |
| **Tag** | name, slug | slug (unique) |
| **Order** | userId, orderNumber, items[], shippingAddress, status, subtotal, deliveryFee, discount, total, couponUsed, paymentId, notes | orderNumber (unique), userId, status, createdAt |
| **OrderItem** | orderId, productId, variantId, name, price, quantity, image | orderId |
| **Payment** | orderId, userId, reference, provider, amount, status, metadata, webhookVerified | reference (unique), orderId, status |
| **Review** | productId, userId, rating, title, comment, isApproved | productId + userId (compound unique), isApproved |
| **Wishlist** | userId, productId | userId + productId (compound unique) |
| **Coupon** | code, type (percentage/fixed), value, minPurchase, maxUses, usedCount, expiresAt, isActive | code (unique) |
| **Notification** | userId, type, title, message, isRead, metadata | userId, isRead, createdAt |
| **StoreSettings** | storeName, logo, description, address, phone, email, socialLinks, businessHours, seoMeta, themeColors, deliverySettings, paymentSettings | Singleton pattern |
| **Banner** | title, image, link, productId, type (hero/sponsored), order, isActive | type, isActive, order |
| **Address** | userId, label, fullName, phone, street, city, state, country, isDefault | userId |

#### [NEW] `lib/services/payment/paymentManager.ts`
Abstract payment interface (`PaymentProvider`) with methods: `initialize()`, `verify()`, `handleWebhook()`, `requery()`. Factory pattern to instantiate the configured provider.

#### [NEW] `lib/services/payment/monnify.provider.ts`
Concrete Monnify implementation:
- OAuth2 token management
- Payment initialization
- Payment verification
- Webhook hash verification
- Transaction re-query

#### [NEW] `lib/services/auth.service.ts`
JWT management (access + refresh tokens), password hashing, token verification.

#### [NEW] `lib/services/upload.service.ts`
Cloudinary upload/delete with folder organization.

#### [NEW] `lib/services/email.service.ts`
Nodemailer with HTML email templates for order confirmation, password reset, etc.

#### [NEW] `lib/validators/*.ts`
Zod schemas for all API inputs.

#### [NEW] `lib/utils/*.ts`
Helpers, formatters (currency ₦, dates), slug generator, JWT utilities, constants.

#### [NEW] `lib/types/*.ts`
Shared TypeScript interfaces and API response types.

---

### Phase 3 — Authentication System

#### [NEW] API routes: `api/auth/login`, `register`, `refresh`, `logout`, `forgot-password`, `reset-password`
- JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Password hashing with bcryptjs (12 rounds)
- Rate limiting on login/register
- Input validation with Zod

#### [NEW] Auth pages: `(auth)/login`, `register`, `forgot-password`, `reset-password/[token]`
- React Hook Form + Zod validation
- Loading states, error handling
- Redirect on success
- Clean, modern UI with animations

#### [NEW] `lib/store/slices/authSlice.ts`
Redux slice for client-side auth state (user info, isAuthenticated).

#### [NEW] `components/providers/StoreProvider.tsx`
Redux provider using `makeStore()` pattern for SSR safety.

#### [NEW] `components/providers/QueryProvider.tsx`
TanStack Query provider.

---

### Phase 4 — Admin Dashboard

#### [NEW] `app/admin/layout.tsx`
Admin layout with collapsible sidebar, topbar with notifications, and breadcrumbs.

#### [NEW] `app/admin/page.tsx` — Dashboard
- Stats cards (total sales, revenue, orders, customers)
- Sales chart (recharts)
- Recent orders table
- Low stock alerts
- Uses `"use cache"` for analytics data with short TTL

#### [NEW] Admin CRUD pages for:
- **Products**: List with search/filter/pagination, create/edit form with multi-image uploader, variant manager
- **Categories**: Tree view with drag-and-drop ordering, create/edit modal
- **Orders**: List with status filters, detail view with status update, invoice print
- **Payments**: Transaction list with status badges, re-query button
- **Users**: List with search, suspend toggle, order history view
- **Reviews**: Moderation queue with approve/delete actions
- **Banners**: Upload with product linking, ordering, enable/disable
- **Coupons**: Create/edit with all fields, usage tracking
- **Settings**: Store info, delivery zones, payment config, SEO, theme colors

#### [NEW] Admin API routes for all CRUD operations
With role-based authorization, pagination, filtering, search.

#### [NEW] Admin components
`AdminSidebar`, `AdminTopbar`, `DashboardStats`, `SalesChart`, `RecentOrders`, `ProductForm`, etc.

---

### Phase 5 — Public Storefront

#### [NEW] `app/(storefront)/layout.tsx`
Storefront layout with responsive navbar (search, cart, user menu) and configurable footer.

#### [NEW] `app/(storefront)/page.tsx` — Homepage
- Hero banner slider (embla-carousel)
- Featured products carousel
- Sponsored products section
- Category grid
- New arrivals
- Best sellers
- Recently viewed (client-side, localStorage)
- Uses `"use cache"` with `cacheTag()` for revalidation

#### [NEW] Product pages
- **Listing**: Grid/list toggle, search, sort, filters (category, price range, rating, availability), pagination
- **Detail**: Image gallery with zoom, variant selector, quantity selector, add to cart, add to wishlist, reviews section, related products, social share, stock status

#### [NEW] Account pages
- Profile edit (React Hook Form)
- Order history with status timeline
- Address management (CRUD)
- Wishlist

#### [NEW] Storefront components
`Navbar`, `Footer`, `ProductCard`, `ProductGrid`, `HeroBanner`, `SearchOverlay`, `CartDrawer`, etc.

---

### Phase 6 — Cart, Checkout & Payments

#### [NEW] `lib/store/slices/cartSlice.ts`
Redux cart state: items (variant-aware), quantities, subtotal, delivery fee, coupon, total.

#### [NEW] `app/(storefront)/cart/page.tsx`
Full cart page with item management, quantity update, coupon application, totals.

#### [NEW] `app/(storefront)/checkout/page.tsx`
Multi-step checkout:
1. Shipping info (address form or saved address selection)
2. Delivery method & fee calculation
3. Order summary
4. Monnify payment initiation (JS SDK on frontend + API verification on backend)

#### [NEW] `app/(storefront)/order-success/[id]/page.tsx`
Order confirmation with summary, order number, and WhatsApp share link.

#### [NEW] Payment API routes
- `api/payments/initialize` — Create payment on Monnify, return checkout URL
- `api/payments/verify` — Verify payment status after callback
- `api/payments/webhook` — Monnify webhook endpoint with hash verification + idempotency

---

### Phase 7 — Notifications & Email

#### [NEW] `lib/services/notification.service.ts`
- In-app notifications (stored in DB)
- Email notifications (Nodemailer)
- WhatsApp deep links for order summaries

#### [NEW] API routes for notifications
- List notifications (paginated)
- Mark as read
- Admin: new order, failed payment, low stock alerts
- Customer: payment success, order status updates

---

### Phase 8 — Polish & Bonus Features

#### Dark mode
- `ThemeProvider` with localStorage persistence
- Toggle in navbar and admin sidebar
- Full dark mode Tailwind classes throughout

#### Recently viewed products
- LocalStorage-based tracking
- Display section on homepage and product pages

#### Performance
- `"use cache"` on product listings, categories, store settings
- Image optimization via Next.js `<Image>` + Cloudinary transformations
- Lazy loading for below-fold content
- Skeleton loaders on all data-fetching pages

#### SEO
- Dynamic `generateMetadata()` on all pages
- OpenGraph images
- Structured data (JSON-LD) for products
- Sitemap generation

#### Seed Script
- `scripts/seed.ts` with sample products, categories, admin user, store settings

#### Bonus features
- Invoice generation (HTML-to-print)
- Admin activity logs
- Product import/export (CSV)
- Sales report export
- Multi-image drag-and-drop uploader

---

## Verification Plan

### Automated Tests
```bash
# TypeScript compilation
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build

# Seed script
npx tsx scripts/seed.ts
```

### Browser Testing
- Verify storefront homepage renders with all sections
- Test product listing filtering, search, pagination
- Test product detail page with variant selection
- Test cart flow (add, update, remove)
- Test checkout flow (up to payment initiation)
- Test admin dashboard with charts and stats
- Test admin CRUD for products, categories, orders
- Test auth flow (register, login, logout, password reset)
- Test responsive design on mobile/tablet/desktop viewports
- Test dark mode toggle

### Manual Verification
- Confirm MongoDB connection and data persistence
- Verify Monnify sandbox payment flow (requires credentials)
- Verify Cloudinary image upload (requires credentials)
- Verify email sending (requires SMTP credentials)
- Test admin role protection (non-admin cannot access admin routes)
