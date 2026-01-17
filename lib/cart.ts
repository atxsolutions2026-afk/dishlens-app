export type CartLine = {
  menuItemId: string;
  name: string;
  price: number; // dollars
  imageUrl?: string | null;
  quantity: number;
};

export type CartState = {
  slug: string;
  tableNumber: string;
  lines: CartLine[];
};

export function money(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  return `$${n.toFixed(2)}`;
}

export function cartKey(slug: string, tableNumber: string) {
  return `dl_cart_${slug}_${tableNumber}`;
}

export function safeReadCart(slug: string, tableNumber: string): CartState {
  try {
    const raw = localStorage.getItem(cartKey(slug, tableNumber));
    if (!raw) return { slug, tableNumber, lines: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lines))
      return { slug, tableNumber, lines: [] };
    return {
      slug,
      tableNumber,
      lines: parsed.lines
        .filter((l: any) => l && typeof l.menuItemId === "string")
        .map((l: any) => ({
          menuItemId: String(l.menuItemId),
          name: String(l.name ?? ""),
          price: Number(l.price ?? 0),
          imageUrl: l.imageUrl ?? null,
          quantity: Math.max(1, Number(l.quantity ?? 1)),
        })),
    };
  } catch {
    return { slug, tableNumber, lines: [] };
  }
}

export function writeCart(state: CartState) {
  localStorage.setItem(
    cartKey(state.slug, state.tableNumber),
    JSON.stringify(state),
  );
}

export function calcTotal(lines: CartLine[]) {
  return lines.reduce(
    (sum, l) => sum + (Number(l.price) || 0) * (Number(l.quantity) || 0),
    0,
  );
}
