# DishLens: Product Summary & Code Map

## Product Summary (10 Bullets)

1. **Mobile-first QR ordering**: Customers scan QR code at table, land on restaurant menu (`/m/:slug`), browse dishes with images/videos, customize items (spice level, allergies, special requests), add to cart, and place orders.

2. **Table session security**: Short-lived sessions (90min TTL) created via QR token (`?t=`) or guest flow (`?table=N`), persisted in localStorage, prevent "photo QR → order later" abuse, device-limited (4 devices per session).

3. **Real restaurant flow**: Orders tied to table number + session ID; cart persists across page refreshes; orders visible to kitchen dashboard (`/r/orders`) and waiter view (`/r/waiter`).

4. **Waiter capabilities**: Staff can view orders by table, claim as serving waiter, edit quantities/notes, and all edits are attributed (audit trail: `servingWaiterUserId`, `lastModifiedByUserId`, `lastModifiedAt`).

5. **Kitchen workflow**: Kitchen sees incoming orders (NEW → IN_PROGRESS → DONE), auto-acknowledges NEW on dashboard load, updates status per order, views order details with modifiers.

6. **Menu management**: Admin creates categories, adds items (name, price, description, allergens, images/videos), toggles availability (`isAvailable`) vs discontinued (`isActive`), uploads media, generates QR codes.

7. **Customization per line**: Each cart line supports `spiceLevel` (NONE/MILD/MEDIUM/HOT/EXTRA_HOT), `spiceOnSide`, `allergensAvoid` (array), `specialInstructions` (free text); modifiers create distinct cart lines.

8. **Visual-first UX**: Hero images, logos, dish images, short autoplay videos (muted + inline), mobile-optimized touch targets, clear loading/empty/error states, minimal taps to order.

9. **Ratings & analytics**: Customers rate dishes (1-5 stars + comment), admin views ratings summary per restaurant, tracks top dishes by rating count/avg.

10. **Multi-tenant**: Restaurant-scoped data (JWT `restaurantId`), role-based access (ATX_ADMIN, RESTAURANT_OWNER, STAFF), public endpoints for customer flow, authenticated endpoints for staff/admin.

---

## Key Entities & Types

### Backend Entities (TypeORM)

**Restaurant**
- `id` (UUID), `slug`, `name`, `city`, `state`, `phone`, `website`
- `qrSecret` (for QR token signing), `logoUrl`, `heroImageUrl`
- `createdAt`, `updatedAt`

**MenuCategory**
- `id` (UUID), `restaurantId`, `name`, `sortOrder`
- `isActive` (soft delete), `createdAt`, `updatedAt`

**MenuItem**
- `id` (UUID), `restaurantId`, `categoryId`, `name`, `description`
- `priceCents` (int), `currency`, `isVeg`, `spiceLevel` (enum)
- `allergens` (string[]), `allergenNotes`, `imageUrl`, `videoUrl`
- `isAvailable` (temporarily unavailable), `isActive` (discontinued)
- `avgRating`, `ratingCount` (computed)
- `createdAt`, `updatedAt`

**TableSession**
- `id` (UUID), `restaurantId`, `tableNumber` (varchar 40)
- `expiresAt` (timestamptz), `deviceHashes` (string[]), `deviceLimit` (int)
- `isActive` (boolean), `createdAt`, `updatedAt`

**Order**
- `id` (UUID), `restaurantId`, `tableNumber`, `tableSessionId` (nullable UUID)
- `status` (NEW/IN_PROGRESS/DONE/CANCELLED), `subtotalCents`, `totalCents`, `currency`
- `notes` (text), `orderToken` (for public status reads)
- `servingWaiterUserId` (UUID, nullable), `lastModifiedByUserId` (UUID, nullable), `lastModifiedAt` (timestamptz, nullable)
- `createdAt`, `updatedAt`

