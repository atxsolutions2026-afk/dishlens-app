"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";
import {
  getPlatformRestaurant,
  updateRestaurantFeatures,
  updateRestaurantBranding,
  suspendRestaurant,
  activateRestaurant,
  updatePlatformRestaurant,
} from "@/lib/api/platform";
import type { PlatformRestaurantDetail, RestaurantFeatures, RestaurantBranding } from "@/lib/api/platform";
import Button from "@/components/ui/Button";
import { clsx } from "clsx";

export default function PlatformRestaurantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id as string;
  const [restaurant, setRestaurant] = useState<PlatformRestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "features" | "branding">("info");
  const [saving, setSaving] = useState(false);

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

    loadRestaurant();
  }, [router, restaurantId]);

  async function loadRestaurant() {
    try {
      const data = await getPlatformRestaurant(restaurantId);
      setRestaurant(data);
    } catch (e: any) {
      console.error("Failed to load restaurant:", e);
      alert(e?.message || "Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateFeatures(features: Partial<RestaurantFeatures>) {
    if (!restaurant) return;
    setSaving(true);
    try {
      const updated = await updateRestaurantFeatures(restaurantId, features);
      setRestaurant({ ...restaurant, features: updated });
      alert("Features updated successfully");
    } catch (e: any) {
      alert(e?.message || "Failed to update features");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBranding(branding: Partial<RestaurantBranding>) {
    if (!restaurant) return;
    setSaving(true);
    try {
      const updated = await updateRestaurantBranding(restaurantId, branding);
      setRestaurant({ ...restaurant, branding: updated });
      alert("Branding updated successfully");
    } catch (e: any) {
      alert(e?.message || "Failed to update branding");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: 'ACTIVE' | 'SUSPENDED') {
    if (!restaurant) return;
    setSaving(true);
    try {
      if (status === 'SUSPENDED') {
        await suspendRestaurant(restaurantId);
      } else {
        await activateRestaurant(restaurantId);
      }
      await loadRestaurant();
      alert(`Restaurant ${status === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`);
    } catch (e: any) {
      alert(e?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PlatformShell>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-sm text-zinc-500">Loading restaurant...</div>
        </div>
      </PlatformShell>
    );
  }

  if (!restaurant) {
    return (
      <PlatformShell>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-sm text-red-600">Restaurant not found</div>
        </div>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            ← Back to Restaurants
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{restaurant.name}</h1>
              <p className="mt-1 text-sm text-zinc-600">
                {restaurant.slug && `/${restaurant.slug}`}
                {restaurant.city && restaurant.state && ` • ${restaurant.city}, ${restaurant.state}`}
              </p>
            </div>
            <div className="flex gap-2">
              {restaurant.status === 'ACTIVE' ? (
                <Button
                  onClick={() => handleStatusChange('SUSPENDED')}
                  disabled={saving}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Suspend
                </Button>
              ) : (
                <Button
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Activate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200">
          {(['info', 'features', 'branding'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 text-sm font-semibold border-b-2 transition",
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && <RestaurantInfoTab restaurant={restaurant} />}
        {activeTab === 'features' && (
          <RestaurantFeaturesTab
            restaurant={restaurant}
            onUpdate={handleUpdateFeatures}
            saving={saving}
          />
        )}
        {activeTab === 'branding' && (
          <RestaurantBrandingTab
            restaurant={restaurant}
            onUpdate={handleUpdateBranding}
            saving={saving}
          />
        )}
      </div>
    </PlatformShell>
  );
}

function RestaurantInfoTab({ restaurant }: { restaurant: PlatformRestaurantDetail }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Restaurant Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">Status</div>
          <div
            className={clsx(
              "inline-block rounded-full px-3 py-1 text-xs font-semibold",
              restaurant.status === 'ACTIVE'
                ? "bg-green-100 text-green-800"
                : restaurant.status === 'SUSPENDED'
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            )}
          >
            {restaurant.status || 'ACTIVE'}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">Slug</div>
          <div className="text-sm text-zinc-900">{restaurant.slug || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">City</div>
          <div className="text-sm text-zinc-900">{restaurant.city || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">State</div>
          <div className="text-sm text-zinc-900">{restaurant.state || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">Phone</div>
          <div className="text-sm text-zinc-900">{restaurant.phone || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">Website</div>
          <div className="text-sm text-zinc-900">{restaurant.website || '—'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-600 mb-1">Created</div>
          <div className="text-sm text-zinc-900">
            {new Date(restaurant.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantFeaturesTab({
  restaurant,
  onUpdate,
  saving,
}: {
  restaurant: PlatformRestaurantDetail;
  onUpdate: (features: Partial<RestaurantFeatures>) => void;
  saving: boolean;
}) {
  const [features, setFeatures] = useState<RestaurantFeatures>(restaurant.features);

  useEffect(() => {
    setFeatures(restaurant.features);
  }, [restaurant.features]);

  function handleToggle(key: keyof RestaurantFeatures) {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);
    onUpdate({ [key]: updated[key] });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Feature Flags</h2>
      <div className="grid gap-4">
        {[
          { key: 'orderingEnabled', label: 'Customer Ordering', desc: 'Allow customers to place orders' },
          { key: 'waiterCallEnabled', label: 'Call Waiter', desc: 'Enable call waiter functionality' },
          { key: 'dishRatingsEnabled', label: 'Dish Ratings', desc: 'Allow customers to rate dishes' },
          { key: 'waiterRatingsEnabled', label: 'Waiter Ratings', desc: 'Allow customers to rate waiters' },
          { key: 'kitchenScreenEnabled', label: 'Kitchen Screen', desc: 'Enable kitchen dashboard' },
          { key: 'etaVisible', label: 'Show ETA', desc: 'Display estimated prep time' },
          { key: 'availabilityVisible', label: 'Show Availability', desc: 'Display item availability' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-start justify-between p-4 border border-zinc-200 rounded-xl">
            <div className="flex-1">
              <div className="font-semibold text-zinc-900">{label}</div>
              <div className="text-xs text-zinc-500 mt-1">{desc}</div>
            </div>
            <button
              onClick={() => handleToggle(key as keyof RestaurantFeatures)}
              disabled={saving}
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition",
                features[key as keyof RestaurantFeatures]
                  ? "bg-blue-600"
                  : "bg-zinc-200"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition",
                  features[key as keyof RestaurantFeatures] ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantBrandingTab({
  restaurant,
  onUpdate,
  saving,
}: {
  restaurant: PlatformRestaurantDetail;
  onUpdate: (branding: Partial<RestaurantBranding>) => void;
  saving: boolean;
}) {
  const [branding, setBranding] = useState<RestaurantBranding>(restaurant.branding);

  useEffect(() => {
    setBranding(restaurant.branding);
  }, [restaurant.branding]);

  function handleSave() {
    onUpdate(branding);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Branding</h2>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Logo URL</label>
          <input
            type="url"
            value={branding.logoUrl || ''}
            onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value || null })}
            placeholder="https://example.com/logo.png"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Hero Image URL</label>
          <input
            type="url"
            value={branding.heroImageUrl || ''}
            onChange={(e) => setBranding({ ...branding, heroImageUrl: e.target.value || null })}
            placeholder="https://example.com/hero.jpg"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="h-10 w-20 rounded-xl border border-zinc-200"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="h-10 w-20 rounded-xl border border-zinc-200"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.accentColor || '#000000'}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value || null })}
                className="h-10 w-20 rounded-xl border border-zinc-200"
              />
              <input
                type="text"
                value={branding.accentColor || ''}
                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value || null })}
                placeholder="#000000"
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Font Family</label>
          <input
            value={branding.fontFamily}
            onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}
