export function tableKey(slug: string) {
  return `dl_table_${slug}`;
}

export function normalizeTable(v: string | null | undefined): string | null {
  const s = (v || '').trim();
  if (!s) return null;
  // keep it short/safe
  return s.slice(0, 40);
}

export function getOrCreateTable(slug: string, fromQuery?: string | null): string {
  const q = normalizeTable(fromQuery);
  if (q) {
    try { localStorage.setItem(tableKey(slug), q); } catch {}
    return q;
  }

  try {
    const existing = localStorage.getItem(tableKey(slug));
    const n = normalizeTable(existing);
    if (n) return n;
  } catch {}

  const generated = `T-${Math.floor(100 + Math.random() * 900)}`;
  try { localStorage.setItem(tableKey(slug), generated); } catch {}
  return generated;
}
