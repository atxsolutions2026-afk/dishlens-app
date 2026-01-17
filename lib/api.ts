import { apiBaseUrl } from "@/lib/env";
import { clearToken, getToken, setToken } from "@/lib/auth";

export type ApiError = { status: number; message: string; body?: unknown };

// Compatibility exports used by lib/endpoints.ts (and any other callers).
// Token storage is centralized in lib/auth.ts.
export function setAccessToken(token: string) {
  setToken(token);
}

export function clearAccessToken() {
  clearToken();
}

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? getToken() : null;

  const headers = new Headers(init?.headers || {});
  headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  let body: any = init?.body;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isForm && body && typeof body === "object" && !(body instanceof Blob)) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    body,
    credentials: "include"
  });

  const data = await parseBody(res);
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in (data as any) && String((data as any).message)) ||
      res.statusText || "Request failed";
    throw { status: res.status, message: msg, body: data } as ApiError;
  }
  return data as T;
}
