"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";

import Container from "@/components/layout/Container";
import { SearchIcon, PlayIcon } from "@/components/icons";
import VideoPlayerModal from "@/components/customer/VideoPlayerModal";
import CartDrawer from "@/components/customer/CartDrawer";
import CustomizeItemSheet from "@/components/customer/CustomizeItemSheet";

import {
  createPublicOrder,
  orderLinesFromCart,
  publicMenu,
} from "@/lib/endpoints";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";
import {
  resolveTableSession,
  getDeviceIdForOrders,
} from "@/lib/table";
import { useCart } from "@/lib/useCart";
import { CartLine, LineModifiers } from "@/lib/cart";

import BrandTheme from "@/components/brand/BrandTheme";
import RestaurantHeroCollapsible from "@/components/customer/RestaurantHeroCollapsible";

import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { getToken } from "@/lib/auth";

const API_BASE = apiBaseUrl();

type RestaurantDetail = {
  id: string;
  name: string;
  slug: string;
  heroImageUrl?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  website?: string | null;
};

function isDrinksCategory(name: string) {
  const n = name.toLowerCase();
  return (
    n.includes("drink") ||
    n.includes("beverage") ||
    n.includes("lassi") ||
    n.includes("soda")
  );
}

function money(v: number | undefined) {
  const p = Number.isFinite(v) ? (v as number) : 0;
  return `$${p.toFixed(2)}`;
}

function moneyNumber(v: number | undefined) {
  return Number.isFinite(v) ? (v as number) : 0;
}

function shortText(s?: string) {
  if (!s) return "";
  return s.length > 110 ? `${s.slice(0, 110).trim()}…` : s;
}

