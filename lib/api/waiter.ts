/**
 * Waiter API endpoints
 * These endpoints require waiter authentication (WAITER role).
 */

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { getToken } from "@/lib/auth";

const API_BASE = apiBaseUrl();

export interface WaiterProfile {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string | null;
  restaurantId: string;
  active: boolean;
}

export interface TableWithStatus {
  id: string;
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
  currentWaiter?: {
    userId: string;
    name: string;
    assignedAt: string;
  } | null;
  openCallsCount: number;
  activeOrdersCount: number;
}

export interface WaiterCall {
  id: string;
  tableId: string;
  tableNumber: string;
  requestedAt: string;
  acceptedAt?: string | null;
  closedAt?: string | null;
  status: string; // REQUESTED, OPEN, ACCEPTED, CLOSED, HANDLED, CANCELLED
  note?: string | null;
  isMyTable?: boolean; // true if table is assigned to this waiter
  handledByUserId?: string | null; // Waiter who accepted/handled the call
}

export interface TableOrders {
  tableId: string;
  tableNumber: string;
  orders: Array<{
    id: string;
    status: string;
    items: any[];
    totalCents: number;
    createdAt: string;
    servingWaiterUserId?: string | null;
  }>;
}

/**
 * Get waiter profile.
 */
export async function getWaiterProfile(): Promise<WaiterProfile> {
  const token = getToken();
  return apiFetch<WaiterProfile>(`${API_BASE}/waiter/me`, {
    method: "GET",
    token,
  });
}

/**
 * Get floor map with tables and their status.
 */
export async function getWaiterFloorMap(restaurantId?: string): Promise<{ tables: TableWithStatus[] }> {
  const token = getToken();
  const qs = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return apiFetch<{ tables: TableWithStatus[] }>(`${API_BASE}/waiter/floor-map${qs}`, {
    method: "GET",
    token,
  });
}

/**
 * Claim a table as serving waiter.
 */
export async function claimTable(tableId: string): Promise<{
  id: string;
  tableId: string;
  waiterUserId: string;
  assignedAt: string;
  table: {
    tableNumber: string;
    displayName?: string | null;
  };
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/tables/${encodeURIComponent(tableId)}/claim`, {
    method: "POST",
    token,
  });
}

/**
 * Take over a table from another waiter.
 */
export async function takeOverTable(
  tableId: string,
  reason?: string,
): Promise<{
  id: string;
  tableId: string;
  waiterUserId: string;
  takeoverFromUserId?: string | null;
  takeoverReason?: string | null;
  assignedAt: string;
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/tables/${encodeURIComponent(tableId)}/takeover`, {
    method: "POST",
    token,
    body: JSON.stringify({ reason }),
  });
}

/**
 * Release a table assignment.
 */
export async function releaseTable(tableId: string): Promise<{
  id: string;
  releasedAt: string;
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/tables/${encodeURIComponent(tableId)}/release`, {
    method: "POST",
    token,
  });
}

/**
 * Get orders for a table.
 */
export async function getTableOrders(tableId: string): Promise<TableOrders> {
  const token = getToken();
  return apiFetch<TableOrders>(`${API_BASE}/waiter/tables/${encodeURIComponent(tableId)}/orders`, {
    method: "GET",
    token,
  });
}

/**
 * Get open waiter calls for assigned tables.
 */
export async function getWaiterCalls(status?: string): Promise<{ calls: WaiterCall[] }> {
  const token = getToken();
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<{ calls: WaiterCall[] }>(`${API_BASE}/waiter/calls${qs}`, {
    method: "GET",
    token,
  });
}

/**
 * Accept a waiter call (waiter on the way). Only for OPEN calls.
 */
export async function acceptWaiterCall(callId: string): Promise<{
  id: string;
  status: string;
  handledByUserId: string;
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/calls/${encodeURIComponent(callId)}/accept`, {
    method: "POST",
    token,
  });
}

/**
 * Close a waiter call (done). Only for calls this waiter accepted.
 */
export async function closeWaiterCall(callId: string): Promise<{
  id: string;
  status: string;
  closedAt: string;
  handledByUserId: string;
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/calls/${encodeURIComponent(callId)}/close`, {
    method: "POST",
    token,
  });
}

/**
 * Mark a waiter call as handled (done). Only for calls this waiter accepted.
 * @deprecated Use closeWaiterCall instead
 */
export async function handleWaiterCall(callId: string): Promise<{
  id: string;
  status: string;
  handledAt: string;
  handledByUserId: string;
}> {
  const token = getToken();
  return apiFetch(`${API_BASE}/waiter/calls/${encodeURIComponent(callId)}/handle`, {
    method: "POST",
    token,
  });
}

/**
 * Get ready orders for waiter dashboard.
 */
export async function getReadyOrders(restaurantId: string): Promise<any[]> {
  const token = getToken();
  return apiFetch<any[]>(
    `${API_BASE}/waiter/orders?restaurantId=${encodeURIComponent(restaurantId)}&status=READY`,
    {
      method: "GET",
      token,
    },
  );
}

/**
 * Mark order as serving (waiter claims and starts serving).
 */
export async function markOrderServing(
  restaurantId: string,
  orderId: string,
): Promise<any> {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/waiter/orders/${encodeURIComponent(orderId)}/mark-serving?restaurantId=${encodeURIComponent(restaurantId)}`,
    {
      method: "POST",
      token,
    },
  );
}

/**
 * Mark order as served (waiter delivered to customer).
 */
export async function markOrderServed(
  restaurantId: string,
  orderId: string,
): Promise<any> {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/waiter/orders/${encodeURIComponent(orderId)}/mark-served?restaurantId=${encodeURIComponent(restaurantId)}`,
    {
      method: "POST",
      token,
    },
  );
}

/**
 * Create order by waiter (source = WAITER).
 */
export async function createWaiterOrder(
  restaurantId: string,
  payload: {
    tableNumber: string;
    tableSessionId?: string | null;
    lines: Array<{
      menuItemId: string;
      quantity: number;
      spiceLevel?: string | null;
      spiceOnSide?: boolean;
      allergensAvoid?: string[];
      specialInstructions?: string | null;
    }>;
    notes?: string;
  },
): Promise<any> {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/waiter/orders/create?restaurantId=${encodeURIComponent(restaurantId)}`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );
}
