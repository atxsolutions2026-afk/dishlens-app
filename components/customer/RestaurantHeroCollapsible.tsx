"use client";

import Image from "next/image";
import { clsx } from "clsx";

const HERO_HEIGHT = 200;

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
  return (
    <>
      {/* Fixed hero - stays in place, no scroll-driven updates (prevents flickering) */}
      <div
        className="fixed left-0 right-0 top-0 z-10"
        style={{ height: HERO_HEIGHT }}
      >
        <div className="relative h-full w-full overflow-hidden border-b border-zinc-200/50 bg-white">
          {/* Hero image - static, no transforms/filters on scroll */}
          <div className="absolute inset-0">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt={`${restaurantName} hero`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
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
            {/* Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-white/95" />
          </div>

          {/* Content overlay */}
          <div className="relative flex h-full items-end">
            <div className="w-full px-4 pb-3">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div
                  className={clsx(
                    "relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/30 bg-white shadow-md",
                  )}
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

                {/* Title + chips */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-extrabold text-white drop-shadow-md">
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

                <div
                  className="h-3 w-3 shrink-0 rounded-full border border-white/60"
                  style={{ backgroundColor: "var(--brand)" }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so content starts below hero; content scrolls over hero with bg-white */}
      <div style={{ height: HERO_HEIGHT }} aria-hidden="true" />
    </>
  );
}