function safeArray(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function dishImage(dish: UiDish) {
  return (
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=70"
  );
}

function spiceBadge(spice?: string) {
  const s = String(spice || "").toUpperCase();
  if (s === "HOT") return "Hot";
  if (s === "MEDIUM") return "Medium";
  if (s === "MILD") return "Mild";
  return "";
}

async function fetchRestaurantById(id: string): Promise<RestaurantDetail> {
  const token = await getToken();
  return apiFetch<RestaurantDetail>(
    `${API_BASE}/restaurants/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
}

// Optional helper if you have this endpoint on your API (highly recommended)
// GET /restaurants/slug/:slug  (or similar)
async function fetchRestaurantBySlug(
  slug: string,
): Promise<RestaurantDetail | null> {
  try {
    const token = await getToken();
    // change this path if your API uses a different route for slug lookup
    return await apiFetch<RestaurantDetail>(
      `${API_BASE}/restaurants/slug/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
  } catch {
    return null;
  }
}

function QuickViewModal({
  open,
  dish,
  baseHref,
  onClose,
  onPlay,
  onAdd,
}: {
  open: boolean;
  dish: UiDish | null;
  baseHref: string;
  onClose: () => void;
  onPlay: () => void;
  onAdd: () => void;
}) {
  if (!open || !dish) return null;

  const allergens = safeArray((dish as any).allergens);
  const videoUrl = (dish as any).videoUrl as string | undefined | null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[760px]">
        <div className="rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border overflow-hidden">
          <div className="relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 h-11 w-11 rounded-full bg-white/95 border shadow-soft grid place-items-center"
              aria-label="Close"
            >
              ✕
            </button>

            <button
              type="button"
              onClick={() => {
                if (videoUrl) onPlay();
                else window.location.href = `${baseHref}/dish/${dish.id}`;
              }}
              className="block w-full"
              aria-label={
                videoUrl ? `Play video for ${dish.name}` : `Open ${dish.name}`
              }
            >
              <div className="relative h-[240px] sm:h-[320px] w-full bg-zinc-100">
                <Image
                  src={dishImage(dish)}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={process.env.NODE_ENV === "development"}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/55" />
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-2">
                  <PlayIcon className="h-4 w-4" />
                  {videoUrl ? "Video" : "Details"}
                </span>
              </div>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                  {dish.name}
                </div>
                <div className="mt-1 text-sm text-zinc-600 line-clamp-2">
                  {dish.description || " "}
                </div>
              </div>
              <div className="shrink-0 text-lg sm:text-xl font-black text-zinc-900">
                {money(dish.price)}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(dish as any).isVeg === false ? (
                <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-xs font-semibold">
                  Non-Veg
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                  Veg
                </span>
              )}

              {spiceBadge((dish as any).spice) ? (
                <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 text-xs font-semibold">
                  Spice: {spiceBadge((dish as any).spice)}
                </span>
              ) : null}

              {allergens.slice(0, 6).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-sky-50 text-sky-900 border border-sky-200 px-3 py-1 text-xs font-semibold"
                >
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onAdd}
                className="w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm active:scale-[0.99]"
                style={{ backgroundColor: "var(--brand)" }}
              >
                Add to cart
              </button>

              <Link
                href={`${baseHref}/dish/${dish.id}`}
                className="rounded-2xl border px-4 py-3 text-sm font-extrabold text-zinc-800 text-center"
              >
                Full details
              </Link>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Tip: Tap “Add to cart” to choose spice level, allergens to avoid,
              and special kitchen instructions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenuModern({ slug }: { slug: string }) {
  const searchParams = useSearchParams();

  const [table, setTable] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [tableSessionId, setTableSessionId] = useState<string>("");
  const [sessionSecret, setSessionSecret] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("DishLens");
  const [restaurantAddress, setRestaurantAddress] = useState<string>("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string>("");
  const [restaurantHeroUrl, setRestaurantHeroUrl] = useState<string>("");

  // Theme defaults (optional—can be persisted later)
  const [brandColor, setBrandColor] = useState<string>("#111827");
  const [brandSoft, setBrandSoft] = useState<string>("#f4f4f5");
  const [brandAccent, setBrandAccent] = useState<string>("#f59e0b");

  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [q, setQ] = useState("");

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  const [quickDish, setQuickDish] = useState<UiDish | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeTarget, setCustomizeTarget] = useState<
    { type: "add"; dish: UiDish } | { type: "edit"; line: CartLine } | null
  >(null);

  const [submitting, setSubmitting] = useState(false);

  // Resolve table session: ?t= (QR), ?table= (guest), or persisted/default. Persist for cart + orders.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = {
          get: (k: string) => searchParams?.get(k) ?? null,
        };
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

    return () => {
      cancelled = true;
    };
  }, [slug, searchParams]);

  const cart = useCart(slug, tableSessionId || "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Load menu + restaurant branding
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) Public menu gives categories + maybe basic branding
        const payload = await publicMenu(slug);
        const norm = normalizePublicMenu(payload);

        const restaurant = norm.restaurant ?? {};
        setRestaurantName(restaurant?.name || "DishLens");
        const addressParts = [
          restaurant?.address,
          restaurant?.city,
          restaurant?.state,
        ].filter(Boolean);
        setRestaurantAddress(addressParts.join(", "));
        setCategories(norm.categories);
        setActiveTab(norm.categories?.[0]?.name || "Menu");

        // keep as fallback
        const fallbackHero = restaurant?.heroImageUrl || "";
        const fallbackLogo = restaurant?.logoUrl || "";

        // restaurantId if exposed by menu payload (recommended)
        const anyPayload: any = payload as any;
        const rid =
          anyPayload?.restaurantId ||
          anyPayload?.restaurant?.id ||
          (anyPayload?.restaurant && anyPayload.restaurant.id) ||
          "";

        if (rid) setRestaurantId(String(rid));

        // 2) Prefer real restaurant record (your /restaurants/{id} response)
        let detail: RestaurantDetail | null = null;

        if (rid) {
          detail = await fetchRestaurantById(String(rid));
        } else {
          // try slug lookup if your API supports it
          detail = await fetchRestaurantBySlug(slug);
        }

        const hero = detail?.heroImageUrl || fallbackHero;
        const logo = detail?.logoUrl || fallbackLogo;
        setRestaurantHeroUrl(hero || "");
        setRestaurantLogoUrl(logo || "");

        // If you later add theme fields on restaurant, set them here:
        // setBrandColor(detail?.brandColor ?? "#111827") etc.
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const categoriesWithPicked = useMemo(() => {
    const hasPicked = categories.some(
      (c) => c.name.toLowerCase() === "picked for you",
    );
    if (hasPicked || categories.length === 0) return categories;

    const all = categories.flatMap((c) => c.items ?? []);
    const rated = all
      .filter((d) => typeof d.avgRating === "number")
      .sort(
        (a, b) =>
          (b.avgRating ?? 0) - (a.avgRating ?? 0) ||
          (b.ratingCount ?? 0) - (a.ratingCount ?? 0),
      );

    const picks: UiDish[] = [];
    if (rated.length > 0) {
      for (const d of rated) {
        if (!picks.some((x) => x.id === d.id)) picks.push(d);
        if (picks.length >= 8) break;
      }
    } else {
      for (const c of categories) {
        if (c.items?.[0]) picks.push(c.items[0]);
        if (picks.length >= 8) break;
      }
    }

    return [
      { id: "picked", name: "Picked for you", items: picks },
      ...categories,
    ];
  }, [categories]);

  const filteredByQuery = useMemo(() => {
    if (!q) return categoriesWithPicked;
    const query = q.toLowerCase();
    return categoriesWithPicked
      .map((c) => ({
        ...c,
        items: (c.items ?? []).filter((d) => {
          const nameMatch = d.name.toLowerCase().includes(query);
          const descMatch = (d.description || "").toLowerCase().includes(query);
          return nameMatch || descMatch;
        }),
      }))
      .filter((c) => (c.items ?? []).length > 0);
  }, [categoriesWithPicked, q]);

  // Active tab by scroll
  useEffect(() => {
    if (!filteredByQuery.length) return;

    const observers: IntersectionObserver[] = [];
    for (const c of filteredByQuery) {
      const el = sectionRefs.current[c.name];
      if (!el) continue;

      const obs = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (e.isIntersecting) setActiveTab(c.name);
        },
        { root: null, threshold: 0.2, rootMargin: "-40% 0px -55% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [filteredByQuery]);

  const baseHref = `/m/${encodeURIComponent(slug)}`;

  const scrollToCategory = (name: string) => {
    const el = sectionRefs.current[name];
    if (!el) return;

    setActiveTab(name);

    const stickyOffset = 88 + 56; // collapsed hero + sticky tabs
    const y = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const openVideo = (dish: UiDish) => {
    const videoUrl = (dish as any).videoUrl as string | undefined | null;
    if (!videoUrl) {
      window.location.href = `${baseHref}/dish/${dish.id}`;
      return;
    }
    setVideoTitle(dish.name);
    setVideoSrc(videoUrl);
  };

  const closeVideo = () => {
    setVideoSrc(null);
    setVideoTitle("");
  };

  const startCustomizeForAdd = (dish: UiDish) => {
    setCustomizeTarget({ type: "add", dish });
    setCustomizeOpen(true);
  };

  const startCustomizeForEdit = (line: CartLine) => {
    setCustomizeTarget({ type: "edit", line });
    setCustomizeOpen(true);
  };

  const confirmCustomize = (mods: LineModifiers) => {
    const t = customizeTarget;
    if (!t) return;

    if (t.type === "add") {
      const d = t.dish;
      cart.add(
        {
          menuItemId: d.id,
          name: d.name,
          price: moneyNumber(d.price),
          imageUrl: d.imageUrl ?? null,
        },
        1,
        mods,
      );
    }

    if (t.type === "edit") {
      cart.editLine(t.line.key, { modifiers: mods });
    }

    setCustomizeOpen(false);
    setCustomizeTarget(null);
  };

  const submitOrder = async () => {
    if (submitting) return;
    if (!tableSessionId || !sessionSecret) {
      window.alert("Missing table session. Refresh the page or use ?table=1 or scan the QR.");
      return;
    }
    if (cart.lines.length === 0) return;

    try {
      setSubmitting(true);
      await createPublicOrder(slug, {
        tableSessionId,
        sessionSecret,
        deviceId: getDeviceIdForOrders(),
        lines: orderLinesFromCart(cart.lines),
      });
      cart.clear();
      window.alert(
        "Order submitted! The restaurant will see it on the kitchen dashboard.",
      );
    } catch (e: any) {
      const msg = e?.message ?? "Failed to submit order";
      if (msg.includes("expired") || msg.includes("Invalid session")) {
        window.alert("Your session expired. Please rescan the QR code or refresh the page.");
      } else {
        window.alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const quickAllergens = safeArray((quickDish as any)?.allergens);

  return (
    <BrandTheme theme={{ brand: brandColor, brandSoft, brandAccent }}>
      <div className="bg-white">
        <VideoPlayerModal
          open={!!videoSrc}
          src={videoSrc}
          title={videoTitle}
          onClose={closeVideo}
        />

        <QuickViewModal
          open={!!quickDish}
          dish={quickDish}
          baseHref={baseHref}
          onClose={() => setQuickDish(null)}
          onPlay={() => {
            const d = quickDish;
            if (!d) return;
            setQuickDish(null);
            openVideo(d);
          }}
          onAdd={() => {
            const d = quickDish;
            if (!d) return;
            setQuickDish(null);
            startCustomizeForAdd(d);
          }}
        />

        <CustomizeItemSheet
          open={customizeOpen}
          title={
            customizeTarget?.type === "add"
              ? customizeTarget.dish.name
              : customizeTarget?.type === "edit"
                ? customizeTarget.line.name
                : "Customize"
          }
          priceLabel={
            customizeTarget?.type === "add"
              ? money((customizeTarget.dish as any)?.price)
              : customizeTarget?.type === "edit"
                ? money((customizeTarget.line as any)?.price)
                : undefined
          }
          initial={
            customizeTarget?.type === "edit"
              ? customizeTarget.line.modifiers
              : undefined
          }
          onClose={() => {
            setCustomizeOpen(false);
            setCustomizeTarget(null);
          }}
          onConfirm={confirmCustomize}
        />

        {/* ✅ Use hero + logo from restaurant detail endpoint */}
        <RestaurantHeroCollapsible
          restaurantName={restaurantName || "DishLens"}
          logoUrl={restaurantLogoUrl || null}
          heroUrl={restaurantHeroUrl || null}
          tableLabel={
            table || tableNumber ? `Table: ${table || tableNumber}` : null
          }
          hint="Tap an image for video"
        />

        <Container className="max-w-6xl px-0 sm:px-4">
          <div className="px-4 pt-4 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {restaurantAddress ? (
                  <div className="text-sm text-zinc-600">
                    {restaurantAddress}
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                    Table: {table || "—"}
                  </span>

                  {quickDish && quickAllergens.length ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900">
                      Allergens: {quickAllergens.slice(0, 2).join(", ")}
                      {quickAllergens.length > 2 ? "…" : ""}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="w-full sm:w-[380px]">
                <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2.5">
                  <SearchIcon className="h-4 w-4 text-zinc-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search dishes, ingredients..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-sm text-zinc-600">Loading menu…</div>
          ) : null}

          {err ? (
            <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {err}
              <div className="mt-2 text-xs text-red-700">
                Tip: open this page via QR code like{" "}
                <code className="px-1 py-0.5 bg-white border rounded">
                  /m/&lt;restaurant-slug&gt;
                </code>
                .
              </div>
            </div>
          ) : null}

          {!loading && !err ? (
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-6 px-4 pb-10">
              <aside className="hidden lg:block">
                <div className="sticky top-4">
                  <div className="rounded-3xl border bg-white p-3 shadow-soft">
                    <div className="px-2 pb-2 text-xs font-bold text-zinc-500">
                      Categories
                    </div>
                    <div className="flex flex-col">
                      {filteredByQuery.map((c) => (
                        <button
                          key={c.id || c.name}
                          type="button"
                          onClick={() => scrollToCategory(c.name)}
                          className={clsx(
                            "text-left rounded-2xl px-3 py-2 text-sm font-semibold transition",
                            activeTab === c.name
                              ? "text-white"
                              : "hover:bg-zinc-50 text-zinc-700",
                          )}
                          style={
                            activeTab === c.name
                              ? { backgroundColor: "var(--brand)" }
                              : undefined
                          }
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              <main>
                <div
                  className="sticky z-40 bg-white/95 backdrop-blur border-b lg:hidden"
                  style={{ top: 88 }}
                >
                  <div className="py-2 flex gap-5 overflow-x-auto whitespace-nowrap no-scrollbar px-1">
                    {filteredByQuery.map((c) => (
                      <button
                        key={c.id || c.name}
                        onClick={() => scrollToCategory(c.name)}
                        className="pb-2 text-sm font-semibold transition"
                        style={
                          activeTab === c.name
                            ? {
                                color: "var(--brand)",
                                borderBottom: "2px solid var(--brand)",
                              }
                            : { color: "#71717a" }
                        }
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  {filteredByQuery.map((cat) => {
                    const items = cat.items ?? [];
                    const drinks = isDrinksCategory(cat.name);

                    return (
                      <section
                        key={cat.id || cat.name}
                        ref={(el) => {
                          sectionRefs.current[cat.name] = el;
                        }}
                        className="pt-7 scroll-mt-40"
                      >
                        <div className="flex items-end justify-between gap-3">
                          <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                            {cat.name}
                          </h2>
                          <div className="text-xs text-zinc-500">
                            {items.length} items
                          </div>
                        </div>

                        <div
                          className={clsx(
                            "mt-4 grid gap-3",
                            drinks
                              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                              : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
                          )}
                        >
                          {items.map((d) => (
                            <DishCard
                              key={d.id}
                              dish={d}
                              onQuick={() => setQuickDish(d)}
                              onAdd={() => startCustomizeForAdd(d)}
                              onPlay={() => openVideo(d)}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </main>
            </div>
          ) : null}
        </Container>

        <CartDrawer
          tableNumber={table || tableNumber || "—"}
          lines={cart.lines}
          total={cart.total}
          onChangeQty={cart.setQty}
          onEditLine={startCustomizeForEdit}
          onSubmit={submitOrder}
          submitting={submitting}
        />
      </div>
    </BrandTheme>
  );
}

function DishCard({
  dish,
  onQuick,
  onPlay,
  onAdd,
}: {
  dish: UiDish;
  onQuick: () => void;
  onPlay: () => void;
  onAdd: () => void;
}) {
  const img = dishImage(dish);
  const allergens = safeArray((dish as any).allergens);
  const videoUrl = (dish as any).videoUrl as string | undefined | null;

  return (
    <div className="rounded-3xl border bg-white overflow-hidden shadow-soft hover:shadow-md transition">
      <button
        type="button"
        onClick={onQuick}
        className="block w-full text-left"
        aria-label={`Preview ${dish.name}`}
      >
        <div className="relative h-[150px] sm:h-[170px] w-full bg-zinc-100">
          <Image
            src={img}
            alt={dish.name}
            fill
            className="object-cover"
            unoptimized={process.env.NODE_ENV === "development"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/50" />

          <div className="absolute left-3 bottom-3 flex flex-wrap gap-2">
            {(dish as any).isVeg === false ? (
              <span className="rounded-full bg-white/90 text-rose-700 border border-rose-200 px-2.5 py-1 text-[11px] font-bold">
                Non-Veg
              </span>
            ) : (
              <span className="rounded-full bg-white/90 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold">
                Veg
              </span>
            )}

            {spiceBadge((dish as any).spice) ? (
              <span className="rounded-full bg-white/90 text-amber-900 border border-amber-200 px-2.5 py-1 text-[11px] font-bold">
                {spiceBadge((dish as any).spice)}
              </span>
            ) : null}
          </div>

          <div className="absolute right-3 bottom-3 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (videoUrl) onPlay();
                else onQuick();
              }}
              className="rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-2"
              aria-label={
                videoUrl ? `Play video for ${dish.name}` : `Open ${dish.name}`
              }
            >
              <PlayIcon className="h-4 w-4" />
              {videoUrl ? "Video" : "Details"}
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold text-zinc-900 truncate">
                {dish.name}
              </div>
              <div className="mt-0.5 text-xs text-zinc-600 line-clamp-2">
                {shortText(dish.description ?? undefined) || " "}
              </div>
            </div>
            <div className="shrink-0 text-sm font-black text-zinc-900">
              {money(dish.price)}
            </div>
          </div>

          {allergens.length ? (
            <div className="mt-2 text-[11px] text-zinc-500 line-clamp-1">
              Allergens: {allergens.join(", ")}
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-zinc-500">
              Allergens: none listed
            </div>
          )}
        </div>
      </button>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onAdd}
          className="w-full rounded-2xl py-2.5 text-sm font-extrabold text-white hover:opacity-95"
          style={{ backgroundColor: "var(--brand)" }}
          aria-label={`Add ${dish.name} to cart`}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
