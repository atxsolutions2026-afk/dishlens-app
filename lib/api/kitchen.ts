/**
 * Kitchen API endpoints
 * These endpoints require kitchen/staff authentication.
 */

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { getToken } from "@/lib/auth";

const API_BASE = apiBaseUrl();

/**
 * Get orders for kitchen dashboard.
 */
export async function getKitchenOrders(
  restaurantId: string,
  status?: string[],
) {
  const token = getToken();
  const statuses = status?.join(",") || "PLACED,IN_KITCHEN";
  return apiFetch<any[]>(
    `${API_BASE}/kitchen/orders?restaurantId=${encodeURIComponent(restaurantId)}&status=${encodeURIComponent(statuses)}`,
    {
      method: "GET",
      token,
    },
  );
}

/**
 * Mark order as ready (kitchen).
 */
export async function markOrderReady(
  restaurantId: string,
  orderId: string,
) {
  const token = getToken();
  return apiFetch<any>(
    `${API_BASE}/kitchen/orders/${encodeURIComponent(orderId)}/mark-ready?restaurantId=${encodeURIComponent(restaurantId)}`,
    {
      method: "POST",
      token,
    },
  );
}
