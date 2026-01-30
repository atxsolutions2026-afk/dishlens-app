"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";
import { listPlatformRestaurants } from "@/lib/api/platform";
import type { PlatformRestaurant } from "@/lib/api/platform";
import Link from "next/link";
import { clsx } from "clsx";

export default function PlatformDashboardPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<PlatformRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    terminated: 0,
  });

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/platform/login");
      return;
    }

    const hasPlatformAccess = user.roles?.some((r: string) => isPlatformRole(r));
    if (!hasPlatformAccess) {
      router.push("/platform/login");
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      const data = await listPlatformRestaurants();
      setRestaurants(data);
      
      setStats({
        total: data.length,
        active: data.filter((r) => r.status === 'ACTIVE').length,
        suspended: data.filter((r) => r.status === 'SUSPENDED').length,
        terminated: data.filter((r) => r.status === 'TERMINATED').length,
      });
    } catch (e: any) {
      console.error("Failed to load restaurants:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlatformShell activeHref="/platform/dashboard">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage restaurants, subscriptions, and features</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-zinc-600">Total Restaurants</div>
            <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="text-sm font-medium text-green-700">Active</div>
            <div className="mt-2 text-3xl font-bold text-green-900">{stats.active}</div>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
            <div className="text-sm font-medium text-yellow-700">Suspended</div>
            <div className="mt-2 text-3xl font-bold text-yellow-900">{stats.suspended}</div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="text-sm font-medium text-red-700">Terminated</div>
            <div className="mt-2 text-3xl font-bold text-red-900">{stats.terminated}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/platform/restaurants"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View All Restaurants →
          </Link>
        </div>

        {/* Recent Restaurants */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-zinc-900">Recent Restaurants</h2>
          </div>
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-500">Loading...</div>
          ) : restaurants.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-zinc-500">
              No restaurants yet. <Link href="/platform/restaurants" className="text-blue-600 hover:underline">Create one</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {restaurants.slice(0, 5).map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/platform/restaurants/${restaurant.id}`}
                  className="block px-6 py-4 hover:bg-zinc-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">{restaurant.name}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {restaurant.city && restaurant.state && `${restaurant.city}, ${restaurant.state}`}
                        {restaurant.slug && ` • ${restaurant.slug}`}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        restaurant.status === 'ACTIVE'
                          ? "bg-green-100 text-green-800"
                          : restaurant.status === 'SUSPENDED'
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      )}
                    >
                      {restaurant.status || 'ACTIVE'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformShell>
  );
}
