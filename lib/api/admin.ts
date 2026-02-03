/**
 * Admin/Staff API endpoints
 * These endpoints require authentication (JWT token).
 */

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { getToken } from "@/lib/auth";

const API_BASE = apiBaseUrl();

/* =========================================================
   AUTH
========================================================= */

/**
 * Staff/admin login.
 * Returns JWT token which should be stored via setToken().
 */
export async function staffLogin(email: string, password: string) {
  return apiFetch<any>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Alias for staffLogin (backward compatibility).
 */
export async function login(email: string, password: string) {
  return staffLogin(email, password);
}

/**
 * Get current user info.
 */
export async function me() {
  const token = getToken();
  return apiFetch<any>(`${API_BASE}/users/me`, { method: "GET", token });
}

/* =========================================================
   RESTAURANTS
========================================================= */

/**
 * List restaurants (admin/staff only).
 */
export async function listRestaurants() {
  const token = getToken();
  return apiFetch<any>(`${API_BASE}/restaurants`, { method: "GET", token });
}

/* =========================================================
   ORDERS (Staff/Admin)
========================================================= */

/**
 * List orders for a restaurant (with optional status filter).
 */
export async function staffListOrders(
  restaurantId: string,
  status?: string | string[],
) {
  const token = getToken();
  const statusParam = Array.isArray(status) ? status.join(",") : status;
  const qs = statusParam ? `?status=${encodeURIComponent(statusParam)}` : "";
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/orders${qs}`,
    {
      method: "GET",
      token,
    },
  );
}

/**
 * List orders for a specific table.
 */
export async function staffListTableOrders(
  restaurantId: string,
  tableNumber: string,
  activeOnly?: boolean,
) {
  const token = getToken();
  const qs = activeOnly ? `?activeOnly=1` : "";
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableNumber)}/orders${qs}`,
    { method: "GET", token },
  );
}

/**
 * Claim an order (assign to waiter).
 */
export async function staffClaimOrder(restaurantId: string, orderId: string) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/orders/${encodeURIComponent(orderId)}/claim`,
    {
      method: "POST",
      token,
    },
  );
}

/**
 * Update an order (waiter/admin edits).
 */
export async function staffUpdateOrder(
  restaurantId: string,
  orderId: string,
  body: any,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    },
  );
}

/**
 * List orders with optional auto-acknowledge.
 * Used by kitchen dashboard.
 */
export type ListOrdersOptions =
  | string
  | {
      status?: string[];
      autoAck?: boolean;
    };

export async function listOrders(
  restaurantId: string,
  opts?: ListOrdersOptions,
) {
  const statuses =
    typeof opts === "string"
      ? [opts]
      : Array.isArray(opts?.status)
        ? opts!.status
        : undefined;

  const data = await staffListOrders(restaurantId, statuses);

  // Optional: auto-ack NEW -> IN_PROGRESS on load
  if (typeof opts === "object" && opts?.autoAck && Array.isArray(data)) {
    const toAck = data.filter((o: any) => o?.status === "NEW" && o?.id);
    if (toAck.length) {
      await Promise.allSettled(
        toAck.map((o: any) =>
          updateOrderStatus(restaurantId, o.id, "IN_PROGRESS"),
        ),
      );
      return staffListOrders(restaurantId, statuses);
    }
  }

  return data;
}

/**
 * Update order status.
 */
export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: string,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    },
  );
}

/* =========================================================
   MENU MANAGEMENT (Admin)
========================================================= */

/**
 * Get admin menu (includes inactive items).
 */
export async function adminMenu(restaurantId: string) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu`,
    {
      method: "GET",
      token,
    },
  );
}

// Categories
export async function createMenuCategory(restaurantId: string, body: any) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/categories`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    },
  );
}

export async function updateMenuCategory(
  restaurantId: string,
  categoryId: string,
  body: any,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", token, body: JSON.stringify(body) },
  );
}

export async function deactivateMenuCategory(
  restaurantId: string,
  categoryId: string,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/categories/${encodeURIComponent(categoryId)}/deactivate`,
    { method: "PATCH", token },
  );
}

