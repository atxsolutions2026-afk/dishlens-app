"use client";

import AppShell from "@/components/AppShell";
import TableOrders from "@/components/staff/TableOrders";
import { listRestaurants } from "@/lib/endpoints";
import { getToken } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function WaiterPage() {
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        window.location.href = "/r/login";
        return;
      }
      try {
        const rs = await listRestaurants();
        const list = (Array.isArray(rs) ? rs : rs?.items ?? rs?.data ?? []).map(
          (r: any) => ({ id: r.id, name: r.name ?? r.id }),
        );
        setRestaurants(list);
        if (!restaurantId && list[0]?.id) setRestaurantId(list[0].id);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AppShell activeHref="/r/waiter">
        <main className="mx-auto max-w-lg px-4 py-8">
          <div className="text-sm text-zinc-500">Loading…</div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/r/waiter">
      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6">
          <div className="text-2xl font-bold text-zinc-900">Waiter</div>
          <div className="mt-1 text-sm text-zinc-600">
            View & edit orders by table. Claim as serving waiter; edits are attributed to you.
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              Restaurant
            </label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">Select…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              Table
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value.trim())}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </div>

        {restaurantId && tableNumber ? (
          <TableOrders restaurantId={restaurantId} tableNumber={tableNumber} />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
            Select a restaurant and enter a table number to view orders.
          </div>
        )}
      </main>
    </AppShell>
  );
}
