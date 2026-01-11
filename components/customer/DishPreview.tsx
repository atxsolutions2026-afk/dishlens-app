"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Panel from "@/components/layout/Panel";
import Badge from "@/components/ui/Badge";
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
            "h-2 w-2 rounded-full",
            i <= count ? "bg-red-600" : "bg-zinc-300"
          ].join(" ")}
        />
      ))}
      <span className="ml-2 text-xs font-medium text-zinc-600">
        {(spice ?? "NONE").toString()}
      </span>
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

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

  // Try to autoplay when dish changes
  useEffect(() => {
    setAutoplayFailed(false);
    const el = videoRef.current;
    if (!el || !vid) return;

    const tryPlay = async () => {
      try {
        el.muted = true;
        el.playsInline = true as any;
        await el.play();
      } catch {
        setAutoplayFailed(true);
      }
    };

    tryPlay();
  }, [vid, dish.id]);

  return (
    <Panel className="overflow-hidden rounded-3xl">
      {/* MEDIA */}
      <div className="relative">
        {vid ? (
          <div className="relative">
            <video
              ref={videoRef}
              src={vid}
              muted
              loop
              playsInline
              preload="metadata"
              controls={autoplayFailed}
              poster={img}
              onError={() => setAutoplayFailed(true)}
              className={[
                "w-full object-cover",
                variant === "desktop" ? "h-[380px]" : "h-[240px]"
              ].join(" ")}
            />

            {autoplayFailed && (
              <button
                type="button"
                onClick={async () => {
                  const el = videoRef.current;
                  if (!el) return;
                  try {
                    el.muted = false;
                    await el.play();
                    setAutoplayFailed(false);
                  } catch {}
                }}
                className="absolute inset-0 grid place-items-center bg-black/30 text-white"
              >
                <div className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold backdrop-blur">
                  Tap to Play
                </div>
              </button>
            )}
          </div>
        ) : (
          <Image
            src={img}
            alt={dish.name}
            width={1400}
            height={900}
            className={[
              "w-full object-cover",
              variant === "desktop" ? "h-[380px]" : "h-[240px]"
            ].join(" ")}
            priority
          />
        )}
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {/* TITLE + PRICE + ORDER */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-700 leading-tight">
              {dish.name}
            </div>

            {/* TAGS */}
            <div className="mt-2 flex flex-wrap gap-2">
              {(dish.allergens ?? []).slice(0, 6).map((a) => (
                <Badge key={a} tone="warning">
                  {a}
                </Badge>
              ))}
              {dish.isVeg ? (
                <Badge tone="success">Vegetarian</Badge>
              ) : (
                <Badge>Non-Veg</Badge>
              )}
            </div>

            {dish.categoryName && (
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                {dish.categoryName}
              </div>
            )}
          </div>

          {/* PRICE + ORDER */}
          <div className="text-right">
            <div className="text-lg font-semibold text-zinc-800">
              ${price.toFixed(2)}
            </div>

            <button
              className="mt-1 inline-flex items-center rounded-md border border-green-600 px-3 py-1 text-sm font-semibold text-green-600 transition hover:bg-green-50 hover:text-green-700"
            >
              Order
            </button>
          </div>
        </div>

        {/* DESCRIPTION */}
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {dish.description ??
            "Prepared with authentic spices and slow-cooked to bring out rich flavor and aroma."}
        </p>

        {/* INGREDIENTS */}
        {dish.ingredients && (
          <p className="mt-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-600">Ingredients:</span>{" "}
            {dish.ingredients}
          </p>
        )}

        {/* SPICE LEVEL */}
        <div className="mt-4 border-t pt-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Spice Level
          </div>
          <div className="mt-1">{spiceDots(dish.spice)}</div>
        </div>

        <div className="mt-3 text-center text-[11px] text-zinc-500">
          Ordering is future scope (MVP UI only)
        </div>
      </div>
    </Panel>
  );
}
