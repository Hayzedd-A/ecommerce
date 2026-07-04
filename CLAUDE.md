# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # start dev server on port 3110
npm run build   # production build
npm run start   # serve production build on port 3110
npm run lint    # eslint
```

There is no test suite/framework configured in this repo — don't assume one exists.

## What this is

A generic, single-tenant e-commerce platform (Next.js App Router + MongoDB/Mongoose) meant to be redeployed per-business from the same codebase, with store identity/config (name, currency, payment provider, delivery zones) stored in the DB (`StoreSettings`) rather than hardcoded. `.env` holds one deployment's secrets; `.env.sofiah` is another store's env file — don't merge them.

## Architecture

**Next.js 16 breaking change**: there is no `middleware.ts`. Route protection and auth-context propagation happen in `proxy.ts` at the repo root (the Next 16 replacement). It verifies the `access_token` JWT, redirects based on `protectedPaths`/`adminPaths`/`authPaths` (defined in `lib/api/client.ts`), and forwards `x-user-id`/`x-user-email`/`x-user-role` headers downstream. Check `node_modules/next/dist/docs/` before assuming any Next.js API behaves like a prior version.

**Route groups** under `app/`: `(storefront)` (public site + `/account/*`), `(admin)` (`/admin/*`), `(auth)` (login/register/reset). API routes live under `app/api/**/route.ts`, split into public (`app/api/orders`, `app/api/cart`, ...) and `app/api/admin/**` (admin-only).

**Auth**: JWT access + refresh tokens in httpOnly cookies (`access_token`/`refresh_token`, names in `lib/utils/constants.ts`). `AuthService` (`lib/services/auth.service.ts`) signs/verifies tokens and hashes passwords. `lib/auth/getIdentity.ts` resolves the current identity from either the JWT or an `x-guest-id` header (anonymous guest carts/wishlists, backed by the `Guest` model). `lib/auth/requireAdmin.ts` / `adminGuard()` is the standard guard for admin route handlers. `lib/auth/mergeGuest.ts` reconciles guest orders/cart/wishlist into a user account on login/register.

**Data layer**: `lib/db/connect.ts` caches the Mongoose connection on `global` to survive dev hot-reload — always `await dbConnect()` before model calls in route handlers. Models live in `lib/db/models/*` and are re-exported from `lib/db/models/index.ts`. `StoreSettings` is fetched via `lib/settings.server.ts`'s `getStoreSettings()`, which wraps the DB read in React's `cache()` for server components (auto-creates a default doc if none exists).

**Product variants**: variants can nest arbitrarily deep via `parentVariantId` + `level` on `ProductVariant` (level 0 = root, e.g. Size, then children e.g. Material under a given Size). See `NESTED_VARIANTS_GUIDE.md` for the full model, API contract (`app/api/admin/products/[id]/variants`), and cascade-delete semantics.

**Payments**: pluggable providers behind `PaymentManager` (`lib/services/payment/paymentManager.ts`), a singleton implementing the `PaymentProvider` interface (`lib/services/payment/types.ts`). Currently `monnify.provider.ts`, `paystack.provider.ts`, and `opay.provider.ts`. The active provider and its credentials come from `StoreSettings.paymentSettings` in the DB (`getActivatedProvider()`), not just env vars — env vars are fallback/default config only. Checkout also supports `pay_on_delivery`, `bank_transfer`, and `whatsapp` (see `CheckoutMethod` in `lib/utils/constants.ts`) alongside online gateway payment. OPay's webhook payload carries its `sha512` signature inside the JSON body rather than a header, so `app/api/payments/webhook/route.ts` sniffs the body shape (`sha512` + `payload` fields) to route it, unlike Monnify/Paystack which use a signature header.

**Client state**: Redux Toolkit (`lib/store/`) holds cart/auth/wishlist/UI/notification client state; TanStack Query handles server state/caching in components. `lib/api/client.ts` is an axios instance with: a custom in-memory GET response cache (2 min TTL, bypassable via `{ cache: false }`), automatic `x-guest-id` header injection, and a 401 interceptor that calls `/api/auth/refresh` and retries the original request once before redirecting to `/login`.

**Uploads**: Cloudinary. Admin image uploads go through `app/api/admin/upload`; the storefront/frontend can also upload directly to Cloudinary using signed uploads (`lib/services/upload.service.ts` issues signatures) rather than proxying file bytes through the Next server.

**Path alias**: `@/*` maps to the repo root (see `tsconfig.json`).

## Lint config notes

`eslint.config.mjs` deliberately turns off `react/no-unescaped-entities`, `@typescript-eslint/no-unused-vars`, and `@typescript-eslint/no-explicit-any` on top of `eslint-config-next`'s core-web-vitals + typescript presets — don't re-enable or "fix" violations of these unless asked.
