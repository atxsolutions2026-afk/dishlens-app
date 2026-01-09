"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import SplitView from "@/components/layout/SplitView";
import Badge from "@/components/ui/Badge";
import { PlayIcon, SearchIcon, HeartIcon } from "@/components/icons";
import { clsx } from "clsx";
import { publicMenu } from "@/lib/endpoints";
import { restaurantSlug } from "@/lib/env";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";
import DishPreview from "@/components/customer/DishPreview";
import Link from "next/link";

export default function CustomerMenuApi() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("DishLens");
  const [categories, setCategories] = useState<UiCategory[]>([]);

  const [tab, setTab] = useState<string>("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const payload = await publicMenu(restaurantSlug());
        const norm = normalizePublicMenu(payload);
        setRestaurantName(norm.restaurantName || "DishLens");
        setCategories(norm.categories);
        const firstTab = norm.categories?.[0]?.name || "Menu";
        setTab(firstTab);
        const firstItem = norm.categories?.[0]?.items?.[0]?.id ?? null;
        setSelectedId(firstItem);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = useMemo(
    () => categories.find((c) => c.name === tab) ?? categories[0],
    [categories, tab]
  );

  const filtered = useMemo(() => {
    const items = active?.items ?? [];
    return items.filter((d) =>
      q ? d.name.toLowerCase().includes(q.toLowerCase()) : true
    );
  }, [active, q]);

  const selectedDish = useMemo(() => {
    const all = categories.flatMap((c) => c.items);
    return all.find((x) => x.id === selectedId) ?? filtered[0] ?? null;
  }, [categories, selectedId, filtered]);

  const heroImage =
    selectedDish?.imageUrl ||
    "https://images.unsplash.com/photo-1604909052743-94e838986d9a?auto=format&fit=crop&w=1200&q=70";

  return (
    <Container>
      <div className="mb-6">
        <div className="text-3xl font-black tracking-tight">Menu</div>
        <div className="mt-1 text-sm text-zinc-600">
          {restaurantName} • Visual ordering with photos & videos
        </div>
      </div>

      {loading && (
        <Panel className="p-4 text-sm text-zinc-600">Loading menu...</Panel>
      )}

      {err && (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">
          {err}
          <div className="mt-2 text-xs text-red-700">
            Tip: set{" "}
            <code className="px-1 py-0.5 bg-white border rounded">
              NEXT_PUBLIC_RESTAURANT_SLUG
            </code>{" "}
            in{" "}
            <code className="px-1 py-0.5 bg-white border rounded">.env.local</code>.
          </div>
        </Panel>
      )}

      {!loading && !err && (
        <SplitView
          left={
            <div className="grid gap-4">
              <Panel className="overflow-hidden">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/55 z-[1]" />
                  <Image
                    src={heroImage}
                    alt="hero"
                    width={1200}
                    height={700}
                    className="h-[160px] w-full object-cover"
                    priority
                  />
                  <div className="absolute left-5 top-4 z-[2]">
                    <div className="text-2xl font-black tracking-tight text-white drop-shadow">
                      {restaurantName}
                    </div>
                    <div className="mt-1 text-xs text-white/90">
                      Tap an item to preview on desktop
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex gap-2">
                    {(categories.length ? categories : [{ id: "menu", name: "Menu", items: [] }]).map(
                      (c) => (
                        <button
                          key={c.id || c.name}
                          onClick={() => {
                            setTab(c.name);
                            setSelectedId(c.items?.[0]?.id ?? null);
                          }}
                          className={clsx(
                            "flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                            tab === c.name
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-zinc-700 border-zinc-200"
                          )}
                        >
                          {c.name}
                        </button>
                      )
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
                    <SearchIcon className="h-4 w-4 text-zinc-500" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search dishes..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </Panel>

              <div className="grid gap-3">
                {filtered.map((d) => (
                  <DishRow
                    key={d.id}
                    dish={d}
                    selected={d.id === selectedId}
                    onSelect={() => setSelectedId(d.id)}
                  />
                ))}

                {filtered.length === 0 && (
                  <Panel className="p-4 text-sm text-zinc-600">No dishes found.</Panel>
                )}
              </div>
            </div>
          }
          right={
            <>
              <div className="hidden lg:block">
                <DishPreview dish={selectedDish} variant="desktop" />
              </div>

              <div className="lg:hidden">
                <Panel className="p-4 text-sm text-zinc-700">
                  On mobile, tap a dish to open its detail screen.
                </Panel>
                <div className="mt-4 grid gap-3">
                  {filtered.slice(0, 8).map((d) => (
                    <Link key={d.id} href={`/customer/dish/${d.id}`}>
                      <Panel className="p-4 hover:border-zinc-300 transition">
                        <div className="font-bold">{d.name}</div>
                        <div className="mt-1 text-sm text-zinc-600">
                          ${(d.price ?? 0).toFixed(2)}
                        </div>
                      </Panel>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          }
        />
      )}
    </Container>
  );
}

function DishRow({
  dish,
  selected,
  onSelect
}: {
  dish: UiDish;
  selected: boolean;
  onSelect: () => void;
}) {
  const img =
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=70";
  const price = Number.isFinite(dish.price) ? dish.price : 0;

  return (
    <Panel
      className={clsx(
        "overflow-hidden cursor-pointer transition hover:border-zinc-300",
        selected && "ring-2 ring-zinc-900/10 border-zinc-300"
      )}
    >
      <button onClick={onSelect} className="w-full text-left">
        <div className="relative">
          <Image
            src={img}
            alt={dish.name}
            width={1200}
            height={800}
            className="h-[140px] w-full object-cover"
          />

          <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl bg-black/60 text-white backdrop-blur">
            <PlayIcon className="h-6 w-6" />
          </div>
          <div className="absolute right-4 bottom-4 rounded-2xl bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
            ${price.toFixed(2)}
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{dish.name}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                tone={
                  dish.spice === "HOT"
                    ? "danger"
                    : dish.spice === "MEDIUM"
                    ? "warning"
                    : "neutral"
                }
              >
                {dish.spice ?? "NONE"}
              </Badge>
              {dish.isVeg ? <Badge tone="success">VEG</Badge> : <Badge>NON-VEG</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-600">
            <div className="rounded-xl border border-zinc-200 bg-white px-2 py-2">
              <HeartIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </button>
    </Panel>
  );
}
