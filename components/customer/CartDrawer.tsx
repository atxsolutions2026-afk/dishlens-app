"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { CartLine, money } from "@/lib/cart";

function formatMods(line: CartLine): string {
  const m = line.modifiers;
  if (!m) return "";
  const parts: string[] = [];
  if (m.spiceLevel) parts.push(`Spice: ${m.spiceLevel.replaceAll("_", " ")}`);
  if (m.spiceOnSide) parts.push("Spice on side");
  if (m.allergensAvoid?.length) parts.push(`Avoid: ${m.allergensAvoid.join(", ")}`);
  if (m.specialInstructions) parts.push(m.specialInstructions);
  return parts.join(" • ");
}

export default function CartDrawer({
  tableNumber,
  lines,
  total,
  onChangeQty,
  onEditLine,
  onSubmit,
  submitting,
}: {
  tableNumber: string;
  lines: CartLine[];
  total: number;
  onChangeQty: (lineKey: string, qty: number) => void;
  onEditLine?: (line: CartLine) => void;
  onSubmit: () => Promise<void> | void;
  submitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const count = useMemo(() => lines.reduce((s, l) => s + (l.quantity || 0), 0), [lines]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || count <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-zinc-900 text-white shadow-soft px-4 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-95"
        aria-label="Open cart"
      >
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs">
          {count}
        </span>
        Cart • {money(total)}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-soft border">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-zinc-900">Your Order</div>
                <div className="text-xs text-zinc-500">Table: {tableNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-full border grid place-items-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[55vh] overflow-auto px-5 pb-4">
              <div className="divide-y">
                {lines.map((l) => (
                  <div key={l.key} className="py-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                      {l.imageUrl ? (
                        <Image
                          src={l.imageUrl}
                          alt={l.name}
                          fill
                          className="object-cover"
                          unoptimized={process.env.NODE_ENV === "development"}
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-zinc-900 truncate">{l.name}</div>
                        {onEditLine ? (
                          <button
                            type="button"
                            onClick={() => onEditLine(l)}
                            className="rounded-full border px-2.5 py-1 text-[11px] font-bold text-zinc-700"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-600">{money(l.price)} each</div>
                      {formatMods(l) ? (
                        <div className="mt-1 text-[11px] font-semibold text-zinc-600 line-clamp-2">
                          {formatMods(l)}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-full border grid place-items-center"
                        onClick={() => onChangeQty(l.key, (l.quantity || 1) - 1)}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <div className="w-6 text-center text-sm font-semibold">{l.quantity}</div>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-full border grid place-items-center"
                        onClick={() => onChangeQty(l.key, (l.quantity || 1) + 1)}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 border-t">
              <div className="flex items-center justify-between py-3">
                <div className="text-sm font-semibold text-zinc-700">Total</div>
                <div className="text-lg font-black text-zinc-900">{money(total)}</div>
              </div>
              <button
                className="w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-extrabold disabled:opacity-60"
                onClick={async () => {
                  await onSubmit();
                  setOpen(false);
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Order"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
