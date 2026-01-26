"use client";

import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import { listRestaurants, listOrders, updateOrderStatus } from "@/lib/endpoints";
import { useEffect, useMemo, useState } from "react";

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

function moneyCents(cents: number, currency: string = "USD") {
  const v = Number.isFinite(cents) ? cents : 0;
  const amount = (v / 100).toFixed(2);
  return currency === "USD" ? `$${amount}` : `${amount} ${currency}`;
}

export default function OrdersPage() {
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(false);
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

  async function loadOrders() {
    if (!restaurantId) return;
    setErr(null);
    setLoading(true);
    try {
      // Show active kitchen workload by default. Also auto-ack NEW -> IN_PROGRESS
      // when the kitchen dashboard loads (no extra clicks).
      const data = await listOrders(restaurantId, {
        status: ["NEW", "IN_PROGRESS"],
        autoAck: true,
      });
      const raw = (data || []) as any[];
      const normalized: KitchenOrder[] = raw.map((o: any) => {
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
    loadOrders().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function setStatus(orderId: string, status: string) {
    if (!restaurantId) return;
    try {
      await updateOrderStatus(restaurantId, orderId, status);
      await loadOrders();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to update order");
    }
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
              No orders yet for {activeRestaurant?.name ?? "this restaurant"}.
            </div>
          ) : null}

          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Table {o.tableNumber} · <span className="text-zinc-600">{o.status}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(o.createdAt).toLocaleString()}
                    {o.servingWaiterUserId && (
                      <> · Serving: {String(o.servingWaiterUserId).slice(0, 8)}…</>
                    )}
                    {o.lastModifiedByUserId && (
                      <> · Edited: {String(o.lastModifiedByUserId).slice(0, 8)}…</>
                    )}
                  </div>
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
                <Button variant="secondary" onClick={() => setStatus(o.id, "IN_PROGRESS")}>
                  In Progress
                </Button>
                <Button onClick={() => setStatus(o.id, "DONE")}>
                  Done
                </Button>
                <Button variant="danger" onClick={() => setStatus(o.id, "CANCELLED")}>
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