**OrderItem**
- `id` (UUID), `orderId`, `restaurantId`, `menuItemId`
- `name`, `unitPriceCents`, `quantity`
- `spiceLevel`, `spiceOnSide` (boolean), `allergensAvoid` (string[]), `specialInstructions` (text)
- `createdAt`

**MenuItemRating**
- `id` (UUID), `menuItemId`, `stars` (1-5), `comment` (text, nullable)
- `createdAt`

**User**
- `id` (UUID), `email`, `passwordHash`, `roles` (Role[]), `restaurantId` (nullable)
- `createdAt`, `updatedAt`

### Frontend Types (TypeScript)

**TableSession** (`lib/table.ts`)
```typescript
{
  tableSessionId: string;  // UUID
  tableNumber: string;      // Display string
  tableToken?: string | null;
  expiresAt?: string | null;
}
```

**CartLine** (`lib/cart.ts`)
```typescript
{
  key: string;              // Composite: menuItemId|spice|side|allergens|note
  menuItemId: string;
  name: string;
  price: number;             // dollars
  imageUrl?: string | null;
  quantity: number;
  modifiers?: LineModifiers;
}
```

**LineModifiers** (`lib/cart.ts`)
```typescript
{
  spiceLevel?: SpiceLevel;  // "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT"
  spiceOnSide?: boolean;
  allergensAvoid?: string[];
  specialInstructions?: string;
}
```

**UiDish** (`lib/menuAdapter.ts`)
```typescript
{
  id: string;
  name: string;
  categoryName?: string;
  description?: string | null;
  price: number;             // dollars
  currency: string;
  isVeg?: boolean | null;
  spice?: string | null;
  allergens?: string[] | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  avgRating?: number | null;
  ratingCount?: number | null;
}
```

**UiCategory** (`lib/menuAdapter.ts`)
```typescript
{
  id: string;
  name: string;
  items: UiDish[];
}
```

**CreatePublicOrderPayload** (`lib/endpoints.ts`)
```typescript
{
  tableSessionId: string;   // Required UUID
  deviceId?: string;        // Optional
  lines: OrderLine[];
  notes?: string;
}
```

**OrderLine** (staff components)
```typescript
{
  id?: string;              // Line UUID (optional for backward compat)
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  spiceLevel?: string | null;
  spiceOnSide?: boolean;
  allergensAvoid?: string[];
  specialInstructions?: string | null;
}
```

---

## Top 5 Code Areas Likely to Touch

### 1. **Customer Ordering Flow** (High Frequency)
**Files:**
- `components/customer/CustomerMenuModern.tsx` (922 lines) — Main menu UI, cart, customization, order submit
- `components/customer/CustomerDishDetailApi.tsx` — Dish detail page, add to cart
- `components/customer/CustomizeItemSheet.tsx` — Spice/allergy/special request UI
- `components/customer/CartDrawer.tsx` — Cart display, quantity edits, submit

**Why:** Core customer experience; changes for UX improvements, new customization options, cart behavior, order flow tweaks.

**Key Logic:**
- Table session resolution (`resolveTableSession`)
- Cart state (`useCart` hook)
- Order creation (`createPublicOrder` with `tableSessionId` + `deviceId` + `lines`)

---

### 2. **Table Session Management** (Medium-High Frequency)
**Files:**
- `lib/table.ts` (150 lines) — Session resolution, persistence, QR/guest flows
- `dishlens-api/.../table-sessions.service.ts` — Backend session creation/validation
- `dishlens-api/.../public-table-sessions.controller.ts` — `/start` and `/guest` endpoints

**Why:** Security, session TTL changes, device limits, QR token validation, guest flow improvements.

**Key Logic:**
- QR token verification (HMAC signature)
- Session reuse (active session for same table)
- Device hash tracking (limit abuse)
- localStorage persistence (cart survival)

---

