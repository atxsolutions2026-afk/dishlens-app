"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { money } from "@/lib/cart";
import { CartLine } from "@/lib/cart";

export default function CartDrawer({
  tableNumber,
  lines,
  total,
  onChangeQty,
  onSubmit,
  submitting,
}: {
  tableNumber: string;
  lines: CartLine[];
  total: number;
  onChangeQty: (menuItemId: string, qty: number) => void;
  onSubmit: () => Promise<void> | void;
  submitting: boolean;
}) {
  const [open, setOpen] = useState(false);

  const count = lines.reduce((s, l) => s + (l.quantity || 0), 0);

  if (count <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-zinc-900 text-white shadow-soft px-4 py-3 text-sm font-semibold flex items-center gap-2"
        aria-label="Open cart"
      >
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs">
          {count}
        </span>
        Cart • {money(total)}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-soft border">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-zinc-900">Your Order</div>
                <div className="text-xs text-zinc-500">tableNumber: {tableNumber}</div>
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
                  <div key={l.menuItemId} className="py-4 flex items-center gap-3">
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
                      <div className="text-sm font-semibold text-zinc-900 truncate">
                        {l.name}
                      </div>
                      <div className="text-xs text-zinc-600">{money(l.price)} each</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-full border grid place-items-center"
                        onClick={() => onChangeQty(l.menuItemId, (l.quantity || 1) - 1)}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <div className="w-6 text-center text-sm font-semibold">
                        {l.quantity}
                      </div>
                      <button
                        type="button"
                        className="h-9 w-9 rounded-full border grid place-items-center"
                        onClick={() => onChangeQty(l.menuItemId, (l.quantity || 1) + 1)}
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
              <Button
                className="w-full"
                onClick={async () => {
                  await onSubmit();
                  setOpen(false);
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Order"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
