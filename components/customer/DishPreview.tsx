"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { BackIcon, FlameIcon, LeafIcon, AlertIcon, PlayIcon } from "@/components/icons";
import { UiDish } from "@/lib/menuAdapter";
import StarRating from "@/components/customer/StarRating";
import { rateMenuItem } from "@/lib/endpoints";

function money(v: number | undefined) {
  const p = Number.isFinite(v) ? (v as number) : 0;
  return `$${p.toFixed(2)}`;
}

function spiceLabel(spice?: string) {
  const s = (spice || "NONE").toUpperCase();
  if (s === "HOT") return "Hot";
  if (s === "MEDIUM") return "Medium";
  if (s === "MILD") return "Mild";
  return "None";
}

export default function DishPreview({
  dish,
  variant = "desktop",
  backHref
  ,onAddToOrder
}: {
  dish: UiDish | null;
  variant?: "desktop" | "mobile";
  backHref?: string;
  onAddToOrder?: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [myRating, setMyRating] = useState<number | undefined>(undefined);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMsg, setRatingMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!dish?.id) return;
    try {
      const key = `dl_rating_${dish.id}`;
      const v = localStorage.getItem(key);
      const n = v ? Number(v) : NaN;
      setMyRating(Number.isFinite(n) ? n : undefined);
    } catch {
      // ignore
    }
  }, [dish?.id]);

  function getOrCreateClientId(): string | undefined {
  try {
    const key = "dl_client_id";
    let id = localStorage.getItem(key);

    if (typeof id !== "string" || id.length === 0) {
      const newId =
        (crypto as any)?.randomUUID?.() ??
        `${Date.now()}_${Math.random()}`;

      localStorage.setItem(key, newId);
      return newId;
    }

    return id;
   } catch {
      return undefined;
    }
  }
  
  async function submitRating(v: number) {
    if (!dish?.id) return;
    setMyRating(v);
    setRatingMsg(null);
    try {
      localStorage.setItem(`dl_rating_${dish.id}`, String(v));
    } catch {
      // ignore
    }

    setRatingBusy(true);
    try {
      await rateMenuItem(dish.id, v, getOrCreateClientId());
      setRatingMsg("Thanks! Your rating was submitted.");
    } catch {
      // Backend may not be deployed yet; keep local rating for UX.
      setRatingMsg("Saved on this device (server not available yet).");
    } finally {
      setRatingBusy(false);
    }
  }

  useEffect(() => {
    // reset video reveal when switching dishes
    setShowVideo(false);
  }, [dish?.id]);
  if (!dish) {
    return (
      <div className="rounded-3xl border bg-white p-6">
        <div className="text-sm font-semibold text-zinc-700">Select a dish</div>
        <div className="mt-1 text-sm text-zinc-500">
          Choose an item from the menu to preview it here.
        </div>
      </div>
    );
  }

  const img =
    dish.imageUrl ||
    "https://images.unsplash.com/photo-1604909052743-94e838986d9a?auto=format&fit=crop&w=1200&q=70";
  const vid = dish.videoUrl;

  if (variant === "mobile") {
    return (
      <div className="bg-white">
        <div className="relative">
          {vid ? (
            <div className="w-full">
              {showVideo ? (
                <video
                  src={vid}
                  className="w-full aspect-video object-contain bg-black"
                  poster={img}
                  autoPlay
                  playsInline
                  controls
                  muted={muted}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="block w-full"
                  aria-label="Play video"
                >
                  <div className="relative w-full aspect-video bg-black">
                    <Image
                      src={img}
                      alt={dish.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 rounded-full bg-black/60 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
                    <PlayIcon className="h-5 w-5" />
                    Play
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="relative w-full aspect-video">
              <Image src={img} alt={dish.name} fill className="object-cover" priority />
            </div>
          )}

          {/* Top actions (modern, one-hand friendly) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/60 pointer-events-none" />

          {backHref && (
            <Link
              href={backHref}
              className="absolute left-4 top-4 h-11 w-11 rounded-full bg-white/95 backdrop-blur border shadow-soft grid place-items-center"
              aria-label="Back"
            >
              <BackIcon className="h-6 w-6 text-zinc-900" />
            </Link>
          )}

          {/* Sound toggle (when video is showing) */}
          {vid && showVideo ? (
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              className="absolute left-4 bottom-4 rounded-full bg-black/55 text-white px-3 py-2 text-xs font-semibold border border-white/20"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "🔇 Sound" : "🔊 Sound"}
            </button>
          ) : null}
        </div>

        <div className="px-4 pt-4 pb-24">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-black leading-tight text-zinc-900">
                {dish.name}
              </div>
              {dish.categoryName ? (
                <div className="mt-1 text-xs text-zinc-500">{dish.categoryName}</div>
              ) : null}
            </div>
            <div className="shrink-0 text-lg font-semibold text-zinc-900">{money(dish.price)}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="neutral">
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="h-4 w-4" />
                Spice: {spiceLabel(dish.spice)}
              </span>
            </Badge>
            <Badge tone={dish.isVeg ? "success" : "neutral"}>
              <span className="inline-flex items-center gap-1">
                <LeafIcon className="h-4 w-4" />
                {dish.isVeg ? "Veg" : "Non-Veg"}
              </span>
            </Badge>
            {(dish.allergens ?? []).slice(0, 4).map((a) => (
              <Badge key={a} tone="warning">
                <span className="inline-flex items-center gap-1">
                  <AlertIcon className="h-4 w-4" />
                  {a}
                </span>
              </Badge>
            ))}
          </div>

          {/* Ratings */}
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="text-xs font-semibold text-zinc-700">Rate this dish</div>
            <div className="mt-2">
              <StarRating
                value={myRating}
                avg={dish.avgRating}
                count={dish.ratingCount}
                disabled={ratingBusy}
                onChange={submitRating}
              />
            </div>
            {ratingMsg ? (
              <div className="mt-2 text-[11px] text-zinc-500">{ratingMsg}</div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border bg-zinc-50 p-4">
            <div className="text-xs font-semibold text-zinc-700">Description</div>
            <p className="mt-1 text-sm leading-6 text-zinc-700">
              {dish.description ?? " "}
            </p>
          </div>
        </div>

        {/* Sticky bottom Add bar (Uber-like) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t">
          <div className="mx-auto max-w-3xl px-4 py-3 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                onAddToOrder?.();
                window.alert("Added to your order. Open the cart to checkout.");
              }}
            >
              Add to Order • {money(dish.price)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop preview (keep existing style, but slightly cleaner)
  return (
    <div className="rounded-3xl border bg-white overflow-hidden shadow-soft">
      <div className="relative">
        {vid ? (
          <video
            src={vid}
            controls
            className="w-full aspect-video object-contain bg-black"
            poster={img}
          />
        ) : (
          <Image
            src={img}
            alt={dish.name}
            width={1400}
            height={900}
            className="w-full aspect-video object-cover"
            priority
          />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-black leading-tight">{dish.name}</div>
            {dish.categoryName && (
              <div className="mt-1 text-xs text-zinc-500">{dish.categoryName}</div>
            )}
          </div>
          <div className="text-lg font-semibold">{money(dish.price)}</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">Spice: {spiceLabel(dish.spice)}</Badge>
          {dish.isVeg ? <Badge tone="success">Veg</Badge> : <Badge>Non-Veg</Badge>}
          {(dish.allergens ?? []).slice(0, 8).map((a) => (
            <Badge key={a} tone="warning">
              {a}
            </Badge>
          ))}
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
    </div>
  );
}
