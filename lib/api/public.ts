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
