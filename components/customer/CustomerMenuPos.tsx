"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";

import { SearchIcon } from "@/components/icons";
import VideoPlayerModal from "@/components/customer/VideoPlayerModal";
import CustomizeItemSheet from "@/components/customer/CustomizeItemSheet";

import {
  createPublicOrder,
  orderLinesFromCart,
  publicMenu,
  callWaiter,
  getTableService,
  getPublicOrder,
  getTableOrders,
} from "@/lib/endpoints";
import OrderStatusButton from "@/components/customer/OrderStatusButton";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";
import {
  resolveTableSession,
  getDeviceIdForOrders,
  persistOrderTracking,
  loadOrderTracking,
} from "@/lib/table";
import { useCart } from "@/lib/useCart";
import { CartLine, LineModifiers, money } from "@/lib/cart";

import BrandTheme from "@/components/brand/BrandTheme";

function dishImage(dish: UiDish) {
  return (
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=70"
  );
}

export default function CustomerMenuPos({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const [table, setTable] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [tableSessionId, setTableSessionId] = useState<string>("");
  const [sessionSecret, setSessionSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("DishLens");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string>("");
  const [brandColor, setBrandColor] = useState<string>("#dc2626");
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeTarget, setCustomizeTarget] = useState<{
    type: "add" | "edit";
    dish: UiDish;
    line?: CartLine;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalledAt, setWaiterCalledAt] = useState<number | null>(null);
  const [acceptedWaiterName, setAcceptedWaiterName] = useState<string | null>(null);
  const [acceptedWaiterPhotoUrl, setAcceptedWaiterPhotoUrl] = useState<string | null>(null);
  const persistedOrderInitial = typeof window !== "undefined" ? loadOrderTracking(slug) : null;
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(persistedOrderInitial?.orderId || null);
  const [trackingOrderToken, setTrackingOrderToken] = useState<string | null>(persistedOrderInitial?.orderToken || null);

  const cart = useCart(slug, tableSessionId || "");
  const baseHref = `/m/${slug}`;
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Resolve table session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = { get: (k: string) => searchParams?.get(k) ?? null };
        const session = await resolveTableSession(slug, params);
        if (cancelled) return;
        if (session) {
          setTableNumber(session.tableNumber);
          setTable(session.tableNumber);
          setTableSessionId(session.tableSessionId);
          setSessionSecret(session.sessionSecret || "");
        } else {
          setTableNumber("");
          setTable("");
          setTableSessionId("");
          setSessionSecret("");
        }
      } catch {
        if (cancelled) return;
        setTableNumber("");
        setTable("");
        setTableSessionId("");
      }
    })();
    return () => { cancelled = true; };
  }, [slug, searchParams]);

  // Load persisted order tracking
  useEffect(() => {
    if (!slug) return;
    const persisted = loadOrderTracking(slug);
    if (persisted?.orderId && persisted?.orderToken) {
      setTrackingOrderId(persisted.orderId);
      setTrackingOrderToken(persisted.orderToken);
    }
  }, [slug]);

  // Load menu
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const payload = await publicMenu(slug);
        const norm = normalizePublicMenu(payload);
        setRestaurantName(norm.restaurant?.name || "DishLens");
        setRestaurantLogoUrl(norm.restaurant?.logoUrl || "");
        setCategories(norm.categories);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Poll waiter call status
  useEffect(() => {
    if (!tableSessionId || !sessionSecret || !waiterCalledAt) return;
    const pollMs = 2500;
    const stopAfterMs = 2 * 60 * 1000;
    const start = Date.now();
    const t = setInterval(async () => {
      if (Date.now() - start > stopAfterMs) {
        clearInterval(t);
        return;
      }
      try {
        const res = await getTableService(tableSessionId, sessionSecret);
        const by = res?.activeCall?.acceptedBy;
        if (by?.name) {
          setAcceptedWaiterName(by.name);
          setAcceptedWaiterPhotoUrl(by.photoUrl ?? null);
        }
      } catch {}
    }, pollMs);
    return () => clearInterval(t);
  }, [tableSessionId, sessionSecret, waiterCalledAt]);

  const onCallWaiter = async () => {
    if (callingWaiter || !tableSessionId || !sessionSecret) return;
    try {
      setCallingWaiter(true);
      await callWaiter({ tableSessionId, sessionSecret });
      setWaiterCalledAt(Date.now());
    } catch (e: any) {
      alert(e?.message ?? "Failed to call waiter");
    } finally {
      setCallingWaiter(false);
    }
  };

  const startCustomizeForAdd = (dish: UiDish) => {
    setCustomizeTarget({ type: "add", dish });
    setCustomizeOpen(true);
  };

  const confirmCustomize = (mods: LineModifiers) => {
    if (!customizeTarget || customizeTarget.type !== "add") return;
    const d = customizeTarget.dish;
    cart.add(
      { menuItemId: d.id, name: d.name, price: d.price, imageUrl: d.imageUrl },
      1,
      mods
    );
    setCustomizeOpen(false);
    setCustomizeTarget(null);
  };

  const submitOrder = async () => {
    if (submitting || !tableSessionId || !sessionSecret || cart.lines.length === 0) return;
    try {
      setSubmitting(true);
      const result = await createPublicOrder(slug, {
        tableSessionId,
        sessionSecret,
        deviceId: getDeviceIdForOrders(),
        lines: orderLinesFromCart(cart.lines),
      });
      cart.clear();
      if (result?.id && result?.orderToken) {
        setTrackingOrderId(result.id);
        setTrackingOrderToken(result.orderToken);
        persistOrderTracking(slug, result.id, result.orderToken);
      } else {
        alert("Order submitted!");
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  const allItems = useMemo(() =>
    categories.flatMap((c) => (c.items ?? []).map((d) => ({ ...d, categoryId: c.id, categoryName: c.name }))),
    [categories]
  );

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedCategory !== "all") {
      items = items.filter((d) => (d as any).categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, selectedCategory, searchQuery]);

  const subtotal = useMemo(() =>
    cart.lines.reduce((s, l) => s + (l.price || 0) * (l.quantity || 0), 0),
    [cart.lines]
  );
  const tax = 0;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900">Loading menu...</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-red-800 font-semibold">{err}</div>
          <div className="mt-2 text-sm text-red-600">Open via QR code at your table</div>
        </div>
      </div>
    );
  }

  const cartCount = cart.lines.reduce((s, l) => s + (l.quantity || 0), 0);

  return (
    <BrandTheme theme={{ brand: brandColor, brandSoft: "#fef2f2", brandAccent: "#ea580c" }}>
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-white overflow-hidden">
        {/* Top Header - Mobile-first compact, expands on desktop */}
        <header className="sticky top-0 z-40 flex-shrink-0 h-14 lg:h-14 border-b bg-white flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
          <Link href={baseHref} className="text-zinc-600 hover:text-zinc-900 text-sm font-medium shrink-0">
            ← Back
          </Link>
          {/* Search - collapsible on mobile, always visible on desktop */}
          <div className={clsx(
            "flex-1 flex items-center gap-2 min-w-0 max-w-full lg:max-w-md",
            searchExpanded && "flex-1"
          )}>
            <button
              type="button"
              onClick={() => setSearchExpanded(!searchExpanded)}
              className="lg:hidden shrink-0 p-2 -m-2"
              aria-label="Toggle search"
            >
              <SearchIcon className="h-4 w-4 text-zinc-500" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className={clsx(
                "flex-1 py-2 px-3 rounded-lg border border-zinc-200 text-sm outline-none focus:ring-2 focus:ring-red-200 min-w-0",
                !searchExpanded && "hidden lg:block"
              )}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {trackingOrderId && trackingOrderToken && (
              <OrderStatusButton
                slug={slug}
                orderId={trackingOrderId}
                orderToken={trackingOrderToken}
                tableSessionId={tableSessionId}
              />
            )}
            <span className="rounded-full border border-zinc-200 px-2 sm:px-3 py-1 text-xs font-semibold text-zinc-700 whitespace-nowrap">
              Table: {table || "—"}
            </span>
            {tableSessionId && sessionSecret && (
              acceptedWaiterName ? (
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-2 sm:px-3 py-1.5">
                  {acceptedWaiterPhotoUrl ? (
                    <img src={acceptedWaiterPhotoUrl} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">
                      {acceptedWaiterName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-emerald-800 hidden md:inline">{acceptedWaiterName} is on the way</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onCallWaiter}
                  disabled={callingWaiter}
                  className="rounded-lg bg-amber-500 text-white px-2 sm:px-3 py-1.5 text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 shrink-0"
                >
                  {callingWaiter ? "…" : "Call"}
                </button>
              )
            )}
          </div>
        </header>

        {/* Mobile: Horizontal categories (sticky below header) */}
        <nav className="lg:hidden sticky top-14 z-30 flex-shrink-0 border-b bg-zinc-50 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap",
                selectedCategory === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-zinc-700 border border-zinc-200"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={clsx(
                  "shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap",
                  selectedCategory === c.id
                    ? "bg-red-100 text-red-800 font-semibold border border-red-200"
                    : "bg-white text-zinc-600 border border-zinc-200"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Desktop: Left Sidebar - Categories (hidden on mobile) */}
        <aside className="hidden lg:flex w-56 border-r bg-zinc-50 flex-col flex-shrink-0">
          <div className="p-2 overflow-y-auto flex-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={clsx(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold mb-1",
                selectedCategory === "all"
                  ? "bg-red-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-200"
              )}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={clsx(
                  "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium",
                  selectedCategory === c.id
                    ? "bg-red-100 text-red-800 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - Menu Items Grid */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredItems.map((dish) => {
              const line = cart.lines.find((l) => l.menuItemId === dish.id && !l.modifiers?.specialInstructions);
              const qty = line?.quantity ?? 0;
              return (
                <div
                  key={dish.id}
                  className={clsx(
                    "rounded-xl border-2 overflow-hidden bg-white transition touch-manipulation",
                    qty > 0 ? "border-red-400 ring-2 ring-red-100" : "border-zinc-200 active:border-zinc-300"
                  )}
                >
                  <div
                    className="relative aspect-square cursor-pointer"
                    onClick={() => startCustomizeForAdd(dish)}
                  >
                    <Image
                      src={dishImage(dish)}
                      alt={dish.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-2 sm:p-3">
                    <div className="font-semibold text-zinc-900 text-sm line-clamp-2">{dish.name}</div>
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-1">
                      <span className="text-sm font-bold text-red-600 truncate">${dish.price.toFixed(2)}</span>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cart.setQty(line!.key, qty - 1);
                            }}
                            className="h-7 w-7 sm:h-7 sm:w-7 rounded border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 active:bg-zinc-100 text-sm font-bold touch-manipulation"
                          >
                            −
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startCustomizeForAdd(dish)}
                          className="h-7 w-7 sm:h-7 sm:w-7 rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 text-sm font-bold touch-manipulation"
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

        {/* Desktop: Right Sidebar - Cart (hidden on mobile) */}
        <aside className="hidden lg:flex w-80 border-l bg-white flex-col flex-shrink-0">
          <div className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="text-sm font-bold text-zinc-900 mb-2">Cart Items</div>
            <div className="text-xs text-zinc-500 mb-3">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {cart.lines.length === 0 ? (
                <div className="text-sm text-zinc-500 py-8 text-center">No items in cart</div>
              ) : (
                cart.lines.map((line) => (
                  <div key={line.key} className="flex items-start gap-2 border-b border-zinc-100 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        {line.name} {money(line.price)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => cart.setQty(line.key, Math.max(0, (line.quantity || 0) - 1))}
                          className="h-6 w-6 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => cart.setQty(line.key, (line.quantity || 0) + 1)}
                          className="h-6 w-6 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.setQty(line.key, 0)}
                      className="text-zinc-400 hover:text-red-600 p-1"
                      aria-label="Remove"
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Subtotal:</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Tax:</span>
                <span className="font-semibold">{money(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2">
                <span>Total:</span>
                <span className="text-red-600">{money(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || cart.lines.length === 0 || !tableSessionId}
              className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        </aside>

        {/* Mobile: Sticky bottom cart bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileCartOpen(true)}
              className="flex-1 flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl bg-zinc-100 active:bg-zinc-200"
            >
              <span className="text-sm font-semibold text-zinc-700">
                {cartCount > 0 ? `${cartCount} item${cartCount !== 1 ? "s" : ""}` : "Cart"}
              </span>
              <span className="text-sm font-bold text-zinc-900">{money(total)}</span>
            </button>
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || cart.lines.length === 0 || !tableSessionId}
              className="py-2.5 px-5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shrink-0"
            >
              {submitting ? "…" : "Place Order"}
            </button>
          </div>
        </div>

        {/* Mobile: Cart bottom sheet */}
        {mobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileCartOpen(false)}
              aria-label="Close cart"
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl bg-white shadow-xl overflow-hidden flex flex-col pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div>
                  <div className="text-base font-bold text-zinc-900">Your Cart</div>
                  <div className="text-xs text-zinc-500">Table {table || "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileCartOpen(false)}
                  className="h-10 w-10 rounded-full border flex items-center justify-center text-zinc-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {cart.lines.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-8 text-center">No items in cart</div>
                ) : (
                  <div className="space-y-3">
                    {cart.lines.map((line) => (
                      <div key={line.key} className="flex items-center gap-3 py-2 border-b border-zinc-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">{line.name}</div>
                          <div className="text-xs text-zinc-500">{money(line.price)} each</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => cart.setQty(line.key, Math.max(0, (line.quantity || 0) - 1))}
                            className="h-8 w-8 rounded-full border flex items-center justify-center text-zinc-600 touch-manipulation"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => cart.setQty(line.key, (line.quantity || 0) + 1)}
                            className="h-8 w-8 rounded-full border flex items-center justify-center text-zinc-600 touch-manipulation"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => cart.setQty(line.key, 0)}
                          className="text-zinc-400 hover:text-red-600 p-1"
                          aria-label="Remove"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t bg-zinc-50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600">Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base font-bold mb-3">
                  <span>Total</span>
                  <span className="text-red-600">{money(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await submitOrder();
                    setMobileCartOpen(false);
                  }}
                  disabled={submitting || cart.lines.length === 0 || !tableSessionId}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {submitting ? "Placing Order…" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <VideoPlayerModal open={!!videoSrc} src={videoSrc!} title={videoTitle} onClose={() => setVideoSrc(null)} />
      <CustomizeItemSheet
        open={customizeOpen}
        title={customizeTarget?.type === "add" ? customizeTarget.dish.name : "Customize"}
        priceLabel={customizeTarget?.type === "add" ? money(customizeTarget.dish.price) : undefined}
        initial={customizeTarget?.type === "edit" ? customizeTarget.line?.modifiers : undefined}
        onClose={() => { setCustomizeOpen(false); setCustomizeTarget(null); }}
        onConfirm={confirmCustomize}
      />
    </BrandTheme>
  );
}
