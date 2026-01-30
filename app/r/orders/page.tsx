"use client";

import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import { listRestaurants, listOrders, updateOrderStatus, getKitchenOrders, markOrderReady } from "@/lib/endpoints";
import { listWaiters } from "@/lib/api/admin";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

type KitchenOrder = {
  id: string;
  restaurantId: string;
  tableNumber: string;
  status: string;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  createdAt: string;
  servingWaiterUserId?: string | null;
  lastModifiedByUserId?: string | null;
  lastModifiedAt?: string | null;
  items?: Array<{ id: string; menuItemId: string; name: string; priceCents: number; quantity: number }>;
  lines?: Array<{ id: string; menuItemId: string; name: string; unitPriceCents: number; quantity: number }>;
};

type WaiterInfo = {
  userId: string;
  name: string;
  photoUrl?: string | null;
};

function moneyCents(cents: number, currency: string = "USD") {
  const v = Number.isFinite(cents) ? cents : 0;
  const amount = (v / 100).toFixed(2);
  return currency === "USD" ? `$${amount}` : `${amount} ${currency}`;
}

export default function OrdersPage() {
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [waiters, setWaiters] = useState<Map<string, WaiterInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const activeRestaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantId) ?? null,
    [restaurants, restaurantId]
  );

  async function loadRestaurants() {
    const rs = await listRestaurants();
    const list = (rs || []).map((r: any) => ({ id: r.id, name: r.name }));
    setRestaurants(list);
    if (!restaurantId && list[0]?.id) setRestaurantId(list[0].id);
  }

  async function loadWaiters() {
    if (!restaurantId) return;
    try {
      const waiterList = await listWaiters(restaurantId, true);
      const waiterMap = new Map<string, WaiterInfo>();
      waiterList.forEach((w) => {
        if (w.userId) {
          waiterMap.set(w.userId, {
            userId: w.userId,
            name: w.name,
            photoUrl: w.photoUrl,
          });
        }
      });
      setWaiters(waiterMap);
    } catch (e: any) {
      console.error("Failed to load waiters:", e);
    }
  }

  async function loadOrders() {
    if (!restaurantId) return;
    setErr(null);
    setLoading(true);
    try {
      // Show active kitchen workload by default. Use new kitchen endpoint.
      const data = await getKitchenOrders(restaurantId, ["PLACED", "IN_KITCHEN", "NEW", "IN_PROGRESS"]);
      const raw = (data || []) as any[];
      const normalized: KitchenOrder[] = raw
        .filter((o: any) => o.status !== "CANCELLED" && o.status !== "SERVED") // Filter out cancelled and served orders
        .map((o: any) => {
          const items = Array.isArray(o.items)
            ? o.items
            : Array.isArray(o.lines)
              ? o.lines.map((l: any) => ({
                  id: l.id,
                  menuItemId: l.menuItemId,
                  name: l.name,
                  priceCents: l.priceCents ?? l.unitPriceCents ?? 0,
                  quantity: l.quantity ?? 0,
                }))
              : [];
          return {
            ...o,
            items,
            servingWaiterUserId: o.servingWaiterUserId ?? null,
            lastModifiedByUserId: o.lastModifiedByUserId ?? null,
            lastModifiedAt: o.lastModifiedAt ?? null,
          };
        });
      setOrders(normalized);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadWaiters();
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Auto-refresh orders every 10 seconds
  useEffect(() => {
    if (!restaurantId) return;
    const interval = setInterval(() => {
      loadOrders().catch(() => undefined);
    }, 10000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  async function setStatus(orderId: string, status: string) {
    if (!restaurantId) return;
    setUpdating(orderId);
    try {
      await updateOrderStatus(restaurantId, orderId, status);
      // If cancelled, remove from list immediately
      if (status === "CANCELLED") {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        await loadOrders();
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  function getWaiterInfo(userId: string | null | undefined): WaiterInfo | null {
    if (!userId) return null;
    return waiters.get(userId) || null;
  }

  return (
    <AppShell activeHref="/r/orders">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-2xl font-semibold">Kitchen Orders</div>
            <div className="text-sm text-zinc-600">
              New orders from QR menu users show up here.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={loadOrders}>
              Refresh
            </Button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : null}

          {!loading && orders.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-600">
              No active orders for {activeRestaurant?.name ?? "this restaurant"}. Orders will appear here when customers place them.
            </div>
          ) : null}

          {orders.map((o) => {
            const waiter = getWaiterInfo(o.servingWaiterUserId);
            const isUpdating = updating === o.id;
            return (
              <div
                key={o.id}
                className={clsx(
                  "rounded-2xl border bg-white p-4 transition",
                  (o.status === "DONE" || o.status === "READY") && "border-green-300 bg-green-50",
                  (o.status === "IN_PROGRESS" || o.status === "IN_KITCHEN") && "border-yellow-300 bg-yellow-50",
                  (o.status === "NEW" || o.status === "PLACED") && "border-blue-300 bg-blue-50",
                  o.status === "SERVING" && "border-emerald-300 bg-emerald-50"
                )}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-semibold text-zinc-900">
                        Table {o.tableNumber}
                      </div>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          (o.status === "NEW" || o.status === "PLACED")
                            ? "bg-blue-100 text-blue-800"
                            : (o.status === "IN_PROGRESS" || o.status === "IN_KITCHEN")
                              ? "bg-yellow-100 text-yellow-800"
                              : (o.status === "DONE" || o.status === "READY")
                                ? "bg-green-100 text-green-800"
                                : o.status === "SERVING"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.status === "SERVED"
                                    ? "bg-emerald-200 text-emerald-900"
                                    : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {o.status === "DONE" || o.status === "READY" ? "Ready" : 
                         o.status === "PLACED" ? "Placed" :
                         o.status === "IN_KITCHEN" ? "In Kitchen" :
                         o.status === "SERVING" ? "Serving" :
                         o.status === "SERVED" ? "Served" : o.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                    {waiter && (
                      <div className="flex items-center gap-2 mt-2">
                        {waiter.photoUrl ? (
                          <img
                            src={waiter.photoUrl}
                            alt={waiter.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-semibold">
                            {waiter.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-zinc-600">
                          Serving: <span className="font-semibold">{waiter.name}</span>
                        </span>
                      </div>
                    )}
                    {o.lastModifiedByUserId && (
                      <div className="text-xs text-zinc-500 mt-1">
                        Last edited: {new Date(o.lastModifiedAt || o.createdAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    {moneyCents(o.totalCents, o.currency)}
                  </div>
                </div>

              <div className="mt-3 divide-y">
                {(o.items ?? []).map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-900 truncate">
                        {it.quantity}× {it.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {moneyCents(it.priceCents, o.currency)} each
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {moneyCents(it.priceCents * it.quantity, o.currency)}
                    </div>
                  </div>
                ))}
              </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(o.status === "PLACED" || o.status === "NEW") && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        setUpdating(o.id);
                        try {
                          await updateOrderStatus(restaurantId, o.id, "IN_KITCHEN");
                          await loadOrders();
                        } catch (e: any) {
                          alert(e?.message ?? "Failed to update status");
                        } finally {
                          setUpdating(null);
                        }
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Start Cooking"}
                    </Button>
                  )}
                  {(o.status === "IN_PROGRESS" || o.status === "IN_KITCHEN") && (
                    <Button
                      onClick={async () => {
                        setUpdating(o.id);
                        try {
                          await markOrderReady(restaurantId, o.id);
                          await loadOrders();
                        } catch (e: any) {
                          alert(e?.message ?? "Failed to mark ready");
                        } finally {
                          setUpdating(null);
                        }
                      }}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? "Updating..." : "Mark Ready"}
                    </Button>
                  )}
                  {o.status !== "DONE" && o.status !== "READY" && o.status !== "SERVED" && o.status !== "SERVING" && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this order?")) {
                          setStatus(o.id, "CANCELLED");
                        }
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  )}
                  {(o.status === "DONE" || o.status === "READY") && (
                    <div className="text-xs text-green-700 font-semibold">
                      ✓ Ready - On the way to table
                    </div>
                  )}
                  {o.status === "SERVING" && (
                    <div className="text-xs text-emerald-700 font-semibold">
                      🚶 Serving - Waiter is bringing it
                    </div>
                  )}
                  {o.status === "SERVED" && (
                    <div className="text-xs text-emerald-800 font-semibold">
                      ✓ Served to customer
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
