"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

type Props = {
  restaurantName: string;
  logoUrl?: string | null;
  heroUrl?: string | null;
  tableLabel?: string | null; // e.g. "Table: 1"
  hint?: string | null; // e.g. "Tap an image for video"
};

export default function RestaurantHeroCollapsible({
  restaurantName,
  logoUrl,
  heroUrl,
  tableLabel,
  hint,
}: Props) {
  const [y, setY] = useState(0);

  useEffect(() => {
    const onScroll = () => setY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile collapse math:
  // - starts tall
  // - collapses to a compact sticky header after ~140px scroll
  const { progress, heroH } = useMemo(() => {
    const max = 140; // collapse distance
    const p = Math.max(0, Math.min(1, y / max));
    const startH = 190; // expanded height
    const endH = 88; // collapsed height
    const h = Math.round(startH + (endH - startH) * p);
    return { progress: p, heroH: h };
  }, [y]);

  const blur = Math.round(12 * progress);
  const dim = 1 - 0.25 * progress;

  return (
    <div
      className="sticky top-0 z-30"
      style={{
        // Helps prevent content jump as it collapses
        height: heroH,
      }}
    >
      <div
        className="relative h-full overflow-hidden border-b bg-white"
        style={{
          // Give a little depth when collapsed
          boxShadow:
            progress > 0.75 ? "0 10px 25px rgba(0,0,0,0.08)" : undefined,
        }}
      >
        {/* HERO IMAGE */}
        <div className="absolute inset-0">
          {heroUrl ? (
            <Image
              src={heroUrl}
              alt={`${restaurantName} hero`}
              fill
              priority
              className="object-cover"
              style={{
                filter: `blur(${blur}px)`,
                opacity: dim,
                transform: `scale(${1 + 0.05 * progress})`,
              }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-soft) 0%, #ffffff 60%, var(--brand-soft) 100%)",
              }}
            />
          )}

          {/* gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-white/95" />
        </div>

        {/* CONTENT ROW */}
        <div className="relative flex h-full items-end">
          <div className="w-full px-4 pb-3">
            <div className="flex items-center gap-3">
              {/* LOGO */}
              <div
                className={clsx(
                  "relative grid place-items-center overflow-hidden rounded-full border bg-white shadow-sm",
                )}
                style={{
                  width: 52 - Math.round(10 * progress),
                  height: 52 - Math.round(10 * progress),
                }}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${restaurantName} logo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="grid h-full w-full place-items-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    {restaurantName?.slice(0, 2)?.toUpperCase() || "DL"}
                  </div>
                )}
              </div>

              {/* TITLE + CHIPS */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold text-white drop-shadow">
                  {restaurantName}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {tableLabel ? (
                    <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-zinc-800">
                      {tableLabel}
                    </span>
                  ) : null}

                  {hint ? (
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      {hint}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Optional brand dot */}
              <div
                className="h-3 w-3 rounded-full border border-white/60"
                style={{ backgroundColor: "var(--brand)" }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
