# SMA Fuel & Market

A gas station convenience store e-commerce platform. Customers browse departments,
buy from daily deals, and track orders; store staff manage the catalogue,
inventory, orders, promotions and reporting from an admin dashboard.

**Phase 1 (this repo) is the storefront**, running on a local catalogue. The
NestJS API, PostgreSQL database, Redis cache and Cloudinary image hosting are
Phase 2 — see [Roadmap](#roadmap).

## Requirements

**Node.js 20.9 or newer** (Next 16 requires it). `npm` is installed as part of
Node — if your terminal reports `npm: command not found` or `'npm' is not
recognized`, Node is not installed yet. Get the LTS build from
[nodejs.org](https://nodejs.org), or on Windows:

```powershell
winget install OpenJS.NodeJS.LTS
```

Close and reopen your terminal (and VS Code) after installing — `PATH` only
refreshes in newly started processes.

```bash
node -v            # v20.9.0 or higher
npm -v
```

On Windows, if `npm run dev` fails with *"running scripts is disabled on this
system"*, PowerShell's execution policy is blocking npm's script wrapper:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the production build
```

## The delivery radius

This is the rule the storefront is built around. Browsing is open to everyone;
**ordering requires a verified position inside the delivery radius**.

1. On the first visit the browser is asked for location permission.
2. Coordinates are compared against each store using the Haversine formula
   (`src/lib/store-location.ts`).
3. Inside the radius (2 miles), ordering is enabled.
4. Outside it, the catalogue stays fully browsable but Add to Cart and checkout
   are disabled, and a banner explains why.

Anything that leaves us unable to verify the position — permission denied, an
unsupported browser, a lookup failure — falls back to **cannot order** rather
than quietly permitting checkout. The result is cached in `localStorage` so
returning visitors are not re-prompted on every page.

The comparison runs on the device; coordinates are never transmitted.

`AddToCartButton` is the single choke point for this rule, so a surface that
forgets to check it cannot accidentally bypass the gate. The banner offers
**Simulate an in-range address** so the ordering flow can be demonstrated from
anywhere.

`stores` is already an array and `nearestStore()` picks the closest location, so
adding branches is a data change rather than a code change.

## Routes

**Public** — `/` home, `/shop`, `/departments`, `/department/[slug]` (9),
`/product/[id]` (36), `/deals`, `/about`, `/contact`, `/faqs`

**Customer** — `/signin`, `/register`, `/profile`, `/addresses`, `/wishlist`,
`/cart`, `/checkout`, `/orders`, `/notifications`, `/settings`

**Admin** — `/admin` dashboard, `/admin/products`, `/admin/inventory`,
`/admin/orders`, `/admin/customers`, `/admin/deals`, `/admin/reports`

## How it's put together

```
src/
  app/            routes (App Router); admin/ has its own layout
  components/     Header, HeroCarousel, ProductCard, ResultsBrowser,
                  DeliveryBanner, ProductArt, admin/Ui …
  lib/
    catalog.ts        departments, categories, brands, products, search/sort
    deals.ts          flash/BOGO/percent/weekend deals and coupon validation
    store-location.ts store coordinates, Haversine, nearest-store selection
    delivery.tsx      geolocation context and the ordering gate
    cart.tsx          cart, wishlist and order state (localStorage-backed)
    orders.ts         order types and lifecycle constants
    analytics.ts      admin reporting figures derived from the catalogue
```

**Order constants live in `orders.ts`, not `cart.tsx`.** `cart.tsx` is a
`"use client"` module, and a runtime value imported from a client module into a
server component arrives as a client-reference stub rather than the real value —
an array imported that way is not an array and fails at prerender. Shared
constants therefore sit in a plain module both sides can import.

**Cart state** is a reducer behind React context, persisted to `localStorage`. A
`hydrated` flag keeps the server render and first client paint in agreement.
Quantities are capped at each product's stock, and lines referencing products no
longer in the catalogue are dropped on load.

**Product imagery** is drawn inline as SVG (`components/ProductArt.tsx`) — 42
glyphs across the store's departments — so the catalogue renders identically
offline with no third-party requests. This is the seam where Cloudinary takes
over in Phase 2: products gain an `images[]` field and this component becomes the
fallback for items without a photograph.

**Admin figures** are derived deterministically from the catalogue via a seeded
hash, so the same product always contributes the same numbers and the dashboard
does not jitter between renders. Each function in `analytics.ts` maps to one
future API endpoint.

## Age-restricted items

Tobacco products carry `ageRestricted`, which propagates through the whole flow:
a warning on the product card and detail page, a banner on the department, a
required confirmation at checkout that blocks order placement until ticked, and a
note on the order that ID is required at handover.

## Roadmap

Phase 1 (done) is the storefront on local data. Phase 2 replaces the data layer:

| Area | Now | Phase 2 |
| --- | --- | --- |
| Data | `src/lib/catalog.ts` | PostgreSQL via NestJS REST API |
| Auth | UI only | JWT, with roles for customer and staff |
| Images | Inline SVG | Cloudinary, SVG as fallback |
| Caching | none | Redis for catalogue and session data |
| Admin writes | Read-only UI | Full CRUD against the API |

Entities planned for the schema: Users, Roles, Products, Product Images,
Categories, Departments, Brands, Inventory, Orders, Order Items, Addresses,
Coupons, Daily Deals, Reviews, Wishlist, Cart, Payments, Notifications, Banners,
Store Locations.

## Styling

Tailwind CSS v4, configured through `@theme` in `src/app/globals.css`. Element
defaults live in `@layer base` — Tailwind v4 emits utilities inside a cascade
layer, and unlayered rules beat layered ones regardless of specificity, so an
unlayered `a { color: inherit }` would override every text-colour utility
applied to a link.

## Notes

This is a front-end storefront: the catalogue is static data, there is no payment
processing or order fulfilment, and admin editing controls are not wired up.
Checkout validates input and records orders locally so the full shopping flow can
be exercised end to end.