// Items
export async function createMenuItem(restaurantId: string, body: any) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/items`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    },
  );
}

export async function updateMenuItem(
  restaurantId: string,
  itemId: string,
  body: any,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/items/${encodeURIComponent(itemId)}`,
    { method: "PATCH", token, body: JSON.stringify(body) },
  );
}

export async function deactivateMenuItem(restaurantId: string, itemId: string) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/menu/items/${encodeURIComponent(itemId)}/deactivate`,
    { method: "PATCH", token },
  );
}

/**
 * Backward-compatibility alias.
 */
export async function discontinueMenuItem(restaurantId: string, itemId: string) {
  return deactivateMenuItem(restaurantId, itemId);
}

/* =========================================================
   UPLOADS (Admin)
========================================================= */

export async function uploadMenuItemImage(
  restaurantId: string, // kept for backward compatibility
  itemId: string,
  file: File,
) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);

  return apiFetch<any>(
    `${API_BASE}/menu-items/${encodeURIComponent(itemId)}/image`,
    { method: "POST", token, body: fd as any },
  );
}

export async function uploadMenuItemVideo(
  restaurantId: string, // kept for backward compatibility
  itemId: string,
  file: File,
) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);

  return apiFetch<any>(
    `${API_BASE}/menu-items/${encodeURIComponent(itemId)}/video`,
    { method: "POST", token, body: fd as any },
  );
}

export async function uploadRestaurantLogo(restaurantId: string, file: File) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);

  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/logo`,
    {
      method: "POST",
      token,
      body: fd as any,
    },
  );
}

export async function uploadRestaurantHero(restaurantId: string, file: File) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);

  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/hero`,
    {
      method: "POST",
      token,
      body: fd as any,
    },
  );
}

/* =========================================================
   QR + RATINGS (Admin)
========================================================= */

/**
 * Get QR token for a table (legacy signed token).
 * For new secure QR flow, use access tokens instead.
 */
export async function getQrToken(restaurantId: string, tableNumber?: string) {
  const token = getToken();
  const qs = tableNumber ? `?table=${encodeURIComponent(tableNumber)}` : "";
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/qr-token${qs}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function restaurantRatings(restaurantId: string) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/ratings`,
    {
      method: "GET",
      token,
    },
  );
}

/**
 * Alias for restaurantRatings (backward compatibility).
 */
export async function restaurantRatingsSummary(restaurantId: string) {
  return restaurantRatings(restaurantId);
}

/* =========================================================
   WAITERS MANAGEMENT (Admin)
========================================================= */

export interface WaiterProfile {
  id: string;
  restaurantId: string;
  userId: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

export interface CreateWaiterDto {
  name: string;
  email?: string;
  password?: string;
  photoUrl?: string;
  phone?: string;
  notes?: string;
  userId?: string;
}

export interface UpdateWaiterDto {
  name?: string;
  photoUrl?: string;
  phone?: string;
  notes?: string;
  active?: boolean;
}

/**
 * List waiters for a restaurant.
 */
export async function listWaiters(restaurantId: string, includeInactive?: boolean): Promise<WaiterProfile[]> {
  const token = getToken();
  const qs = includeInactive ? '?includeInactive=true' : '';
  return apiFetch<WaiterProfile[]>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters${qs}`,
    { method: "GET", token },
  );
}

/**
 * Get waiter by ID.
 */
export async function getWaiter(restaurantId: string, waiterId: string): Promise<WaiterProfile> {
  const token = getToken();
  return apiFetch<WaiterProfile>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters/${encodeURIComponent(waiterId)}`,
    { method: "GET", token },
  );
}

/**
 * Create waiter.
 */
