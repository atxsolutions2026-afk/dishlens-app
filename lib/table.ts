import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import type { TableSession } from "@/lib/types";

const API_BASE = apiBaseUrl();

const PERSIST_KEY = (slug: string) => `dishlens_table_session:${slug}`;
const ORDER_TRACKING_KEY = (slug: string) => `dishlens_order_tracking:${slug}`;

function getDeviceId(): string {
  if (typeof window === "undefined") return "dev";
  const k = "dishlens_device_id";
  try {
    const existing = window.localStorage.getItem(k);
    if (existing) return existing;
    const id = `dev_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    window.localStorage.setItem(k, id);
    return id;
  } catch {
    return "dev";
  }
}

export function loadPersistedSession(slug: string): TableSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY(slug));
    if (!raw) return null;
    const p = JSON.parse(raw) as {
      tableSessionId?: string;
      tableNumber?: string;
      sessionSecret?: string;
      expiresAt?: string;
    };
    if (!p?.tableSessionId || !p?.tableNumber) return null;
      return {
        tableSessionId: String(p.tableSessionId),
        tableNumber: String(p.tableNumber),
        sessionSecret: p.sessionSecret ?? null,
        expiresAt: p.expiresAt ?? null,
      };
  } catch {
    return null;
  }
}

export function persistSession(slug: string, s: TableSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PERSIST_KEY(slug),
      JSON.stringify({
        tableSessionId: s.tableSessionId,
        tableNumber: s.tableNumber,
        sessionSecret: s.sessionSecret ?? null,
        expiresAt: (s as any).expiresAt ?? null,
      }),
    );
  } catch {}
}

/**
 * Resolve access token to table session (new secure QR flow).
 * POST .../table-sessions/resolve with accessToken + deviceId.
 */
export async function resolveAccessToken(
  slug: string,
  accessToken: string,
): Promise<TableSession> {
  const deviceId = getDeviceId();
  const res = await apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/table-sessions/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ accessToken: accessToken.trim(), deviceId }),
    },
  );
  const out: TableSession = {
    tableSessionId: String(res?.tableSessionId ?? res?.id ?? ""),
    tableNumber: String(res?.tableNumber ?? "—"),
    sessionSecret: res?.sessionSecret ?? null,
    expiresAt: res?.expiresAt ?? null,
  };
  return out;
}

/**
 * QR flow: POST .../table-sessions/start with qrToken + deviceId.
 * LEGACY: Kept for backward compatibility. New QR flow should use resolveAccessToken.
 */
export async function getOrStartTableSession(
  slug: string,
  qrToken?: string | null,
): Promise<TableSession> {
  const deviceId = getDeviceId();
  const res = await apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/table-sessions/start`,
    {
      method: "POST",
      body: JSON.stringify({ qrToken: qrToken ?? "", deviceId }),
    },
  );
  const out: TableSession = {
    tableSessionId: String(res?.tableSessionId ?? res?.id ?? ""),
    tableNumber: String(res?.tableNumber ?? "—"),
    sessionSecret: res?.sessionSecret ?? null,
    expiresAt: res?.expiresAt ?? null,
  };
  return out;
}

/**
 * Guest flow (no QR): POST .../table-sessions/guest with tableNumber + deviceId.
 */
export async function startGuestTableSession(
  slug: string,
  tableNumber: string,
): Promise<TableSession> {
  const deviceId = getDeviceId();
  const tn = String(tableNumber || "1").trim().slice(0, 40) || "1";
  const res = await apiFetch<any>(
    `${API_BASE}/public/restaurants/${encodeURIComponent(slug)}/table-sessions/guest`,
    {
      method: "POST",
      body: JSON.stringify({ tableNumber: tn, deviceId }),
    },
  );
  const out: TableSession = {
    tableSessionId: String(res?.tableSessionId ?? res?.id ?? ""),
    tableNumber: String(res?.tableNumber ?? tn),
    sessionSecret: res?.sessionSecret ?? null,
    expiresAt: res?.expiresAt ?? null,
  };
  return out;
}

export function getDeviceIdForOrders(): string {
  return getDeviceId();
}

/**
 * Persist order tracking info (orderId + orderToken) for a restaurant
 */
export function persistOrderTracking(slug: string, orderId: string, orderToken: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ORDER_TRACKING_KEY(slug),
      JSON.stringify({ orderId, orderToken }),
    );
  } catch {}
}

/**
 * Load persisted order tracking info
 */
export function loadOrderTracking(slug: string): { orderId: string; orderToken: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORDER_TRACKING_KEY(slug));
    if (!raw) return null;
    const p = JSON.parse(raw) as { orderId?: string; orderToken?: string };
    if (!p?.orderId || !p?.orderToken) return null;
    return { orderId: p.orderId, orderToken: p.orderToken };
  } catch {
    return null;
  }
}

/**
 * Clear persisted order tracking info
 */
export function clearOrderTracking(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORDER_TRACKING_KEY(slug));
  } catch {}
}

export type ResolveTableSessionParams = { get: (k: string) => string | null };

/**
 * Resolve table session: ?t= (QR access token or legacy token), ?table= (guest), or persisted/default.
 * Persist result. Use tableSessionId + sessionSecret for cart + createPublicOrder.
 * 
 * New secure flow: If ?t= looks like an access token (16+ chars, no dots), use /resolve endpoint.
 * Legacy flow: If ?t= contains dots (signed token), use /start endpoint.
 */
export async function resolveTableSession(
  slug: string,
  params: ResolveTableSessionParams,
): Promise<TableSession | null> {
  const t = params.get("t");
  const table = params.get("table");

  try {
    if (t && String(t).trim().length >= 8) {
      const token = t.trim();
      // New secure flow: access token (16+ chars, no dots) -> /resolve
      if (token.length >= 16 && !token.includes(".")) {
        try {
          const session = await resolveAccessToken(slug, token);
          persistSession(slug, session);
          return session;
        } catch (e: any) {
          // If access token fails (expired/revoked), show error
          if (e?.message?.includes("expired") || e?.message?.includes("revoked")) {
            throw new Error("QR code expired. Please rescan the QR code at your table.");
          }
          throw e;
        }
      }
      // Legacy flow: signed token (contains dots) -> /start
      const session = await getOrStartTableSession(slug, token);
      persistSession(slug, session);
      return session;
    }
    if (table && String(table).trim()) {
      const session = await startGuestTableSession(slug, table.trim());
      persistSession(slug, session);
      return session;
    }

    const persisted = loadPersistedSession(slug);
    if (persisted?.tableSessionId) {
      // Check if session expired
      if (persisted.expiresAt) {
        const expires = new Date(persisted.expiresAt);
        if (expires.getTime() <= Date.now()) {
          // Session expired, clear and create new guest session
          window.localStorage.removeItem(PERSIST_KEY(slug));
          const guest = await startGuestTableSession(slug, persisted.tableNumber || "1");
          persistSession(slug, guest);
          return guest;
        }
      }
      return persisted;
    }

    const guest = await startGuestTableSession(slug, "1");
    persistSession(slug, guest);
    return guest;
  } catch (e: any) {
    console.error("Failed to resolve table session:", e);
    // Return null to trigger error UI
    return null;
  }
}
