"use client";

import { useMemo } from "react";

type Props = {
  value?: number; // user-selected rating (1..5)
  avg?: number; // average rating
  count?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
};

export default function StarRating({ value, avg, count, onChange, disabled }: Props) {
  const displayAvg = useMemo(() => {
    const a = typeof avg === "number" ? avg : undefined;
    if (!a) return null;
    return Math.round(a * 10) / 10;
  }, [avg]);

  const selected = typeof value === "number" ? value : 0;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1" aria-label="Rate this dish">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= selected;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(n)}
              className={
                "h-9 w-9 rounded-full grid place-items-center border text-lg " +
                (active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200") +
                (disabled ? " opacity-60" : "")
              }
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            >
              ★
            </button>
          );
        })}
      </div>

      <div className="text-right">
        {displayAvg !== null ? (
          <div className="text-sm font-semibold text-zinc-900">{displayAvg} / 5</div>
        ) : (
          <div className="text-sm font-semibold text-zinc-900">Be the first to rate</div>
        )}
        {typeof count === "number" ? (
          <div className="text-[11px] text-zinc-500">{count} rating{count === 1 ? "" : "s"}</div>
        ) : null}
      </div>
    </div>
  );
}
