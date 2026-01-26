export type TrackedOrder = { orderId: string; orderToken: string | null };

function key(slug: string, tableSessionId: string) {
  return `dishlens_last_order:${slug}:${tableSessionId}`;
}

export function saveLastOrder(slug: string, tableSessionId: string, tracked: TrackedOrder) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(slug, tableSessionId), JSON.stringify(tracked));
  } catch {}
}

export function loadLastOrder(slug: string, tableSessionId: string): TrackedOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(slug, tableSessionId));
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j?.orderId) return null;
    return { orderId: String(j.orderId), orderToken: j.orderToken ? String(j.orderToken) : null };
  } catch {
    return null;
  }
}
