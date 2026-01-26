export type UiDish = {
  id: string;
  name: string;
  /** Optional convenience label used by some UIs */
  categoryName?: string;
  description?: string | null;
  price: number; // dollars
  currency: string;
  isVeg?: boolean | null;
  spice?: string | null;
  allergens?: string[] | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  avgRating?: number | null;
  ratingCount?: number | null;
};

export type UiCategory = {
  id: string;
  name: string;
  items: UiDish[];
};

function dollarsFromCents(cents: any): number {
  const n = Number(cents);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n) / 100;
}

export function normalizePublicMenu(payload: any): { restaurant: any; categories: UiCategory[] } {
  const restaurant = payload?.restaurant ?? null;
  const categories = Array.isArray(payload?.categories) ? payload.categories : [];
  return {
    restaurant,
    categories: categories.map((c: any) => ({
      id: String(c.id),
      name: String(c.name || ""),
      items: (Array.isArray(c.items) ? c.items : []).map((it: any) => ({
        id: String(it.id),
        name: String(it.name || ""),
        categoryName: String(c.name || ""),
        description: it.description ?? null,
        price: dollarsFromCents(it.priceCents),
        currency: String(it.currency || "USD"),
        isVeg: typeof it.isVeg === "boolean" ? it.isVeg : null,
        spice: it.spiceLevel ?? null,
        allergens: Array.isArray(it.allergens) ? it.allergens : null,
        imageUrl: it.imageUrl ?? null,
        videoUrl: it.videoUrl ?? null,
        avgRating: typeof it.avgRating === "number" ? it.avgRating : null,
        ratingCount: typeof it.ratingCount === "number" ? it.ratingCount : null,
      })),
    })),
  };
}
