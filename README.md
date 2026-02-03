# DishLens — Restaurant Menu & Ordering Platform

**Product:** DishLens  
**Company:** ATX Solutions  

Responsive web app + PWA for restaurant menus, table ordering, waiter workflows, and platform (SaaS) management.

---

## Table of contents

- [Technology stack](#technology-stack)
- [High-level architecture](#high-level-architecture)
- [Application modules](#application-modules)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Key routes & functionality](#key-routes--functionality)
- [Developer onboarding](#developer-onboarding)
- [Documentation & change logs](#documentation--change-logs)

---

## Technology stack

| Layer        | Technology |
|-------------|------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **UI**        | React 18, TypeScript |
| **Styling**   | Tailwind CSS |
| **PWA**       | next-pwa (installable app, service worker) |
| **API client** | Fetch + `lib/apiFetch.ts`, `lib/api/*.ts` |
| **State**     | React state, localStorage (cart, order tracking) |

**Backend API:** Separate repo — NestJS + TypeScript + TypeORM + PostgreSQL. See [DishLens API](../dishlens-api) README.

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DishLens Web App (Next.js)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Platform (SaaS)  │  Restaurant Admin  │  Waiter       │  Customer      │
│  /platform/*      │  /r/*              │  /r/waiter/*  │  /m/[slug]     │
│  - Multi-tenant   │  - Menu, orders,   │  - Tables     │  - QR menu     │
│  - Restaurants    │    tables, QR      │  - POS order  │  - Order       │
│  - Plans, audit   │  - Branding        │  - Calls      │  - Call waiter │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DishLens API (NestJS) — localhost:3000                │
│  Auth │ Restaurants │ Menu │ Orders │ Waiters │ Platform │ Public APIs   │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                              PostgreSQL (Supabase or local)
```

- **Frontend:** Next.js app on **port 3001** (configurable).
- **Backend:** NestJS API on **port 3000**; must be running for app to work.
- **Database:** PostgreSQL via `DATABASE_URL` or `DB_*` env vars in the API repo.

---

## Application modules

### 1. Platform (SaaS operator)

**Routes:** `/platform/*`  
**Role:** Platform admin / operator.

- **Dashboard** — Overview of restaurants, plans, usage.
- **Restaurants** — List, create, suspend, activate; view branding & features.
- **Plans** — Subscription plans and features.
- **Audit logs** — Platform-level audit trail.
- **Login** — `POST /auth/login` with platform credentials.

**Code:** `app/platform/`, `components/platform/`, `lib/api/platform.ts`.

---

### 2. Restaurant (restaurant admin / staff)

**Routes:** `/r/*` (after login at `/r/login`)  
**Role:** Restaurant owner or staff (admin, kitchen, etc.).

| Route | Purpose |
|-------|---------|
| `/r/dashboard` | Restaurant home |
| `/r/menu` | Menu categories, items (CRUD), image/video uploads |
| `/r/orders` | Orders list, status, claim |
| `/r/tables` | Table layout, create/edit tables |
| `/r/qr` | Generate QR codes for table ordering |
| `/r/branding` | Logo, hero, theme |
| `/r/ratings` | Menu item ratings |
| `/r/waiters` | Waiter accounts |
| `/r/waiter` | Waiter dashboard (tables, calls, ready orders) |
| `/r/waiter/order` | Waiter POS — create order for a table |

**Code:** `app/r/`, `components/admin/`, `lib/api/admin.ts`, `lib/api/waiter.ts`, `lib/api/kitchen.ts`.

---

### 3. Waiter

**Routes:** `/r/waiter`, `/r/waiter/order`  
**Role:** Waiter (same login as restaurant; role `WAITER` or admin).

- **Waiter dashboard** — Assigned tables, “ready” orders, waiter calls (requested → accept → close).
- **POS** — Select table → menu grid → cart → place order (creates order for that table).

**Code:** `app/r/waiter/`, `app/r/waiter/order/`, `components/staff/WaiterPos.tsx`, `lib/api/waiter.ts`.

---

### 4. Customer (dine-in, QR menu)

**Routes:** `/m/[slug]` (e.g. `/m/demo-restaurant`)  
**Role:** Guest at table (no login).

- **Menu** — Browse by category, search, dish detail (image, price, customize).
- **Cart** — Add items (with modifiers), quantity, then **Place order** (requires table session).
- **Order status** — Track order (e.g. received → preparing → ready → serving → served).
- **Call waiter** — Request waiter; status shows when accepted.

**Entry:** Customer scans QR at table → gets link with `?table=...` (and optional session params). Table session ties device to table for orders and waiter calls.

**Code:** `app/m/`, `components/customer/`, `lib/api/public.ts`, `lib/table.ts`, `lib/cart.ts`, `lib/useCart.ts`.

---

## Run locally

### Prerequisites

- **Node.js** LTS (18 or 20)
- **PostgreSQL** (local or Supabase)
- **DishLens API** repo set up and running (see API README)

### 1. Backend (API)

```bash
cd dishlens-api   # or path to API repo
cp .env.example .env
# Edit .env: DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
npm install
npm run start:dev
```

API: **http://localhost:3000**  
Swagger: **http://localhost:3000/docs**

### 2. Frontend (this app)

```bash
cd dishlens-app   # this repo
cp .env.example .env.local
# Edit .env.local (see Environment variables below)
npm install
npm run dev
```

App: **http://localhost:3001**

### 3. Quick smoke test

1. Open http://localhost:3001
2. Customer menu: http://localhost:3001/m/demo-restaurant (replace `demo-restaurant` with your restaurant slug if different)
3. Restaurant login: http://localhost:3001/r/login
4. Platform login: http://localhost:3001/platform/login (if you have platform users)

---

## Environment variables

Create `.env.local` from `.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE` or `NEXT_PUBLIC_API_BASE_URL` | Backend API URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_RESTAURANT_SLUG` | Default restaurant slug for links (e.g. `demo-restaurant`) |

Example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_RESTAURANT_SLUG=demo-restaurant
```

---

## Key routes & functionality

| Route | Who | Functionality |
|-------|-----|----------------|
| `/` | Anyone | Landing / entry |
| `/m/[slug]` | Customer | QR menu, cart, place order, order status, call waiter |
| `/m/[slug]/order-status` | Customer | Order status page (by orderId + token) |
| `/r/login` | Restaurant | Staff login (JWT) |
| `/r/dashboard` | Restaurant | Dashboard after login |
| `/r/menu` | Restaurant | Menu CRUD |
| `/r/orders` | Restaurant | Orders list & status |
| `/r/tables` | Restaurant | Table layout (drag), create/edit |
| `/r/waiter` | Waiter | Tables, ready orders, waiter calls |
| `/r/waiter/order` | Waiter | POS (table → cart → place order) |
| `/platform/login` | Platform | Platform admin login |
| `/platform/restaurants` | Platform | Restaurant list, suspend, activate |
| `/platform/audit-logs` | Platform | Audit log viewer |

---

## Developer onboarding

1. **Clone and run**
   - Clone API repo + this app repo.
   - Follow [Run locally](#run-locally) for both (API first, then app).
   - Confirm API at http://localhost:3000/docs and app at http://localhost:3001.

2. **Code layout**
   - **`app/`** — Next.js App Router pages and layouts.
   - **`components/`** — React components (`admin/`, `customer/`, `platform/`, `staff/`).
   - **`lib/`** — API client (`api/`, `apiFetch.ts`), auth, cart, table session, env.

3. **API client**
   - **Public (customer):** `lib/api/public.ts` — menu, create order, waiter call, order status.
   - **Restaurant admin:** `lib/api/admin.ts` — auth, menu CRUD, orders, tables, uploads.
   - **Waiter:** `lib/api/waiter.ts` — floor map, tables, orders, waiter calls, create order.
   - **Kitchen:** `lib/api/kitchen.ts` — kitchen orders, mark ready.
   - **Platform:** `lib/api/platform.ts` — restaurants, plans, audit.

4. **Auth**
   - Restaurant/waiter: JWT from `POST /auth/login`; stored in localStorage; sent as `Authorization: Bearer <token>`.
   - Platform: separate login at `/platform/login` and platform APIs.
   - Customer: no login; table session identifies device/table.

5. **Docs**
   - **Developer guide:** [cursor-change-log/DEVELOPER_GUIDE.md](cursor-change-log/DEVELOPER_GUIDE.md)
   - **Naming & types:** [cursor-change-log/NAMING_AND_TYPES.md](cursor-change-log/NAMING_AND_TYPES.md)

---

## PWA

- PWA is **disabled in development** (`next-pwa`).
- To test install: `npm run build && npm run start`, then open http://localhost:3001 and use Chrome “Install app”.

---

## Documentation & change logs

All change logs and docs in `cursor-change-log/`:

- [Checklist Table Session and Waiter](cursor-change-log/CHECKLIST_TABLE_SESSION_AND_WAITER.md)
- [Cleanup Phase 1 Complete](cursor-change-log/CLEANUP_PHASE1_COMPLETE.md)
- [Cleanup Phase 2 Complete](cursor-change-log/CLEANUP_PHASE2_COMPLETE.md)
- [Codebase Audit](cursor-change-log/CODEBASE_AUDIT.md)
- [CORS Fix](cursor-change-log/CORS_FIX.md)
- [Developer Guide](cursor-change-log/DEVELOPER_GUIDE.md)
- [DishLens Summary](cursor-change-log/DISHLENS_SUMMARY.md)
- [Naming Conventions & Types](cursor-change-log/NAMING_AND_TYPES.md)
- [Phase 1 Cleanup Summary](cursor-change-log/PHASE1_CLEANUP_SUMMARY.md)
- [Phase 1 Complete](cursor-change-log/PHASE1_COMPLETE.md)

---

## Ownership

All code and any future UI/media assets for DishLens are intended to be proprietary to ATX Solutions.
