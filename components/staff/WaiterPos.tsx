"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";

import { getUser } from "@/lib/auth";
import { adminMenu } from "@/lib/api/admin";
import { createWaiterOrder } from "@/lib/api/waiter";
import CustomizeItemSheet from "@/components/customer/CustomizeItemSheet";
import { LineModifiers, money } from "@/lib/cart";
import BrandTheme from "@/components/brand/BrandTheme";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  spiceLevel?: string | null;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string | null;
};

type OrderLine = {
  key: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
  spiceLevel?: string | null;
  spiceOnSide?: boolean;
  allergensAvoid?: string[];
  specialInstructions?: string | null;
};

function lineKey(menuItemId: string, mods?: LineModifiers): string {
  const spice = mods?.spiceLevel ?? "";
  const side = mods?.spiceOnSide ? "SIDE" : "";
  const allergens = (mods?.allergensAvoid ?? []).sort().join(",");
  const note = (mods?.specialInstructions ?? "").toLowerCase();
  return [menuItemId, spice, side, allergens, note].join("|");
}

function itemImage(item: MenuItem) {
  return (
    item.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=70"
  );
}

export default function WaiterPos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("table") || "";
  const tableSessionId = searchParams.get("tableSessionId") || null;
  const tableId = searchParams.get("tableId") || null;

  const [user, setUser] = useState<any>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("POS");
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [notes, setNotes] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeTarget, setCustomizeTarget] = useState<MenuItem | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/r/login");
      return;
    }
    setUser(u);
    setRestaurantId(u.restaurantId || "");
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await adminMenu(restaurantId);
        setMenu(data);
        setRestaurantName(data?.restaurant?.name || "POS");
      } catch (e: any) {
        alert(e?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const allItems: MenuItem[] = useMemo(
    () =>
      menu?.categories?.flatMap((cat: any) =>
        (cat.items || []).map((item: any) => ({
          ...item,
          categoryId: cat.id,
          categoryName: cat.name,
        }))
      ) || [],
    [menu]
  );

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedCategory !== "all") {
      items = items.filter((i) => i.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const addItem = useCallback(
    (item: MenuItem, qty: number = 1, mods?: LineModifiers) => {
      const key = lineKey(item.id, mods);
      setOrderLines((prev) => {
        const idx = prev.findIndex((l) => l.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: Math.min(99, next[idx].quantity + qty),
          };
          return next;
        }
        return [
          ...prev,
          {
            key,
            menuItemId: item.id,
            name: item.name,
            priceCents: item.priceCents,
            quantity: qty,
            spiceLevel: mods?.spiceLevel ?? item.spiceLevel ?? null,
            spiceOnSide: mods?.spiceOnSide ?? false,
            allergensAvoid: mods?.allergensAvoid ?? [],
            specialInstructions: mods?.specialInstructions ?? null,
          },
        ];
      });
    },
    []
  );

  const updateQty = useCallback((key: string, qty: number) => {
    const q = Math.max(0, Math.min(99, qty));
    setOrderLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: q } : l))
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setOrderLines([]), []);

  const confirmCustomize = useCallback(
    (mods: LineModifiers) => {
      if (!customizeTarget) return;
      addItem(customizeTarget, 1, mods);
      setCustomizeOpen(false);
      setCustomizeTarget(null);
    },
    [customizeTarget, addItem]
  );

  const submitOrder = async () => {
    if (!restaurantId || !tableNumber || orderLines.length === 0) {
      alert("Please select items and ensure table number is set");
      return;
    }

    setSubmitting(true);
    try {
      await createWaiterOrder(restaurantId, {
        tableNumber,
        tableSessionId: tableSessionId || undefined,
        lines: orderLines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          spiceLevel: l.spiceLevel ?? null,
          spiceOnSide: l.spiceOnSide ?? false,
          allergensAvoid: l.allergensAvoid ?? [],
          specialInstructions: l.specialInstructions ?? null,
        })),
        notes: notes.trim() || undefined,
      });
      alert("Order submitted successfully!");
      router.push(`/r/waiter?table=${tableNumber}`);
    } catch (e: any) {
      alert(e?.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotalCents = orderLines.reduce(
    (s, l) => s + l.priceCents * l.quantity,
    0
  );
  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900">Loading menu...</div>
        </div>
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center max-w-sm">
          <div className="text-amber-800 font-semibold mb-2">No table selected</div>
          <div className="text-sm text-amber-700 mb-4">
            Select a table from the waiter dashboard and click &quot;Create Order&quot; to open POS.
          </div>
          <button
            type="button"
            onClick={() => router.push("/r/waiter")}
            className="rounded-xl bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const categories = menu?.categories ?? [];

  return (
    <BrandTheme theme={{ brand: "#2563eb", brandSoft: "#eff6ff", brandAccent: "#ea580c" }}>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 h-14 border-b bg-white z-40 flex items-center px-4 gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-zinc-600 hover:text-zinc-900 text-sm font-medium"
          >
            ← Back
          </button>
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <svg
              className="h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 py-2 px-3 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCart}
              disabled={orderLines.length === 0}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Clear Cart
            </button>
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
              Table: {tableNumber}
            </span>
          </div>
        </header>

        {/* Left Sidebar - Categories */}
        <aside className="w-56 border-r bg-zinc-50 flex flex-col pt-14">
          <div className="p-2 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold mb-1",
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-200"
              )}
            >
              All Items
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium",
                  selectedCategory === cat.id
                    ? "bg-blue-100 text-blue-800 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - Menu Items Grid */}
        <main className="flex-1 overflow-y-auto pt-14 pb-4 px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => {
              const line = orderLines.find(
                (l) =>
                  l.menuItemId === item.id &&
                  !l.specialInstructions &&
                  !l.allergensAvoid?.length
              );
              const qty = line?.quantity ?? 0;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "rounded-xl border-2 overflow-hidden bg-white transition",
                    qty > 0
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  <div
                    className="relative aspect-square cursor-pointer"
                    onClick={() => {
                      setCustomizeTarget(item);
                      setCustomizeOpen(true);
                    }}
                  >
                    <Image
                      src={itemImage(item)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-zinc-900 text-sm line-clamp-2">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-blue-600">
                        ${((item.priceCents || 0) / 100).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(line!.key, qty - 1);
                            }}
                            className="h-7 w-7 rounded border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 text-sm font-bold"
                          >
                            −
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (line) {
                              updateQty(line.key, qty + 1);
                            } else {
                              addItem(item, 1);
                            }
                          }}
                          className="h-7 w-7 rounded border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Cart */}
        <aside className="w-80 border-l bg-white flex flex-col pt-14">
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="text-sm font-bold text-zinc-900 mb-2">
              Cart Items
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {orderLines.length === 0 ? (
                <div className="text-sm text-zinc-500 py-8 text-center">
                  No items in cart
                </div>
              ) : (
                orderLines.map((line) => (
                  <div
                    key={line.key}
                    className="flex items-start gap-2 border-b border-zinc-100 pb-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        {line.name} {money((line.priceCents || 0) / 100)}
                      </div>
                      {(line.specialInstructions || line.allergensAvoid?.length) && (
                        <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                          {line.specialInstructions}
                          {line.allergensAvoid?.length
                            ? ` • Avoid: ${line.allergensAvoid.join(", ")}`
                            : ""}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(line.key, Math.max(0, line.quantity - 1))
                          }
                          className="h-6 w-6 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(line.key, line.quantity + 1)
                          }
                          className="h-6 w-6 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQty(line.key, 0)}
                      className="text-zinc-400 hover:text-red-600 p-1"
                      aria-label="Remove"
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3">
              <div className="text-xs font-bold text-zinc-700 mb-1">
                Kitchen Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes for kitchen..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-200"
                rows={2}
              />
            </div>

            <div className="mt-4 pt-4 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Subtotal:</span>
                <span className="font-semibold">
                  {money((subtotalCents || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Tax:</span>
                <span className="font-semibold">
                  {money((taxCents || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2">
                <span>Total:</span>
                <span className="text-blue-600">
                  {money((totalCents || 0) / 100)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || orderLines.length === 0}
              className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Place Order"}
            </button>
          </div>
        </aside>
      </div>

      <CustomizeItemSheet
        open={customizeOpen}
        title={customizeTarget?.name ?? "Customize"}
        priceLabel={
          customizeTarget
            ? money((customizeTarget.priceCents || 0) / 100)
            : undefined
        }
        initial={undefined}
        onClose={() => {
          setCustomizeOpen(false);
          setCustomizeTarget(null);
        }}
        onConfirm={confirmCustomize}
      />
    </BrandTheme>
  );
}
