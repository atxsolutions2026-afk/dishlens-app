export type UiDish = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  videoUrl?: string;
  isVeg?: boolean;
  spice?: string;
  allergens?: string[];
  description?: string;
  categoryName?: string;
};

export type UiCategory = {
  id: string;
  name: string;
  sortOrder?: number;
  items: UiDish[];
};

export function normalizePublicMenu(payload: any): { restaurantName?: string; categories: UiCategory[] } {
  const restaurantName =
    payload?.restaurant?.name || payload?.restaurantName || payload?.name || payload?.restaurant?.title;

  const rawCategories =
    payload?.categories || payload?.menu?.categories || payload?.menuCategories || payload?.data?.categories || [];

  const categories: UiCategory[] = (Array.isArray(rawCategories) ? rawCategories : []).map((c: any) => {
    const itemsRaw = c?.items || c?.menuItems || c?.dishes || c?.children || [];
    const items: UiDish[] = (Array.isArray(itemsRaw) ? itemsRaw : []).map((i: any) => ({
      id: String(i?.id ?? i?.itemId ?? i?.menuItemId ?? i?.uuid ?? ""),
      name: String(i?.name ?? i?.title ?? "Unnamed item"),
      price: Number(i?.price ?? (typeof i?.priceCents === "number" ? i.priceCents / 100 : 0)),
      imageUrl: i?.imageUrl || i?.imageURL || i?.image?.url,
      videoUrl: i?.videoUrl || i?.videoURL || i?.video?.url,
      isVeg: i?.isVeg ?? i?.veg ?? i?.isVegetarian,
      spice: i?.spiceLevel ?? i?.spice ?? "NONE",
      allergens: Array.isArray(i?.allergens) ? i.allergens : (i?.allergens ? Object.keys(i.allergens) : []),
      description: i?.description || i?.details,
      categoryName: String(c?.name ?? c?.title ?? "")
    }));

    return {
      id: String(c?.id ?? c?.categoryId ?? c?.uuid ?? ""),
      name: String(c?.name ?? c?.title ?? "Category"),
      sortOrder: c?.sortOrder ?? c?.order,
      items
    };
  });

  return { restaurantName, categories };
}
