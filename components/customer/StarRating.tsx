"use client";

import { useMemo, useState } from "react";

type Props = {
  value?: number; // user-selected rating (1..5)
  avg?: number; // average rating (0..5)
  count?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
};

function Star({ filled, active }: { filled: boolean; active: boolean }) {
  // Use SVG instead of the "★" character for a cleaner, modern look.
  return (
    <svg
      viewBox="0 0 20 20"
      className={
        "h-5 w-5 transition-transform " +
        (active ? "scale-105" : "scale-100")
      }
      aria-hidden="true"
    >
      <path
        d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.78L10 14.9l-5.18 2.73.99-5.78L1.62 7.59l5.79-.84L10 1.5z"
        className={
          filled
            ? "fill-amber-500"
            : "fill-zinc-200"
        }
      />
    </svg>
  );
}

export default function StarRating({ value, avg, count, onChange, disabled }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const selected = typeof value === "number" ? value : 0;
  const displayValue = hover ?? selected;

  const displayAvg = useMemo(() => {
    const a = typeof avg === "number" ? avg : undefined;
    if (a == null || Number.isNaN(a)) return null;
    return Math.round(a * 10) / 10;
  }, [avg]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1" aria-label="Rate this dish">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= displayValue;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              className={
                "group grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition " +
                "hover:-translate-y-0.5 hover:shadow " +
                (filled ? "border-amber-200" : "border-zinc-200") +
                (disabled ? " opacity-60 pointer-events-none" : "")
              }
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            >
              <Star filled={filled} active={hover === n} />
            </button>
          );
        })}
      </div>

      <div className="text-right">
        {displayAvg !== null ? (
          <div className="text-sm font-semibold text-zinc-900">
            {displayAvg} / 5
          </div>
        ) : (
          <div className="text-sm font-semibold text-zinc-900">Be the first to rate</div>
        )}
        {typeof count === "number" ? (
          <div className="text-[11px] text-zinc-500">
            {count} rating{count === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
