// lib/auth.ts

const TOKEN_KEY = "dishlens_staff_token";
const USER_KEY = "dishlens_staff_user";

/* ===============================
   TOKEN
================================ */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/* ===============================
   USER
================================ */

export function setUser(user: any) {
  if (typeof window === "undefined") return;

  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}

/* ===============================
   LOGOUT HELPER (recommended)
================================ */

export function logout() {
  clearToken();
  clearUser();
}