### 3. **Order Creation & Management** (Medium Frequency)
**Files:**
- `lib/endpoints.ts` — `createPublicOrder`, `orderLinesFromCart`, staff order endpoints
- `dishlens-api/.../orders.service.ts` — Order creation, status updates, waiter edits
- `dishlens-api/.../orders.controller.ts` — Staff endpoints (list, claim, update, status)
- `dishlens-api/.../public-orders.controller.ts` — Customer endpoints (create, read)

**Why:** Order validation, status workflow changes, modifier handling, audit trail improvements, kitchen/waiter features.

**Key Logic:**
- Order creation with `tableSessionId` validation
- Line item creation with modifiers
- Status transitions (NEW → IN_PROGRESS → DONE)
- Waiter attribution (`claimOrder`, `updateOrder` with `userId`)

---

### 4. **Cart State & Persistence** (Medium Frequency)
**Files:**
- `lib/cart.ts` — `CartLine`, `LineModifiers`, `lineKey` (composite key logic)
- `lib/useCart.ts` — React hook for cart state, localStorage persistence

**Why:** Cart behavior changes, modifier handling, persistence improvements, performance optimizations.

**Key Logic:**
- Composite cart line key (`menuItemId|spice|side|allergens|note`)
- localStorage key: `dishlens_cart:{slug}:{tableSessionId}`
- Quantity updates, line edits, merge logic

---

### 5. **Waiter/Staff Flows** (Medium Frequency)
**Files:**
- `components/staff/TableOrders.tsx` — Waiter view/edit orders by table
- `app/r/waiter/page.tsx` — Waiter page (restaurant + table selector)
- `app/r/orders/page.tsx` — Kitchen dashboard (order list, status updates)
- `dishlens-api/.../orders.service.ts` — `listTableOrders`, `claimOrder`, `updateOrder`

**Why:** Waiter workflow improvements, audit display, order editing UX, kitchen status workflow changes.

**Key Logic:**
- Table-based order listing
- Claim as serving waiter (`servingWaiterUserId`)
- Edit quantities/notes (updates `lastModifiedByUserId` + `lastModifiedAt`)
- Status updates (kitchen workflow)

---

## Additional Areas (Lower Frequency but Important)

- **Menu Management**: `components/admin/AdminMenuManager.tsx`, `dishlens-api/.../menu.service.ts` — Category/item CRUD
- **Media Uploads**: `components/admin/...`, `dishlens-api/.../menu-media.service.ts` — Image/video uploads
- **Ratings**: `components/admin/AdminRatingsApi.tsx`, `dishlens-api/.../menu-ratings.service.ts` — Rating aggregation
- **QR Generation**: `components/admin/QrGenerating.tsx`, `dishlens-api/.../restaurants.controller.ts` — QR token signing
- **Menu Adapter**: `lib/menuAdapter.ts` — API → UI normalization (price cents → dollars, etc.)

---

## Quick Reference: Key Endpoints

**Public (Customer)**
- `GET /public/restaurants/:slug/menu` — Menu data
- `POST /public/restaurants/:slug/table-sessions/start` — QR session
- `POST /public/restaurants/:slug/table-sessions/guest` — Guest session
- `POST /public/restaurants/:slug/orders` — Create order
- `GET /public/restaurants/:slug/orders/:id?token=...` — Read order
- `POST /public/menu-items/:id/rating` — Rate dish

**Staff/Admin (Authenticated)**
- `GET /restaurants/:id/orders` — List orders (with status filter)
- `GET /restaurants/:id/tables/:tableNumber/orders` — Table orders
- `POST /restaurants/:id/orders/:orderId/claim` — Claim as waiter
- `PATCH /restaurants/:id/orders/:orderId` — Update order (waiter edit)
- `PATCH /restaurants/:id/orders/:orderId/status` — Update status (kitchen)
- `GET /restaurants/:id/menu` — Admin menu (with inactive items)
- `POST /restaurants/:id/menu/categories` — Create category
- `POST /restaurants/:id/menu/items` — Create item
- `GET /restaurants/:id/qr-token?table=N` — Generate QR token
