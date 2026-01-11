"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import { SearchIcon } from "@/components/icons";
import { clsx } from "clsx";
import { publicMenu } from "@/lib/endpoints";
import { restaurantSlug } from "@/lib/env";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";
import DishPreview from "@/components/customer/DishPreview";

export default function CustomerMenuApi() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("DishLens");
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const payload = await publicMenu(restaurantSlug());
        const norm = normalizePublicMenu(payload);

        setRestaurantName(norm.restaurantName || "DishLens");
        setCategories(norm.categories);

        const firstCategory = norm.categories?.[0];
        setActiveCategory(firstCategory?.name || "");
        setExpandedDishId(null);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCategory = useMemo(
    () => categories.find((c) => c.name === activeCategory),
    [categories, activeCategory]
  );

  const filteredDishes = useMemo(() => {
    const items = currentCategory?.items ?? [];
    return items.filter((d) =>
      q ? d.name.toLowerCase().includes(q.toLowerCase()) : true
    );
  }, [currentCategory, q]);

  return (
    <Container>
      {err && (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">
          {err}
        </Panel>
      )}

      {loading && (
        <Panel className="p-4 text-sm text-zinc-600">Loading menu…</Panel>
      )}

      {!loading && !err && (
        <>
          {/* COVER (STATIC IMAGE) */}
          <div className="relative h-[240px] w-full overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1604909052743-94e838986d9a?auto=format&fit=crop&w=1600&q=70"
              alt="cover"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-6 left-6 text-white">
              <div className="text-4xl font-black">{restaurantName}</div>
              <div className="mt-1 text-sm text-white/90">
                Visual ordering with photos & videos
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="mt-8 grid grid-cols-[220px_1fr] gap-0">
            {/* LEFT: CATEGORY LIST */}
            <div className="pr-4 border-r border-zinc-200">
              {/* SEARCH */}
              <div className="mb-4 flex items-center gap-2 rounded-md border px-3 py-2">
                <SearchIcon className="h-4 w-4 text-zinc-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search dishes…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              {/* CATEGORY MENU */}
              <div className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setActiveCategory(c.name);
                      setExpandedDishId(null);
                    }}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm transition",
                      activeCategory === c.name
                        ? "bg-red-50 text-red-600 font-semibold border-l-4 border-red-600"
                        : "text-zinc-700 hover:bg-zinc-100"
                    )}
                  >
                    {c.name}
                    <span className="ml-1 text-xs text-zinc-400">
                      ({c.items?.length ?? 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: DISH LIST WITH INLINE PREVIEW */}
            <div className="pl-6">
              <div className="space-y-2">
                {filteredDishes.map((d) => {
                  const isOpen = expandedDishId === d.id;

                  return (
                    <div key={d.id} className="border-b">
                      {/* DISH ROW */}
                      <button
                        onClick={() =>
                          setExpandedDishId(isOpen ? null : d.id)
                        }
                        className={clsx(
                          "w-full flex items-center justify-between px-2 py-3 text-left transition",
                          isOpen
                            ? "bg-red-50"
                            : "hover:bg-zinc-50"
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold">{d.name}</div>
                          <div className="text-xs text-zinc-500">
                            ${(d.price ?? 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="relative h-12 w-12 overflow-hidden rounded-md">
                          <Image
                            src={
                              d.imageUrl ||
                              "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=70"
                            }
                            alt={d.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </button>

                      {/* INLINE EXPANDED PREVIEW */}
                      {isOpen && (
                        <div className="px-2 pb-4">
                          <DishPreview dish={d} variant="desktop" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredDishes.length === 0 && (
                  <div className="text-sm text-zinc-500">
                    No dishes found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
