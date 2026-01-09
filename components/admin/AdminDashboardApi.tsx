"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { listRestaurants, adminMenu } from "@/lib/endpoints";
import { getToken } from "@/lib/auth";

function StatCard({
  title,
  value,
  tone
}: {
  title: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const bg =
    tone === "success"
      ? "bg-emerald-600"
      : tone === "warning"
      ? "bg-amber-600"
      : tone === "danger"
      ? "bg-red-600"
      : "bg-zinc-900";
  return (
    <div className={clsx("rounded-3xl p-5 text-white shadow-soft", bg)}>
      <div className="text-xs font-semibold text-white/85">{title}</div>
      <div className="mt-1 text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}

export default function AdminDashboardApi() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [menuCounts, setMenuCounts] = useState<{ categories: number; items: number }>({
    categories: 0,
    items: 0
  });

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        window.location.href = "/login";
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const list = await listRestaurants();
        const first = Array.isArray(list) ? list[0] : (list?.items?.[0] ?? list?.data?.[0]);
        const id = first?.id;
        if (!id) throw new Error("No restaurants found. Create a restaurant first.");
        setRestaurantId(id);
        setRestaurantName(first?.name ?? "Restaurant");

        const menu = await adminMenu(id);
        const cats = menu?.categories || menu?.menu?.categories || menu?.data?.categories || [];
        const categoriesCount = Array.isArray(cats) ? cats.length : 0;
        let itemsCount = 0;
        if (Array.isArray(cats)) {
          for (const c of cats) {
            const items = c?.items || c?.menuItems || c?.dishes || [];
            if (Array.isArray(items)) itemsCount += items.length;
          }
        }
        setMenuCounts({ categories: categoriesCount, items: itemsCount });
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-3xl font-black tracking-tight">Admin Dashboard</div>
          <div className="mt-1 text-sm text-zinc-600">
            Manage menus, uploads and QR codes for{" "}
            <span className="font-semibold">{restaurantName || "your restaurant"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => (window.location.href = "/admin/dish/demo/edit")}>
            Upload Media
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/admin/qr")}>
            Generate QR
          </Button>
        </div>
      </div>

      {loading && <Panel className="p-4 text-sm text-zinc-600">Loading admin dashboard...</Panel>}

      {err && (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">{err}</Panel>
      )}

      {!loading && !err && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Menu Status" value="LIVE" tone="success" />
            <StatCard title="Categories" value={String(menuCounts.categories)} tone="warning" />
            <StatCard title="Items" value={String(menuCounts.items)} tone="danger" />
            <StatCard title="Uploads Today" value="—" tone="neutral" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">Operational Overview</div>
                <Badge>API wired</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-500">Restaurant Id</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-800 break-all">{restaurantId}</div>
                </div>
                <div className="rounded-2xl border bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-500">Next step</div>
                  <div className="mt-1 text-sm text-zinc-700">
                    Wire editing fields to{" "}
                    <code className="px-1 bg-white border rounded">PATCH /restaurants/:rid/menu/items/:itemId</code>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-zinc-600">
                When you add analytics endpoints, this panel becomes a live “views / scans / top dishes” chart.
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="text-sm font-bold">Quick Actions</div>
              <div className="mt-3 grid gap-2">
                <Button className="w-full" onClick={() => (window.location.href = "/admin/dish/demo/edit")}>
                  Upload dish image/video
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => (window.location.href = "/admin/qr")}>
                  Generate QR code
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => (window.location.href = "/customer")}>
                  Preview customer menu
                </Button>
              </div>

              <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
                Tip: keep the admin experience fast — fewer clicks = higher restaurant adoption.
              </div>
            </Panel>
          </div>
        </>
      )}
    </Container>
  );
}
