# DishLens: Developer Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase)
- npm or yarn

### Setup

**Backend (dishlens-api)**
```bash
cd dishlens-api/dishlens-api
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET, etc.
npm run start:dev     # Runs on http://localhost:3000
```

**Frontend (dishlens-app)**
```bash
cd dishlens-app
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_BASE_URL
npm run dev                 # Runs on http://localhost:3001
```

### Environment Variables

**Backend (.env)**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - API port (default: 3000)

**Frontend (.env.local)**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_RESTAURANT_SLUG` - Default restaurant slug (optional)

---

## Architecture

### Codebase Structure

**dishlens-api** (NestJS Backend)
```
src/
├── modules/
│   ├── auth/          # JWT authentication
│   ├── menu/          # Menu items, categories, ratings
│   ├── orders/       # Orders, table sessions, access tokens
│   ├── restaurants/  # Restaurant CRUD
│   └── users/        # User management
└── common/           # Shared guards, services, middleware
```

**dishlens-app** (Next.js Frontend)
```
app/
├── m/[slug]/         # Public menu (customer-facing)
├── r/                # Restaurant staff/admin routes
└── customer/         # Customer routes (unused)
components/
├── customer/         # Customer-facing components
├── admin/            # Admin components
└── staff/            # Staff/waiter components
lib/
├── api/              # API endpoints (public.ts, admin.ts)
├── table.ts          # Table session management
└── types.ts          # Canonical type definitions
```

### Key Flow
```
QR Scan → resolveTableSession() → TableSession → Menu → Cart → Order
```

---

## Naming Conventions

### Frontend Types (`lib/types.ts`)
- **`TableSession`**: Server-issued session
  - `tableSessionId: string` (UUID)
  - `tableNumber: string` (display)
  - `sessionSecret: string | null` (auth)
  - `expiresAt: string | null` (ISO timestamp)

- **`TableAccessToken`**: Rotating QR token

### Backend
- **Database**: `snake_case` (e.g., `table_session_id`)
- **API DTOs**: `camelCase` (e.g., `tableSessionId`)
- **Entities**: `PascalCase` (e.g., `TableSessionEntity`)

---

## API Organization

### Public Endpoints (`lib/api/public.ts`)
Customer-facing, no authentication:
- `publicMenu()` - Get menu
- `createPublicOrder()` - Create order (requires `sessionSecret`)
- `getPublicOrder()` - Get order status
- `rateMenuItem()` - Rate item

### Admin/Staff Endpoints (`lib/api/admin.ts`)
Requires JWT authentication:
- **Auth**: `login()`, `staffLogin()`, `me()`
- **Restaurants**: `listRestaurants()`
- **Orders**: `listOrders()`, `staffClaimOrder()`, `staffUpdateOrder()`
- **Menu**: `adminMenu()`, `createMenuCategory()`, `updateMenuItem()`, etc.
- **Uploads**: `uploadMenuItemImage()`, `uploadRestaurantLogo()`, etc.

### Backward Compatibility (`lib/endpoints.ts`)
- Re-exports all functions for existing imports
- Marked as deprecated; new code should import from `lib/api/*`

---

## Table Session Flow

### Secure QR Flow (New)
1. QR contains `TableAccessToken` (rotating, 10-30min TTL)
2. Customer scans → `resolveAccessToken()` → `POST /table-sessions/resolve`
3. Backend validates token, creates `TableSession` with `sessionSecret`
4. Frontend stores session in `localStorage`
5. Order creation requires `tableSessionId` + `sessionSecret`

### Legacy QR Flow (Backward Compatible)
1. QR contains signed token (HMAC)
2. Customer scans → `getOrStartTableSession()` → `POST /table-sessions/start`
3. Backend validates signature, creates session
4. Still works but deprecated

### Guest Flow
1. Customer visits `/m/:slug?table=5`
2. `startGuestTableSession()` → `POST /table-sessions/guest`
3. Creates session for table number

---

## Development

### Type Checking
```bash
# Frontend
cd dishlens-app
npx tsc --noEmit

# Backend
cd dishlens-api/dishlens-api
npx tsc --noEmit
```

### Linting
```bash
# Frontend
npm run lint

# Backend
npm run lint
```

### Building
```bash
# Frontend
npm run build

# Backend
npm run build
```

---

## Testing

### Smoke Test Flow
1. Start backend: `npm run start:dev` (port 3000)
2. Start frontend: `npm run dev` (port 3001)
3. Open menu: `http://localhost:3001/m/:slug`
4. Add item to cart
5. Place order (requires `sessionSecret`)

---

## Security

### QR Access Tokens
- Rotating tokens (10-30min TTL)
- Immediate revocation on rotation
- Rate limited (10 resolves/IP/10min)

### Session Secrets
- Cryptographically secure (256 bits)
- Required for order creation
- Stored securely in localStorage

### Rate Limiting
- Token resolve: 10 attempts per IP per 10 minutes
- Order creation: 5 orders per session per 10 minutes

---

## Troubleshooting

### Common Issues

**Frontend won't start**
- Check `.env.local` has `NEXT_PUBLIC_API_BASE_URL`
- Clear `.next` folder: `rm -rf .next`

**Backend won't start**
- Check `.env` has `DATABASE_URL`
- Verify database connection
- Check port 3000 is available

**Type errors**
- Run `npx tsc --noEmit` to see all errors
- Ensure all imports use correct paths
- Check `lib/types.ts` for canonical types

---

## References

- **Type Definitions**: `lib/types.ts`
- **API Endpoints**: `lib/api/public.ts`, `lib/api/admin.ts`
- **Table Session**: `lib/table.ts`
- **Backend Schema**: `subbase/supabase_schema.sql`
