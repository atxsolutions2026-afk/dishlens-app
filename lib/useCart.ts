"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartLine,
  CartState,
  calcTotal,
  safeReadCart,
  writeCart,
} from "@/lib/cart";

export function useCart(slug: string, tableNumber: string) {
  const [lines, setLines] = useState<CartLine[]>([]);

  // load when slug/tableNumber changes
  useEffect(() => {
    if (!slug || !tableNumber) return;
    setLines(safeReadCart(slug, tableNumber).lines);
  }, [slug, tableNumber]);

  // persist
  useEffect(() => {
    if (!slug || !tableNumber) return;
    const state: CartState = { slug, tableNumber, lines };
    try {
      writeCart(state);
    } catch {}
  }, [slug, tableNumber, lines]);

  const total = useMemo(() => calcTotal(lines), [lines]);
  const count = useMemo(
    () => lines.reduce((s, l) => s + (l.quantity || 0), 0),
    [lines],
  );

  function add(line: Omit<CartLine, "quantity">, qty = 1) {
    setLines((prev) => {
      const idx = prev.findIndex((x) => x.menuItemId === line.menuItemId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: Math.min(99, (next[idx].quantity || 1) + qty),
        };
        return next;
      }
      return [...prev, { ...line, quantity: Math.max(1, qty) }];
    });
  }

  function setQty(menuItemId: string, quantity: number) {
    const q = Math.max(0, Math.min(99, Math.floor(quantity)));
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.menuItemId !== menuItemId);
      return prev.map((l) =>
        l.menuItemId === menuItemId ? { ...l, quantity: q } : l,
      );
    });
  }

  function clear() {
    setLines([]);
  }

  return { lines, total, count, add, setQty, clear };
}
