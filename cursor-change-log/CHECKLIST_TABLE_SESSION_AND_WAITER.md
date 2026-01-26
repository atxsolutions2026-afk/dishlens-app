# Checklist: Table Session + Waiter Changes

## Summary
- **Table session**: Use `table-sessions/start` (QR) or `table-sessions/guest` (?table=N). Persist session in localStorage. Cart keyed by `(slug, tableSessionId)`. Create order always sends `tableSessionId` + `deviceId` + `lines`.
- **Waiter**: New `/r/waiter` page (restaurant + table) → view/edit orders, claim as serving waiter. Audit: serving waiter + last modified user/time shown in TableOrders and Kitchen orders.

## Local testing

### 1. Backend (dishlens-api)
- [ ] Run migrations if any (`sql/`). **None required** for this change (guest flow uses existing `table_sessions`).
- [ ] `npm run start:dev`. Ensure `POST /public/restaurants/:slug/table-sessions/guest` exists.
- [ ] Optional: Create a restaurant with QR configured. Generate QR token (`GET /restaurants/:id/qr-token?table=1`).

### 2. Frontend (dishlens-app)
- [ ] `npm run dev`. Set `NEXT_PUBLIC_API_BASE` to your API URL (e.g. `http://localhost:3000`).
- [ ] **Customer – guest flow**: Open `/m/<slug>?table=1`. Confirm table “1” and cart persist. Add items, customize (spice/allergy/notes), submit order. Check cart persists after refresh.
- [ ] **Customer – QR flow**: Open `/m/<slug>?t=<qrToken>`. Same as above; session from QR.
- [ ] **Customer – no params**: Open `/m/<slug>`. Should create guest session for table “1” and persist.
- [ ] **Kitchen**: `/r/orders`. Log in. Confirm orders show “Table X”, and optionally “Serving: …” / “Edited: …” when set.
- [ ] **Waiter**: `/r/waiter`. Log in. Select restaurant, enter table number. View orders, claim as serving waiter, edit qty/notes. Confirm “Serving waiter” and “Last edited by” appear.
- [ ] **Dish detail**: `/m/<slug>/dish/<id>?table=1`. Add to cart, submit. Same table session as menu.

### 3. Non‑negotiables
- [ ] Autoplay video: muted + `playsInline`; only in dish detail or on tap (no menu-grid autoplay).
- [ ] Table/session persisted (localStorage) so cart/order survive refresh.
- [ ] Spice level + allergy/special requests per line in cart and order.
- [ ] Waiter can view/edit by table; claim stores serving waiter; edits store last modified user + time.

## Files touched

**Backend**
- `src/modules/orders/table-sessions.service.ts` – `startGuestSession`
- `src/modules/orders/public-table-sessions.controller.ts` – `POST :slug/table-sessions/guest`

**Frontend**
- `lib/table.ts` – `resolveTableSession`, `startGuestTableSession`, persist/load, remove `getOrCreateTable`
- `lib/endpoints.ts` – `startGuestTableSession`, `CreatePublicOrderPayload`, `createPublicOrder` payload shape
- `components/customer/CustomerMenuModern.tsx` – resolve session, submit with `tableSessionId` + `deviceId`
- `components/customer/CustomerDishDetailApi.tsx` – same
- `components/customer/CustomerMenuApi.tsx` – same
- `components/staff/TableOrders.tsx` – audit UI, line `id` for qty edits
- `app/r/waiter/page.tsx` – new waiter page
- `app/r/orders/page.tsx` – “Table X” label, optional serving/edited display
- `components/AppShell.tsx` – Waiter tab

**SQL**
- No schema changes. Guest sessions use existing `table_sessions`.
