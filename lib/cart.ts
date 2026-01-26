export type SpiceLevel = "NONE" | "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";

export const SPICE_LEVELS: { value: SpiceLevel; label: string }[] = [
  { value: "NONE", label: "No spice" },
  { value: "MILD", label: "Mild" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HOT", label: "Hot" },
  { value: "EXTRA_HOT", label: "Extra Hot" },
];

export type LineModifiers = {
  spiceLevel?: SpiceLevel;
  spiceOnSide?: boolean;
  allergensAvoid?: string[];
  specialInstructions?: string;
};

export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  price: number; // dollars
  imageUrl?: string | null;
  quantity: number;
  modifiers?: LineModifiers;
};

export function money(v: number | undefined) {
  const p = Number.isFinite(v) ? (v as number) : 0;
  return `$${p.toFixed(2)}`;
}

export function normalizeAllergens(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((x) => String(x || "").trim().toUpperCase()).filter(Boolean))];
}

export function normalizeText(s: unknown): string {
  return String(s ?? "").trim();
}

export function lineKey(menuItemId: string, modifiers?: LineModifiers): string {
  const spice = modifiers?.spiceLevel ?? "";
  const side = modifiers?.spiceOnSide ? "SIDE" : "";
  const allergens = normalizeAllergens(modifiers?.allergensAvoid).sort().join(",");
  const note = normalizeText(modifiers?.specialInstructions).toLowerCase();
  return [menuItemId, spice, side, allergens, note].join("|");
}

export const COMMON_ALLERGENS = [
  "GLUTEN",
  "DAIRY",
  "EGG",
  "PEANUTS",
  "TREE_NUTS",
  "SOY",
  "SESAME",
  "FISH",
  "SHELLFISH",
  "ONION",
  "GARLIC",
  "CILANTRO",
];