export async function createWaiter(restaurantId: string, dto: CreateWaiterDto): Promise<WaiterProfile> {
  const token = getToken();
  return apiFetch<WaiterProfile>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters`,
    {
      method: "POST",
      token,
      body: JSON.stringify(dto),
    },
  );
}

/**
 * Update waiter.
 */
export async function updateWaiter(
  restaurantId: string,
  waiterId: string,
  dto: UpdateWaiterDto,
): Promise<WaiterProfile> {
  const token = getToken();
  return apiFetch<WaiterProfile>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters/${encodeURIComponent(waiterId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(dto),
    },
  );
}

/**
 * Upload waiter photo (image file).
 */
export async function uploadWaiterPhoto(
  restaurantId: string,
  waiterId: string,
  file: File,
): Promise<{ photoUrl: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<{ photoUrl: string }>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters/${encodeURIComponent(waiterId)}/photo`,
    { method: "POST", token, body: fd as any },
  );
}

/**
 * Deactivate waiter.
 */
export async function deactivateWaiter(restaurantId: string, waiterId: string): Promise<WaiterProfile> {
  const token = getToken();
  return apiFetch<WaiterProfile>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/waiters/${encodeURIComponent(waiterId)}/deactivate`,
    { method: "POST", token },
  );
}

/* =========================================================
   TABLES MANAGEMENT (Admin)
========================================================= */

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: string;
  displayName?: string | null;
  seats?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  rotation?: number | null;
  zone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTableDto {
  tableNumber: string;
  displayName?: string;
  seats?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zone?: string;
}

export interface UpdateTableDto {
  displayName?: string;
  seats?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zone?: string;
  active?: boolean;
}

/**
 * List tables for a restaurant.
 */
export async function listTables(restaurantId: string, includeInactive?: boolean): Promise<RestaurantTable[]> {
  const token = getToken();
  const qs = includeInactive ? '?includeInactive=true' : '';
  return apiFetch<RestaurantTable[]>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables${qs}`,
    { method: "GET", token },
  );
}

/**
 * Get table by ID.
 */
export async function getTable(restaurantId: string, tableId: string): Promise<RestaurantTable> {
  const token = getToken();
  return apiFetch<RestaurantTable>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}`,
    { method: "GET", token },
  );
}

/**
 * Create table.
 */
export async function createTable(restaurantId: string, dto: CreateTableDto): Promise<RestaurantTable> {
  const token = getToken();
  return apiFetch<RestaurantTable>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables`,
    {
      method: "POST",
      token,
      body: JSON.stringify(dto),
    },
  );
}

/**
 * Update table.
 */
export async function updateTable(
  restaurantId: string,
  tableId: string,
  dto: UpdateTableDto,
): Promise<RestaurantTable> {
  const token = getToken();
  return apiFetch<RestaurantTable>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(dto),
    },
  );
}

/**
 * Deactivate table.
 */
export async function deactivateTable(restaurantId: string, tableId: string): Promise<RestaurantTable> {
  const token = getToken();
  return apiFetch<RestaurantTable>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}/deactivate`,
    { method: "POST", token },
  );
}

/**
 * Permanently delete table.
 */
export async function deleteTable(restaurantId: string, tableId: string): Promise<{ ok: boolean }> {
  const token = getToken();
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables/${encodeURIComponent(tableId)}`,
    { method: "DELETE", token },
  );
}

export interface TableWithStatus extends RestaurantTable {
  occupied: boolean;
}

export interface TablesStatusResult {
  tables: TableWithStatus[];
  totalCapacity: number;
  occupiedTablesCount: number;
  availableTablesCount: number;
  occupiedSeats: number;
  availableSeats: number;
}

/**
 * Get tables with occupancy status and capacity metrics.
 */
export async function getTablesStatus(restaurantId: string): Promise<TablesStatusResult> {
  const token = getToken();
  return apiFetch<TablesStatusResult>(
    `${API_BASE}/restaurants/${encodeURIComponent(restaurantId)}/tables-status`,
    { method: "GET", token },
  );
}
