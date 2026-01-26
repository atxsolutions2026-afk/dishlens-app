"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import { useEffect, useMemo, useState } from "react";
import {
  adminMenu,
  listRestaurants,
  restaurantRatingsSummary,
} from "@/lib/endpoints";
import { getToken } from "@/lib/auth";
import { normalizePublicMenu } from "@/lib/menuAdapter";

type Row = {
  id: string;
  name: string;
  category?: string;
  avgRating?: number;
  ratingCount?: number;
};

function toNumberOrUndef(v: any): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function AdminRatingsApi() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        window.location.href = "/r/login";
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const list = await listRestaurants();
        const arr = Array.isArray(list)
          ? list
          : (list?.items ?? list?.data ?? []);
        setRestaurants(arr);
        if (arr?.[0]?.id) setRestaurantId(arr[0].id);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!restaurantId) return;
      setLoading(true);
      setErr(null);

      try {
        // Prefer the explicit ratings summary endpoint (if backend implements it)
        try {
          const summary = await restaurantRatingsSummary(restaurantId);
          const items = summary?.items ?? summary?.data ?? summary ?? [];

          if (Array.isArray(items) && items.length) {
            setRows(
              items.map((i: any) => {
                const avg =
                  typeof i?.avgRating === "number"
                    ? i.avgRating
                    : toNumberOrUndef(i?.ratingAvg);

                const cnt =
                  typeof i?.ratingCount === "number"
                    ? i.ratingCount
                    : toNumberOrUndef(i?.ratingsCount);

                return {
                  id: String(i?.id ?? i?.menuItemId ?? ""),
                  name: String(i?.name ?? ""),
                  category:
                    String(i?.categoryName ?? i?.category ?? "") || undefined,
                  avgRating: avg ?? undefined,
                  ratingCount: cnt ?? undefined,
                } as Row;
              }),
            );
            setLoading(false);
            return;
          }
        } catch {
          // ignore and fall back to menu endpoint
        }

        // Fallback: use adminMenu and rely on avgRating/ratingCount per item.
        // ✅ Type-safe: pull category label from the category loop, not d.categoryName
        const menu = await adminMenu(restaurantId);
        const norm = normalizePublicMenu(menu);

        const fallbackRows: Row[] = norm.categories.flatMap((c: any) => {
          const categoryLabel =
            String(c?.name ?? c?.categoryName ?? c?.title ?? "") || undefined;

          const items = Array.isArray(c?.items) ? c.items : [];
          return items.map((d: any) => ({
            id: String(d?.id ?? ""),
            name: String(d?.name ?? ""),
            category: categoryLabel,
            // ratings might be null -> convert to undefined
            avgRating: d?.avgRating ?? undefined,
            ratingCount: d?.ratingCount ?? undefined,
          }));
        });

        setRows(fallbackRows);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load ratings");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows
      .slice()
      .sort(
        (a, b) =>
          (b.avgRating ?? 0) - (a.avgRating ?? 0) ||
          (b.ratingCount ?? 0) - (a.ratingCount ?? 0),
      );
    if (!q) return base;
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-3xl font-black tracking-tight">Ratings</div>
          <div className="mt-1 text-sm text-zinc-600">
            See how customers are rating your dishes.
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/r/uploads")}
          >
            Upload Media
          </Button>
        </div>
      </div>

      {err && (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">
          {err}
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-1">
          <div className="text-sm font-bold">Restaurant</div>
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="mt-3 w-full rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Select a restaurant…</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.city ? ` — ${r.city}` : ""}
              </option>
            ))}
          </select>

          <div className="mt-4 text-sm font-bold">Search</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dish name or category..."
            className="mt-3 w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
          />

          <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-xs text-zinc-600">
            If ratings are empty, wire backend endpoints:
            <div className="mt-2">
              <code className="px-1 bg-white border rounded">
                POST /public/menu-items/:id/rating
              </code>
            </div>
            <div className="mt-1">
              <code className="px-1 bg-white border rounded">
                GET /restaurants/:id/ratings
              </code>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">Top dishes</div>
            <div className="text-xs text-zinc-500">Sorted by rating</div>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-zinc-600">Loading ratings…</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500">
                    <th className="py-2 pr-2">Dish</th>
                    <th className="py-2 pr-2">Category</th>
                    <th className="py-2 pr-2">Avg</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-2 font-semibold text-zinc-900">
                        {r.name}
                      </td>
                      <td className="py-2 pr-2 text-zinc-600">
                        {r.category || "—"}
                      </td>
                      <td className="py-2 pr-2 text-zinc-900">
                        {typeof r.avgRating === "number"
                          ? (Math.round(r.avgRating * 10) / 10).toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-2 text-zinc-900">
                        {typeof r.ratingCount === "number"
                          ? r.ratingCount
                          : "—"}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 ? (
                    <tr>
                      <td className="py-6 text-zinc-600" colSpan={4}>
                        No ratings data yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </Container>
  );
}
