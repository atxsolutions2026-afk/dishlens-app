# DishLens Codebase Audit & Cleanup Plan

## Phase 0: Audit Summary

### Codebase Structure

**dishlens-api (Backend - NestJS)**
```
src/
├── modules/
│   ├── auth/          # JWT authentication
│   ├── menu/          # Menu items, categories, ratings
│   ├── orders/        # Orders, table sessions, access tokens
│   ├── restaurants/   # Restaurant CRUD
│   └── users/         # User management
└── common/            # Shared guards, services, middleware
```

**dishlens-app (Frontend - Next.js)**
```
app/
├── m/[slug]/          # Public menu (customer-facing)
├── r/                 # Restaurant staff/admin routes
└── customer/          # Customer routes (unused?)
components/
├── customer/          # Customer-facing components
├── admin/             # Admin components
└── staff/             # Staff/waiter components
lib/                   # Shared utilities, API clients
```

### Key Flow: Scan QR → TableSession → Menu → Cart → Order

1. **QR Scan**: `/m/:slug?t=<token>` → resolves to `TableSession`
2. **TableSession**: Created via `POST /public/restaurants/:slug/table-sessions/resolve`
3. **Menu**: Loaded via `GET /public/restaurants/:slug/menu`
4. **Cart**: Managed in `useCart` hook, persisted to localStorage
5. **Order**: Created via `POST /public/restaurants/:slug/orders` with `tableSessionId` + `sessionSecret`

---

## Identified Issues

### 🔴 Critical Issues

1. **Duplicate Components**
   - `CustomerMenuApi.tsx` - **UNUSED** (only `CustomerMenuModern.tsx` is imported)
   - Both implement same functionality, but `CustomerMenuModern` is canonical

2. **Duplicate API Fetch Implementations**
   - `lib/api.ts` - Uses `apiBaseUrl()` helper, more complex
   - `lib/apiFetch.ts` - Simpler, takes full URL
   - **Current usage**: `endpoints.ts` uses `apiFetch.ts`, but `api.ts` exists unused

3. **Naming Inconsistencies**
   - `tableToken` vs `tableSessionId` vs `tableSession` confusion
   - `TableSession` type has both `tableToken` (deprecated) and `sessionSecret` (new)
   - Backend uses `tableSessionId`, frontend sometimes uses `tableSessionId`, sometimes `tableSession`

### 🟡 Medium Issues

4. **Unused Files**
   - `app/customer/page.tsx` - Placeholder, not used
   - `lib/api.ts` - Unused (if we standardize on `apiFetch.ts`)

5. **Type Inconsistencies**
   - `TableSession` type has optional fields that should be required in some contexts
   - `CreatePublicOrderPayload` requires `sessionSecret` but components may not always have it

6. **Import Inconsistencies**
   - Some files import from `@/lib/apiFetch`, others could import from `@/lib/api`
   - Mixed use of `API_BASE` constant vs `apiBaseUrl()` function

### 🟢 Minor Issues

7. **Code Organization**
   - `lib/endpoints.ts` is very large (477 lines) - could be split by domain
   - Some utility functions duplicated across files

8. **Documentation**
   - Multiple markdown files with overlapping info (`DISHLENS_SUMMARY.md`, `NAMING_AND_TYPES.md`, etc.)

---

## Proposed Cleanup Plan

### Phase 1: Get to Green (No Behavior Change) ✅

**Goal**: Fix TypeScript errors, standardize naming, ensure builds pass

1. **Remove Unused Components**
   - Delete `components/customer/CustomerMenuApi.tsx` (unused)
   - Delete `lib/api.ts` (unused, `apiFetch.ts` is canonical)

2. **Standardize Table Naming**
   - Create canonical type definitions in `lib/types.ts`
   - Update all references to use consistent names:
     - `TableAccessToken` (QR token)
     - `TableSession` (server-issued session)
     - `tableSessionId` (UUID)
     - `tableNumber` (display string)
   - Remove deprecated `tableToken` field from `TableSession` type

3. **Fix Type Safety**
   - Ensure `sessionSecret` is always present when needed
   - Add proper error handling for missing session secrets

4. **Consolidate API Fetch**
   - Standardize on `lib/apiFetch.ts` (already in use)
   - Remove `lib/api.ts` if truly unused

### Phase 2: Organization + Conventions

1. **Split Large Files**
   - Split `lib/endpoints.ts` into:
     - `lib/api/public.ts` (customer endpoints)
     - `lib/api/admin.ts` (admin/staff endpoints)

2. **Consolidate Documentation**
   - Merge overlapping docs into single source of truth

3. **Add Consistent Linting**
   - Ensure ESLint config is consistent
   - Add Prettier if missing

### Phase 3: Final Verification

1. **Build Verification**
   - `npm run build` passes for both projects
   - `npm run lint` passes
   - `npx tsc --noEmit` passes

2. **Runtime Verification**
   - API starts without errors
   - Frontend starts without errors
   - Can scan QR → load menu → add to cart → place order

---

## Implementation: Phase 1

Starting with Phase 1 fixes now...
