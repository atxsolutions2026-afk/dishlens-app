"use client";

// Simple per-device favorites (MVP).
// Stored in localStorage so customers can "love" dishes with one tap.

const KEY_PREFIX = "dishlens:favs:";

function keyFor(slug: string) {
  return `${KEY_PREFIX}${slug}`;
}

export function getFavorites(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export function setFavorites(slug: string, favs: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(Array.from(favs)));
  } catch {
    // ignore
  }
}

export function toggleFavorite(slug: string, dishId: string): Set<string> {
  const next = getFavorites(slug);
  if (next.has(dishId)) next.delete(dishId);
  else next.add(dishId);
  setFavorites(slug, next);
  return next;
}
