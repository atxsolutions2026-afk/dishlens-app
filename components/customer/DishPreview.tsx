"use client";

import Image from "next/image";
import Panel from "@/components/layout/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { UiDish } from "@/lib/menuAdapter";

function spiceDots(spice?: string) {
  const s = (spice || "NONE").toUpperCase();
  const count = s === "HOT" ? 3 : s === "MEDIUM" ? 2 : s === "MILD" ? 1 : 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={[
            "h-2.5 w-2.5 rounded-full",
            i <= count ? "bg-red-600" : "bg-zinc-200"
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export default function DishPreview({
  dish,
  variant = "desktop"
}: {
  dish: UiDish | null;
  variant?: "desktop" | "mobile";
}) {
  if (!dish) {
    return (
      <Panel className="p-6">
        <div className="text-sm font-semibold text-zinc-700">Select a dish</div>
        <div className="mt-1 text-sm text-zinc-500">
          Choose an item from the menu to preview it here.
        </div>
      </Panel>
    );
  }

  const img =
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1604909052743-94e838986d9a?auto=format&fit=crop&w=1200&q=70";
  const vid = dish.videoUrl;
  const price = Number.isFinite(dish.price) ? dish.price : 0;

  return (
    <Panel className="overflow-hidden">
      <div className="relative">
        {vid ? (
          <video
            src={vid}
            controls
            className={["w-full object-cover", variant === "desktop" ? "h-[360px]" : "h-[240px]"].join(" ")}
            poster={img}
          />
        ) : (
          <Image
            src={img}
            alt={dish.name}
            width={1400}
            height={900}
            className={["w-full object-cover", variant === "desktop" ? "h-[360px]" : "h-[240px]"].join(" ")}
            priority
          />
        )}

        <div className="absolute left-5 bottom-5 rounded-2xl bg-black/55 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          ${price.toFixed(2)}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-black leading-tight">{dish.name}</div>
            {dish.categoryName && (
              <div className="mt-1 text-xs text-zinc-500">{dish.categoryName}</div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white px-3 py-2">
            <div className="text-[11px] font-semibold text-zinc-500">Spice</div>
            <div className="mt-1 flex items-center gap-2">
              {spiceDots(dish.spice)}
              <span className="text-xs font-semibold">{(dish.spice ?? "NONE").toString()}</span>
            </div>
          </div>

          <div className="rounded-2xl border bg-white px-3 py-2">
            <div className="text-[11px] font-semibold text-zinc-500">Portion</div>
            <div className="mt-1 text-xs font-semibold">Full Plate</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(dish.allergens ?? []).slice(0, 8).map((a) => (
            <Badge key={a} tone="warning">
              {a}
            </Badge>
          ))}
          {dish.isVeg ? <Badge tone="success">Vegetarian</Badge> : <Badge>Non-Veg</Badge>}
        </div>

        <p className="mt-3 text-sm text-zinc-600">
          {dish.description ?? "Delicious dish!"}
        </p>

        <div className="mt-5 flex gap-2">
          <Button className="flex-1">Add to Order</Button>
          <Button variant="secondary" className="flex-1">
            Share
          </Button>
        </div>

        <div className="mt-2 text-center text-[11px] text-zinc-500">
          Ordering is future scope (MVP UI only)
        </div>
      </div>
    </Panel>
  );
}
