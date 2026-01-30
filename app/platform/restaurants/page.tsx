"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";
import { listPlatformRestaurants, createPlatformRestaurant } from "@/lib/api/platform";
import type { PlatformRestaurant, CreateRestaurantDto } from "@/lib/api/platform";
import Link from "next/link";
import { clsx } from "clsx";
import Button from "@/components/ui/Button";

export default function PlatformRestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<PlatformRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

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

    loadRestaurants();
  }, [router, statusFilter]);

  async function loadRestaurants() {
    try {
      const data = await listPlatformRestaurants(statusFilter || undefined);
      setRestaurants(data);
    } catch (e: any) {
      console.error("Failed to load restaurants:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(dto: CreateRestaurantDto) {
    setCreating(true);
    try {
      await createPlatformRestaurant(dto);
      setShowCreateModal(false);
      loadRestaurants();
    } catch (e: any) {
      alert(e?.message || "Failed to create restaurant");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PlatformShell activeHref="/platform/restaurants">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Restaurants</h1>
            <p className="mt-1 text-sm text-zinc-600">Manage all restaurant clients</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Create Restaurant
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={clsx(
              "rounded-xl px-4 py-2 text-xs font-semibold transition",
              !statusFilter
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            )}
          >
            All ({restaurants.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={clsx(
              "rounded-xl px-4 py-2 text-xs font-semibold transition",
              statusFilter === "ACTIVE"
                ? "bg-green-600 text-white"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("SUSPENDED")}
            className={clsx(
              "rounded-xl px-4 py-2 text-xs font-semibold transition",
              statusFilter === "SUSPENDED"
                ? "bg-yellow-600 text-white"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            )}
          >
            Suspended
          </button>
          <button
            onClick={() => setStatusFilter("TERMINATED")}
            className={clsx(
              "rounded-xl px-4 py-2 text-xs font-semibold transition",
              statusFilter === "TERMINATED"
                ? "bg-red-600 text-white"
                : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            )}
          >
            Terminated
          </button>
        </div>

        {/* Restaurant List */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading restaurants...
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-sm text-zinc-500 mb-4">No restaurants found</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create First Restaurant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/platform/restaurants/${restaurant.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-zinc-900">{restaurant.name}</h3>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
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
                {restaurant.slug && (
                  <div className="text-xs text-zinc-500 mb-2">/{restaurant.slug}</div>
                )}
                {(restaurant.city || restaurant.state) && (
                  <div className="text-xs text-zinc-600">
                    {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateRestaurantModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
            creating={creating}
          />
        )}
      </div>
    </PlatformShell>
  );
}

function CreateRestaurantModal({
  onClose,
  onCreate,
  creating,
}: {
  onClose: () => void;
  onCreate: (dto: CreateRestaurantDto) => void;
  creating: boolean;
}) {
  const [form, setForm] = useState<CreateRestaurantDto>({
    name: "",
    slug: "",
    subscriptionPlanCode: "PRO",
    createAdminUser: {
      email: "",
      name: "",
      password: "",
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(form);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Create Restaurant</h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Restaurant Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="restaurant-name"
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Subscription Plan</label>
            <select
              value={form.subscriptionPlanCode}
              onChange={(e) => setForm({ ...form, subscriptionPlanCode: e.target.value })}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div className="border-t border-zinc-200 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Create Admin User</h3>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Admin Email *</label>
                <input
                  type="email"
                  required
                  value={form.createAdminUser!.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      createAdminUser: { ...form.createAdminUser!, email: e.target.value },
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Admin Name *</label>
                <input
                  required
                  value={form.createAdminUser!.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      createAdminUser: { ...form.createAdminUser!, name: e.target.value },
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Admin Password *</label>
                <input
                  type="password"
                  required
                  value={form.createAdminUser!.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      createAdminUser: { ...form.createAdminUser!, password: e.target.value },
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? "Creating..." : "Create Restaurant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
