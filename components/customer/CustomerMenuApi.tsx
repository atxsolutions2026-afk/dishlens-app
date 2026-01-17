"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import Container from "@/components/layout/Container";
import { createPublicOrder, publicMenu } from "@/lib/endpoints";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";
import { SearchIcon, PlayIcon } from "@/components/icons";
import VideoPlayerModal from "@/components/customer/VideoPlayerModal";
import CartDrawer from "@/components/customer/CartDrawer";
import { getOrCreateTable } from "@/lib/table";
import { useCart } from "@/lib/useCart";

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
  return s.length > 90 ? `${s.slice(0, 90).trim()}…` : s;
}

export default function CustomerMenuApi({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const [table, setTable] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState<string>("DishLens");
  const [restaurantAddress, setRestaurantAddress] = useState<string>("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string>("");
  const [restaurantHeroUrl, setRestaurantHeroUrl] = useState<string>("");

  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [q, setQ] = useState("");

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = searchParams?.get("t") ?? undefined;
    const resolved = getOrCreateTable(slug, t);
    setTable(resolved);
  }, [slug, searchParams]);

  const cart = useCart(slug, table || "T-000");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const payload = await publicMenu(slug);
        const norm = normalizePublicMenu(payload);

        setRestaurantName(norm.restaurantName || "DishLens");
        setRestaurantAddress(norm.address || "");
        setRestaurantLogoUrl(norm.logoUrl || "");
        setRestaurantHeroUrl(norm.heroImageUrl || "");

        setCategories(norm.categories);
        setActiveTab(norm.categories?.[0]?.name || "Menu");
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const categoriesWithPicked = useMemo(() => {
    const hasPicked = categories.some(
      (c) => c.name.toLowerCase() === "picked for you"
    );
    if (hasPicked || categories.length === 0) return categories;

    const all = categories.flatMap((c) => c.items ?? []);
    const rated = all
      .filter((d) => typeof d.avgRating === "number")
      .sort(
        (a, b) =>
          (b.avgRating! - a.avgRating!) ||
          ((b.ratingCount ?? 0) - (a.ratingCount ?? 0))
      );

    const picks: UiDish[] = [];
    if (rated.length > 0) {
      for (const d of rated) {
        if (!picks.some((x) => x.id === d.id)) picks.push(d);
        if (picks.length >= 6) break;
      }
    } else {
      for (const c of categories) {
        if (c.items?.[0]) picks.push(c.items[0]);
        if (picks.length >= 6) break;
      }
    }

    return [{ id: "picked", name: "Picked for you", items: picks }, ...categories];
  }, [categories]);

  const filteredByQuery = useMemo(() => {
    if (!q) return categoriesWithPicked;
    const query = q.toLowerCase();

    return categoriesWithPicked
      .map((c) => ({
        ...c,
        items: (c.items ?? []).filter((d) =>
          d.name.toLowerCase().includes(query)
        ),
      }))
      .filter((c) => (c.items ?? []).length > 0);
  }, [categoriesWithPicked, q]);

  const heroImage =
    restaurantHeroUrl ||
    filteredByQuery?.[0]?.items?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1604909052743-94e838986d9a?auto=format&fit=crop&w=1400&q=70";

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
        { root: null, threshold: 0.25, rootMargin: "-40% 0px -55% 0px" }
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

    const stickyOffset = 64;
    const y = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const openVideo = (dish: UiDish) => {
    if (!dish.videoUrl) {
      window.location.href = `${baseHref}/dish/${dish.id}`;
      return;
    }
    setVideoTitle(dish.name);
    setVideoSrc(dish.videoUrl);
  };

  const closeVideo = () => {
    setVideoSrc(null);
    setVideoTitle("");
  };

  const submitOrder = async () => {
    if (submitting) return;
    if (!table) return;
    if (cart.lines.length === 0) return;

    try {
      setSubmitting(true);
      await createPublicOrder(slug, {
        tableNumber: table,
        lines: cart.lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
        })),
      });
      cart.clear();
      window.alert("Order submitted! The restaurant will see it on the kitchen dashboard.");
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <VideoPlayerModal
        open={!!videoSrc}
        src={videoSrc}
        title={videoTitle}
        onClose={closeVideo}
      />

      {/* Hero full-bleed (IMPORTANT: outer wrapper must be overflow-visible) */}
      <div className="relative w-full overflow-visible">
        {/* Only the IMAGE area should be overflow-hidden */}
        <div className="relative h-[240px] w-full overflow-hidden">
          <Image
            src={heroImage}
            alt="Restaurant hero"
            fill
            className="object-cover"
            priority
            unoptimized={process.env.NODE_ENV === "development"}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/55" />
        </div>

        {/* Logo badge (positioned OUTSIDE the clipped image container) */}
        <div className="absolute left-5 sm:left-6 -bottom-10 z-30">
          <div className="h-20 w-20 rounded-full bg-white shadow-soft grid place-items-center border overflow-hidden">
            {restaurantLogoUrl ? (
              <div className="relative h-16 w-16 rounded-full bg-white p-1">
                <Image
                  src={restaurantLogoUrl}
                  alt="Restaurant logo"
                  fill
                  className="object-contain"
                  sizes="64px"
                  unoptimized={process.env.NODE_ENV === "development"}
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-zinc-900 text-white grid place-items-center text-xs font-bold">
                DL
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content column */}
      <Container className="max-w-3xl px-0 sm:px-4">
        {/* extra top padding so logo overlap doesn't collide */}
        <div className="px-4 pt-12 pb-4">
          <div className="text-2xl font-black tracking-tight text-zinc-900">
            {restaurantName}
          </div>

          <div className="mt-1 text-sm text-zinc-600">
            {restaurantAddress ? restaurantAddress : ""}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
              tableNumber : {table || "—"}
            </span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
              Tap image for video
            </span>
          </div>

          {/* Search bar */}
          <div className="mt-3 flex items-center gap-2 rounded-full border bg-white px-4 py-2.5">
            <SearchIcon className="h-4 w-4 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        {loading && (
          <div className="px-4 py-6 text-sm text-zinc-600">Loading menu…</div>
        )}

        {err && (
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
        )}

        {!loading && !err && (
          <>
            {/* Sticky category tabs */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
              <div className="px-4 py-2 flex gap-6 overflow-x-auto whitespace-nowrap no-scrollbar">
                {filteredByQuery.map((c) => (
                  <button
                    key={c.id || c.name}
                    onClick={() => scrollToCategory(c.name)}
                    className={clsx(
                      "pb-2 text-sm font-semibold transition",
                      activeTab === c.name
                        ? "text-zinc-900 border-b-2 border-zinc-900"
                        : "text-zinc-500"
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            <div className="px-4 pt-3 pb-8">
              {filteredByQuery.map((cat) => {
                const items = cat.items ?? [];
                const drinks = isDrinksCategory(cat.name);

                return (
                  <section
                    key={cat.id || cat.name}
                    ref={(el) => {
                      sectionRefs.current[cat.name] = el;
                    }}
                    className="pt-6 scroll-mt-20"
                  >
                    <h2 className="text-xl font-black text-zinc-900">
                      {cat.name}
                    </h2>

                    {drinks ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {items.map((d) => (
                          <DrinkCard
                            key={d.id}
                            dish={d}
                            baseHref={baseHref}
                            onPlay={() => openVideo(d)}
                            onAdd={() =>
                              cart.add(
                                {
                                  menuItemId: d.id,
                                  name: d.name,
                                  price: moneyNumber(d.price),
                                  imageUrl: d.imageUrl ?? null,
                                },
                                1
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 divide-y">
                        {items.map((d) => (
                          <MenuRow
                            key={d.id}
                            dish={d}
                            baseHref={baseHref}
                            onPlay={() => openVideo(d)}
                            onAdd={() =>
                              cart.add(
                                {
                                  menuItemId: d.id,
                                  name: d.name,
                                  price: moneyNumber(d.price),
                                  imageUrl: d.imageUrl ?? null,
                                },
                                1
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </Container>

      <CartDrawer
        tableNumber={table || "—"}
        lines={cart.lines}
        total={cart.total}
        onChangeQty={cart.setQty}
        onSubmit={submitOrder}
        submitting={submitting}
      />
    </div>
  );
}

function MenuRow({
  dish,
  baseHref,
  onPlay,
  onAdd,
}: {
  dish: UiDish;
  baseHref: string;
  onPlay: () => void;
  onAdd: () => void;
}) {
  const img =
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=70";

  return (
    <div className="py-4 flex items-start gap-4">
      <Link
        href={`${baseHref}/dish/${dish.id}`}
        className="min-w-0 flex-1"
        aria-label={`Open ${dish.name}`}
      >
        <div className="font-semibold text-[15px] text-zinc-900">{dish.name}</div>
        <div className="mt-0.5 text-sm text-zinc-600 max-h-[2.5rem] overflow-hidden">
          {shortText(dish.description) || " "}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-900">{money(dish.price)}</div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            className="rounded-full bg-zinc-900 text-white px-3 py-1.5 text-xs font-semibold"
            aria-label={`Add ${dish.name} to order`}
          >
            Add
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {dish.isVeg === false ? (
            <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
              Non-Veg
            </span>
          ) : null}

          {String(dish.spice || "").toUpperCase() === "HOT" ? (
            <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold">
              Spice: Hot
            </span>
          ) : null}

          {(dish.allergens || []).some(
            (a) =>
              String(a).toUpperCase().includes("GLUTEN") ||
              String(a).toUpperCase().includes("WHEAT")
          ) ? (
            <span className="rounded-full bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold">
              Gluten
            </span>
          ) : null}
        </div>
      </Link>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dish.videoUrl) onPlay();
            else window.location.href = `${baseHref}/dish/${dish.id}`;
          }}
          className="block"
          aria-label={dish.videoUrl ? `Play video for ${dish.name}` : `Open ${dish.name}`}
        >
          <Image
            src={img}
            alt={dish.name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-2xl object-cover"
            unoptimized={process.env.NODE_ENV === "development"}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dish.videoUrl) onPlay();
            else window.location.href = `${baseHref}/dish/${dish.id}`;
          }}
          className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-2"
          aria-label={dish.videoUrl ? `Play video for ${dish.name}` : `Open ${dish.name}`}
        >
          <PlayIcon className="h-4 w-4" />
          {dish.videoUrl ? "Video" : "Details"}
        </button>
      </div>
    </div>
  );
}

function DrinkCard({
  dish,
  baseHref,
  onPlay,
  onAdd,
}: {
  dish: UiDish;
  baseHref: string;
  onPlay: () => void;
  onAdd: () => void;
}) {
  const img =
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1542444459-db37a1d7c14e?auto=format&fit=crop&w=1000&q=70";

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="relative h-24 w-full">
        <Image
          src={img}
          alt={dish.name}
          fill
          className="object-cover"
          unoptimized={process.env.NODE_ENV === "development"}
        />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd();
          }}
          className="absolute top-2 right-2 rounded-full bg-white/95 text-zinc-900 px-3 py-1.5 text-xs font-semibold border shadow-soft"
          aria-label={`Add ${dish.name} to order`}
        >
          Add
        </button>

        {dish.videoUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-2"
            aria-label={`Play video for ${dish.name}`}
          >
            <PlayIcon className="h-4 w-4" />
            Video
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (window.location.href = `${baseHref}/dish/${dish.id}`)}
            className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-semibold"
            aria-label={`Open ${dish.name}`}
          >
            Details
          </button>
        )}
      </div>

      <div className="p-3">
        <Link
          href={`${baseHref}/dish/${dish.id}`}
          className="text-sm font-semibold text-zinc-900 truncate block"
        >
          {dish.name}
        </Link>
        <div className="mt-0.5 text-sm font-semibold text-zinc-900">{money(dish.price)}</div>
        <div className="mt-1 text-xs text-zinc-600 truncate">
          {shortText(dish.description) || " "}
        </div>
      </div>
    </div>
  );
}
