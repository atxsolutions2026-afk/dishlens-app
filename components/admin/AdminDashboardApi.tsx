"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import {
  listRestaurants,
  adminMenu,
  staffListOrders,
  listTables,
  listWaiters,
} from "@/lib/api/admin";
import { getToken } from "@/lib/auth";
import { useEffect, useState } from "react";

type DashboardStats = {
  restaurantId: string | null;
  restaurantName: string;
  slug: string;
  menuStatus: "LIVE" | "EMPTY" | "SETUP";
  categories: number;
  items: number;
  ordersToday: number;
  pendingOrders: number;
  tables: number;
  waiters: number;
};

function StatCard({
  title,
  value,
  href,
  tone = "neutral",
}: {
  title: string;
  value: string | number;
  href?: string;
  tone?: "neutral" | "success" | "warning" | "action";
}) {
  const bg =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : tone === "action"
          ? "bg-blue-500"
          : "bg-zinc-600";
  const content = (
    <div className={`rounded-2xl p-4 text-white shadow-sm ${bg}`}>
      <div className="text-xs font-medium text-white/90">{title}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
  if (href) {
    return <Link href={href} className="block transition hover:opacity-90">{content}</Link>;
  }
  return content;
}

export default function AdminDashboardApi() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    restaurantId: null,
    restaurantName: "",
    slug: "",
    menuStatus: "SETUP",
    categories: 0,
    items: 0,
    ordersToday: 0,
    pendingOrders: 0,
    tables: 0,
    waiters: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        window.location.href = "/r/login";
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const list = await listRestaurants();
        const first = Array.isArray(list)
          ? list[0]
          : (list as any)?.items?.[0] ?? (list as any)?.data?.[0];
        const id = first?.id;
        if (!id) {
          throw new Error("No restaurants found. Create a restaurant first.");
        }

        const [menuRes, ordersRes, tablesRes, waitersRes] = await Promise.allSettled([
          adminMenu(id),
          staffListOrders(id),
          listTables(id),
          listWaiters(id, false),
        ]);

        if (cancelled) return;

        const menu = menuRes.status === "fulfilled" ? menuRes.value : null;
        const orders = ordersRes.status === "fulfilled" ? ordersRes.value : [];
        const tables = tablesRes.status === "fulfilled" ? tablesRes.value : [];
        const waiters = waitersRes.status === "fulfilled" ? waitersRes.value : [];

        const cats = menu?.categories ?? menu?.menu?.categories ?? menu?.data?.categories ?? [];
        const categoriesArr = Array.isArray(cats) ? cats : [];
        let itemsCount = 0;
        for (const c of categoriesArr) {
          const items = c?.items ?? c?.menuItems ?? c?.dishes ?? [];
          itemsCount += Array.isArray(items) ? items.length : 0;
        }

        const ordersArr = Array.isArray(orders) ? orders : (orders as any)?.items ?? (orders as any)?.data ?? [];
        const today = new Date().toDateString();
        const ordersToday = ordersArr.filter(
          (o: any) => o?.createdAt && new Date(o.createdAt).toDateString() === today
        ).length;
        const pendingOrders = ordersArr.filter(
          (o: any) => o?.status === "NEW" || o?.status === "IN_PROGRESS"
        ).length;

        const tablesArr = Array.isArray(tables) ? tables : [];
        const waitersArr = Array.isArray(waiters) ? waiters : [];

        const menuStatus =
          itemsCount > 0 ? "LIVE" : categoriesArr.length > 0 ? "SETUP" : "EMPTY";

        setStats({
          restaurantId: id,
          restaurantName: first?.name ?? "Your restaurant",
          slug: (first?.slug ?? "").trim(),
          menuStatus,
          categories: categoriesArr.length,
          items: itemsCount,
          ordersToday,
          pendingOrders,
          tables: tablesArr.length,
          waiters: waitersArr.length,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          <p className="text-sm text-zinc-500">Loading your dashboard…</p>
        </div>
      </Container>
    );
  }

  if (err) {
    return (
      <Container>
        <Panel className="border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">{err}</p>
          <p className="mt-1 text-sm text-red-600">
            Check that you’re logged in and your restaurant is set up.
          </p>
        </Panel>
      </Container>
    );
  }

  const previewHref = stats.slug ? `/m/${encodeURIComponent(stats.slug)}` : null;

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {stats.restaurantName} · Menu, orders, and operations at a glance
        </p>
      </div>

      {/* Focus: what needs attention first */}
      {(stats.pendingOrders > 0 || stats.menuStatus === "EMPTY") && (
        <Panel className="mb-6 border-l-4 border-l-amber-500 bg-amber-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {stats.pendingOrders > 0 && (
                <p className="text-sm font-medium text-amber-900">
                  {stats.pendingOrders} order{stats.pendingOrders !== 1 ? "s" : ""} waiting in the kitchen
                </p>
              )}
              {stats.menuStatus === "EMPTY" && (
                <p className="text-sm font-medium text-amber-900">
                  Add categories and dishes to turn your menu live
                </p>
              )}
            </div>
            {stats.pendingOrders > 0 && (
              <Link href="/r/orders">
                <Button>Open Kitchen</Button>
              </Link>
            )}
          </div>
        </Panel>
      )}

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Menu"
          value={stats.menuStatus}
          tone={stats.menuStatus === "LIVE" ? "success" : stats.menuStatus === "EMPTY" ? "warning" : "neutral"}
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          href="/r/menu"
          tone="neutral"
        />
        <StatCard
          title="Dishes"
          value={stats.items}
          href="/r/menu"
          tone="neutral"
        />
        <StatCard
          title="Orders today"
          value={stats.ordersToday}
          href="/r/orders"
          tone="action"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          title="Pending (to prepare)"
          value={stats.pendingOrders}
          href="/r/orders"
          tone={stats.pendingOrders > 0 ? "warning" : "neutral"}
        />
        <StatCard title="Tables" value={stats.tables} href="/r/tables" tone="neutral" />
        <StatCard title="Waiters" value={stats.waiters} href="/r/waiters" tone="neutral" />
      </div>

      {/* Quick actions */}
      <Panel className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quick actions
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/r/menu">
            <Button className="w-full" variant="secondary">
              Edit menu
            </Button>
          </Link>
          <Link href="/r/orders">
            <Button className="w-full" variant="secondary">
              Kitchen / orders
            </Button>
          </Link>
          <Link href="/r/uploads">
            <Button className="w-full" variant="secondary">
              Upload photos & videos
            </Button>
          </Link>
          <Link href="/r/qr">
            <Button className="w-full" variant="secondary">
              Generate QR codes
            </Button>
          </Link>
          <Link href="/r/branding">
            <Button className="w-full" variant="secondary">
              Branding & appearance
            </Button>
          </Link>
          {previewHref ? (
            <a href={previewHref} target="_blank" rel="noopener noreferrer">
              <Button className="w-full" variant="secondary">
                Preview customer menu ↗
              </Button>
            </a>
          ) : (
            <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              Set a menu slug to enable preview
            </span>
          )}
        </div>
      </Panel>

      {/* Short tip */}
      <p className="mt-6 text-center text-xs text-zinc-400">
        Fewer clicks = faster service. Use the nav to jump to Menu, Kitchen, Tables, or QR.
      </p>
    </Container>
  );
}
