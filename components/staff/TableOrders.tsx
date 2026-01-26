"use client";

import { useEffect, useMemo, useState } from "react";
import { staffClaimOrder, staffListTableOrders, staffUpdateOrder } from "@/lib/endpoints";
import { money } from "@/lib/cart";

type OrderLine = {
  id?: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  spiceLevel?: string | null;
  spiceOnSide?: boolean;
  allergensAvoid?: string[];
  specialInstructions?: string | null;
};

type Order = {
  id: string;
  tableNumber: string;
  status: string;
  notes?: string | null;
  servingWaiterUserId?: string | null;
  lastModifiedByUserId?: string | null;
  lastModifiedAt?: string | null;
  lines: OrderLine[];
  createdAt: string;
};

function dollars(cents: number) {
  return money((Number(cents) || 0) / 100);
}

export default function TableOrders({
  restaurantId,
  tableNumber,
}: {
  restaurantId: string;
  tableNumber: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<string>("");

  const latest = useMemo(() => (orders.length ? orders[0] : null), [orders]);

  const refresh = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await staffListTableOrders(restaurantId, tableNumber, false);
      const list = Array.isArray(res) ? res : res?.orders ?? [];
      setOrders(list);
      const first = list[0] as Order | undefined;
      if (first?.notes != null) setNotes(String(first.notes));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load table orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, tableNumber]);

  const claimLatest = async () => {
    if (!latest?.id) return;
    await staffClaimOrder(restaurantId, latest.id);
    await refresh();
  };

  const setQty = async (line: OrderLine, qty: number) => {
    if (!latest?.id) return;
    const match = (l: OrderLine) =>
      (line.id && l.id ? l.id === line.id : l.menuItemId === line.menuItemId);
    const nextLines = (latest.lines || []).map((l) =>
      match(l) ? { ...l, quantity: Math.max(0, Math.min(99, qty)) } : l,
    );
    await staffUpdateOrder(restaurantId, latest.id, {
      notes,
      lines: nextLines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        spiceLevel: l.spiceLevel ?? null,
        spiceOnSide: !!l.spiceOnSide,
        allergensAvoid: l.allergensAvoid ?? [],
        specialInstructions: l.specialInstructions ?? null,
      })),
    });
    await refresh();
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-zinc-900">Table {tableNumber}</div>
          <div className="text-sm text-zinc-600">Review & adjust orders (staff)</div>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-full border px-4 py-2 text-sm font-bold text-zinc-700"
        >
          Refresh
        </button>
      </div>

      {err ? <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}

      {loading ? (
        <div className="mt-4 text-sm text-zinc-600">Loading…</div>
      ) : !latest ? (
        <div className="mt-4 rounded-2xl border p-4 text-sm text-zinc-700">No orders for this table yet.</div>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-900">Latest Order</div>
              <div className="text-xs font-semibold text-zinc-600">Status: {latest.status}</div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Order ID: {latest.id}</div>

            {(latest.servingWaiterUserId || latest.lastModifiedByUserId) && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {latest.servingWaiterUserId && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700">
                    Serving waiter: {String(latest.servingWaiterUserId).slice(0, 8)}…
                  </span>
                )}
                {latest.lastModifiedByUserId && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                    Last edited by: {String(latest.lastModifiedByUserId).slice(0, 8)}…{" "}
                    {latest.lastModifiedAt
                      ? new Date(latest.lastModifiedAt).toLocaleTimeString()
                      : ""}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={claimLatest}
                className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-extrabold"
              >
                Claim as serving waiter
              </button>
            </div>

            <div className="mt-4 divide-y">
              {(latest.lines || []).map((l) => (
                <div key={l.id || l.menuItemId} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-zinc-900">{l.name}</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {dollars(l.unitPriceCents)} each
                      {l.spiceLevel ? ` • Spice: ${l.spiceLevel}` : ""}
                      {l.spiceOnSide ? " • On side" : ""}
                    </div>
                    {l.allergensAvoid?.length ? (
                      <div className="mt-1 text-[11px] font-semibold text-rose-700">
                        Avoid: {l.allergensAvoid.join(", ")}
                      </div>
                    ) : null}
                    {l.specialInstructions ? (
                      <div className="mt-1 text-[11px] font-semibold text-zinc-600">
                        Note: {l.specialInstructions}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full border grid place-items-center"
                      onClick={() => setQty(l, (l.quantity || 0) - 1)}
                    >
                      −
                    </button>
                    <div className="w-6 text-center text-sm font-bold">{l.quantity}</div>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full border grid place-items-center"
                      onClick={() => setQty(l, (l.quantity || 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-zinc-700">Order notes (kitchen)</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                rows={3}
                placeholder="Any updates / notes for kitchen"
              />
              <button
                type="button"
                className="mt-2 w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-extrabold"
                onClick={async () => {
                  await staffUpdateOrder(restaurantId, latest.id, { notes });
                  await refresh();
                }}
              >
                Save notes
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Claim stores serving waiter; edits store last modified user + time (audit trail).
          </div>
        </>
      )}
    </div>
  );
}
