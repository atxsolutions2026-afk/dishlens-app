"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMON_ALLERGENS, LineModifiers, SPICE_LEVELS, SpiceLevel } from "@/lib/cart";
import { clsx } from "clsx";

export default function CustomizeItemSheet({
  open,
  title,
  priceLabel,
  initial,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  priceLabel?: string;
  initial?: LineModifiers;
  onClose: () => void;
  onConfirm: (mods: LineModifiers) => void;
}) {
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(initial?.spiceLevel ?? "MEDIUM");
  const [spiceOnSide, setSpiceOnSide] = useState<boolean>(!!initial?.spiceOnSide);
  const [allergensAvoid, setAllergensAvoid] = useState<string[]>(initial?.allergensAvoid ?? []);
  const [note, setNote] = useState<string>(initial?.specialInstructions ?? "");

  useEffect(() => {
    if (!open) return;
    setSpiceLevel(initial?.spiceLevel ?? "MEDIUM");
    setSpiceOnSide(!!initial?.spiceOnSide);
    setAllergensAvoid(initial?.allergensAvoid ?? []);
    setNote(initial?.specialInstructions ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allergenSet = useMemo(() => new Set(allergensAvoid.map((a) => String(a).toUpperCase())), [allergensAvoid]);

  const toggleAllergen = (a: string) => {
    const key = a.toUpperCase();
    setAllergensAvoid((prev) => {
      const s = new Set(prev.map((x) => String(x).toUpperCase()));
      if (s.has(key)) s.delete(key);
      else s.add(key);
      return Array.from(s);
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white shadow-2xl">
        <div className="mx-auto max-w-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-black text-zinc-900">{title}</div>
              {priceLabel ? <div className="mt-0.5 text-sm font-semibold text-zinc-600">{priceLabel}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border px-3 py-1.5 text-sm font-semibold text-zinc-700"
            >
              Close
            </button>
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold text-zinc-700">Spice level</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SPICE_LEVELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSpiceLevel(s.value)}
                  className={clsx(
                    "rounded-2xl border px-3 py-2 text-sm font-semibold",
                    spiceLevel === s.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-800",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <input
                type="checkbox"
                checked={spiceOnSide}
                onChange={(e) => setSpiceOnSide(e.target.checked)}
              />
              Spice on the side
            </label>
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold text-zinc-700">Allergens / avoid</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_ALLERGENS.map((a) => {
                const active = allergenSet.has(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-bold",
                      active ? "border-rose-300 bg-rose-50 text-rose-800" : "border-zinc-200 bg-white text-zinc-700",
                    )}
                  >
                    {a.replaceAll("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold text-zinc-700">Special instructions</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., no onion/garlic, less oil, sauce on side..."
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              rows={3}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border px-4 py-3 text-sm font-extrabold text-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onConfirm({
                  spiceLevel,
                  spiceOnSide,
                  allergensAvoid,
                  specialInstructions: note.trim() || undefined,
                })
              }
              className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-extrabold text-white"
            >
              Save
            </button>
          </div>

          <div className="h-3" />
        </div>
      </div>
    </div>
  );
}
