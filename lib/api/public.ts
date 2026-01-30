/**
 * Public (Customer) API endpoints
 * These endpoints are accessible without authentication.
 */

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { CartLine } from "@/lib/cart";

const API_BASE = apiBaseUrl();

/**
 * Get public menu for a restaurant by slug.
 */
export async function publicMenu(slug: string) {
  return apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/menu`,
    {
      method: "GET",
    },
  );
}

/**
 * Create a public order (customer order).
 * Requires tableSessionId and sessionSecret for security.
 */
export type CreatePublicOrderPayload = {
  tableSessionId: string;
  sessionSecret: string; // Required for secure order creation
  deviceId?: string;
  lines: ReturnType<typeof orderLinesFromCart>;
  notes?: string;
};

export async function createPublicOrder(slug: string, payload: CreatePublicOrderPayload) {
  return apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/orders`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Get public order status by order ID and optional token.
 */
export async function getPublicOrder(
  slug: string,
  orderId: string,
  orderToken?: string | null,
) {
  const qs = orderToken ? `?token=${encodeURIComponent(orderToken)}` : "";
  return apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}${qs}`,
    { method: "GET" },
  );
}

/**
 * Call waiter (customer at table).
 * Requires tableSessionId + sessionSecret. Rate limited: 3 calls per 10 min per session.
 */
export async function callWaiter(payload: {
  tableSessionId: string;
  sessionSecret: string;
  deviceId?: string;
  note?: string;
}) {
  return apiFetch<{ id: string; tableId: string; tableNumber?: string; status: string; requestedAt: string }>(
    `${API_BASE}/public/waiter-calls`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Get orders for a table session (customer view).
 */
export async function getTableOrders(
  slug: string,
  tableSessionId: string,
  token?: string | null,
) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return apiFetch<any[]>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/table/${encodeURIComponent(tableSessionId)}/orders${qs}`,
    { method: "GET" },
  );
}

/**
 * Get current waiter call status for table session.
 */
export async function getCurrentWaiterCall(
  slug: string,
  tableSessionId: string,
  token: string,
) {
  const qs = new URLSearchParams({
    tableSessionId,
    token,
  }).toString();
  return apiFetch<{
    status: string | null;
    call: {
      id: string;
      status: string;
      requestedAt: string;
      acceptedAt?: string | null;
      closedAt?: string | null;
      acceptedBy: { userId: string; name: string } | null;
    } | null;
  }>(`${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/waiter-calls/current?${qs}`, {
    method: "GET",
  });
}

/**
 * Get current servicing waiter and active call status for a table session.
 * Poll after "Call waiter" to see when a waiter accepts and is on the way.
 */
export async function getTableService(
  tableSessionId: string,
  sessionSecret: string,
) {
  const qs = new URLSearchParams({
    tableSessionId,
    sessionSecret,
  }).toString();
  return apiFetch<{
    waiter: { userId: string; name: string; photoUrl?: string | null; assignedAt: string } | null;
    tableNumber: string;
    activeCall?: {
      callId: string;
      status: string;
      acceptedBy: { userId: string; name: string; photoUrl?: string | null } | null;
    } | null;
  }>(`${API_BASE}/public/table-service?${qs}`, { method: "GET" });
}

/**
 * Rate a menu item (public, no auth required).
 */
export async function rateMenuItem(
  menuItemId: string,
  stars: number,
  comment?: string | null,
) {
  return apiFetch<any>(
    `${API_BASE}/public/menu-items/${encodeURIComponent(menuItemId)}/rating`,
    {
      method: "POST",
      body: JSON.stringify({
        stars,
        comment: comment ?? null,
      }),
    },
  );
}

/**
 * Convert cart lines to order lines format for API.
 */
export function orderLinesFromCart(lines: CartLine[]) {
  return lines.map((l) => ({
    menuItemId: l.menuItemId,
    quantity: l.quantity,
    spiceLevel: l.modifiers?.spiceLevel ?? null,
    spiceOnSide: !!l.modifiers?.spiceOnSide,
    allergensAvoid: l.modifiers?.allergensAvoid ?? [],
    specialInstructions: l.modifiers?.specialInstructions ?? null,
  }));
}
