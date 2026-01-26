"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CartLine, LineModifiers, lineKey } from "@/lib/cart";

type PersistedCart = {
  v: number;
  lines: CartLine[];
};

function storageKey(slug: string, tableSessionId: string) {
  return `dishlens_cart:${slug}:${tableSessionId}`;
}

function load(slug: string, tableSessionId: string): PersistedCart {
  if (typeof window === "undefined") return { v: 1, lines: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(slug, tableSessionId));
    if (!raw) return { v: 1, lines: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lines)) return { v: 1, lines: [] };
    return { v: 1, lines: parsed.lines };
  } catch {
    return { v: 1, lines: [] };
  }
}

function save(slug: string, tableSessionId: string, cart: PersistedCart) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug, tableSessionId), JSON.stringify(cart));
  } catch {}
}

export function useCart(slug: string, tableSessionId: string) {
  const [lines, setLines] = useState<CartLine[]>(() => load(slug, tableSessionId).lines);

  useEffect(() => {
    setLines(load(slug, tableSessionId).lines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tableSessionId]);

  useEffect(() => {
    save(slug, tableSessionId, { v: 1, lines });
  }, [slug, tableSessionId, lines]);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0),
    [lines],
  );

  const add = useCallback(
    (
      item: { menuItemId: string; name: string; price: number; imageUrl?: string | null },
      qty: number,
      modifiers?: LineModifiers,
    ) => {
      const q = Math.max(1, Math.min(99, Number(qty) || 1));
      const key = lineKey(item.menuItemId, modifiers);
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: Math.min(99, next[idx].quantity + q) };
          return next;
        }
        return [
          ...prev,
          {
            key,
            menuItemId: item.menuItemId,
            name: item.name,
            price: Number(item.price) || 0,
            imageUrl: item.imageUrl ?? null,
            quantity: q,
            modifiers,
          },
        ];
      });
    },
    [],
  );

  const setQty = useCallback((key: string, qty: number) => {
    const q = Math.max(0, Math.min(99, Number(qty) || 0));
    setLines((prev) => {
      const next = prev
        .map((l) => (l.key === key ? { ...l, quantity: q } : l))
        .filter((l) => l.quantity > 0);
      return next;
    });
  }, []);

  const editLine = useCallback((key: string, patch: { modifiers?: LineModifiers; quantity?: number }) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (!existing) return prev;

      const newQty = patch.quantity === undefined ? existing.quantity : Math.max(0, Math.min(99, Number(patch.quantity) || 0));
      const newModifiers = patch.modifiers === undefined ? existing.modifiers : patch.modifiers;
      const newKey = lineKey(existing.menuItemId, newModifiers);

      const without = prev.filter((l) => l.key !== key);

      if (newQty <= 0) return without;

      // Merge if another line already exists with newKey
      const idx = without.findIndex((l) => l.key === newKey);
      if (idx >= 0) {
        const merged = [...without];
        merged[idx] = { ...merged[idx], quantity: Math.min(99, merged[idx].quantity + newQty) };
        return merged;
      }

      return [
        ...without,
        {
          ...existing,
          key: newKey,
          quantity: newQty,
          modifiers: newModifiers,
        },
      ];
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  return { lines, total, add, setQty, editLine, clear };
}
