# DishLens: Naming & Type Conventions

## Naming Conventions (Standardized)

### Frontend (TypeScript/React)
- **`tableSessionId`** (camelCase): UUID string for table session
- **`tableNumber`** (camelCase): Display string (e.g., "5", "T-12")
- **`sessionSecret`** (camelCase): Cryptographically secure secret for order authentication
- **`deviceId`** (camelCase): Client device identifier
- **`slug`** (camelCase): Restaurant slug URL identifier

### Backend (NestJS/TypeORM)
- **API/DTOs**: `tableSessionId`, `tableNumber`, `sessionSecret` (camelCase)
- **Database columns**: `table_session_id`, `table_number`, `session_secret` (snake_case)
- **Entity properties**: `tableSessionId`, `tableNumber`, `sessionSecret` (camelCase, mapped from DB)

### API Endpoints
- `/public/restaurants/:slug/table-sessions/resolve` (new secure QR flow)
- `/public/restaurants/:slug/table-sessions/start` (legacy QR flow)
- `/public/restaurants/:slug/table-sessions/guest` (guest flow)
- `/public/restaurants/:slug/orders` (create order)

## Type Definitions

### Frontend Types (`lib/types.ts` - Canonical Source)
```typescript
export type TableSession = {
  tableSessionId: string;  // UUID (required)
  tableNumber: string;    // Display string (required)
  sessionSecret: string | null;  // Auth secret (required for orders)
  expiresAt: string | null;      // ISO timestamp
};

export type TableAccessToken = string;  // Rotating QR token
```

### Frontend Order Types (`lib/api/public.ts`)
```typescript
export type CreatePublicOrderPayload = {
  tableSessionId: string;  // Required UUID
  sessionSecret: string;    // Required for secure orders
  deviceId?: string;        // Optional device identifier
  lines: ReturnType<typeof orderLinesFromCart>;
  notes?: string;
};
```

### Backend DTOs (`create-public-order.dto.ts`)
```typescript
export class CreatePublicOrderDto {
  tableSessionId!: string;  // UUID, required
  sessionSecret!: string;   // Required for secure orders
  deviceId?: string;        // Optional
  lines!: CreatePublicOrderLineDto[];
  notes?: string;
}
```

## Normalized Patterns

### 1. Table Session Resolution
- **New secure QR flow**: `?t=<accessToken>` (16+ chars, no dots) → `resolveAccessToken()` → `/resolve` endpoint
- **Legacy QR flow**: `?t=<signedToken>` (contains dots) → `getOrStartTableSession()` → `/start` endpoint
- **Guest flow**: `?table=<number>` → `startGuestTableSession()` → `/guest` endpoint
- **Default**: No params → guest session for table "1"
- **Persistence**: All sessions persisted to `localStorage` key `dishlens_table_session:{slug}`

### 2. Cart Keying
- **Key format**: `dishlens_cart:{slug}:{tableSessionId}`
- **Fallback**: Empty string (empty cart) if no session
- **Consistency**: All customer components use `tableSessionId || ""`

### 3. Order Creation
- **Always required**: `tableSessionId` (UUID) + `sessionSecret` (auth)
- **Optional**: `deviceId` (sent when available)
- **Lines**: Include `spiceLevel`, `spiceOnSide`, `allergensAvoid`, `specialInstructions`

### 4. Audit Fields
- **Serving waiter**: `servingWaiterUserId` (set via `claimOrder`)
- **Last modified**: `lastModifiedByUserId` + `lastModifiedAt` (set via `updateOrder`)
- **Display**: Show user ID prefix (first 8 chars) + timestamp when present

## API Organization

### Public Endpoints (`lib/api/public.ts`)
- `publicMenu()` - Get menu
- `createPublicOrder()` - Create order
- `getPublicOrder()` - Get order status
- `rateMenuItem()` - Rate item
- `orderLinesFromCart()` - Helper

### Admin/Staff Endpoints (`lib/api/admin.ts`)
- Auth: `login()`, `staffLogin()`, `me()`
- Restaurants: `listRestaurants()`
- Orders: `listOrders()`, `staffListOrders()`, `staffClaimOrder()`, `staffUpdateOrder()`
- Menu: `adminMenu()`, `createMenuCategory()`, `updateMenuItem()`, etc.
- Uploads: `uploadMenuItemImage()`, `uploadRestaurantLogo()`, etc.
- QR/Ratings: `getQrToken()`, `restaurantRatings()`

### Backward Compatibility (`lib/endpoints.ts`)
- Re-exports all functions from `lib/api/public.ts` and `lib/api/admin.ts`
- Existing imports continue to work

## Breaking Changes: None

All changes are backward-compatible:
- New secure QR flow is additive
- Legacy QR flow still works
- Guest flow unchanged
- Cart fallback normalized (empty string = empty cart, safe)
- Order DTO requires `sessionSecret` (already implemented)
