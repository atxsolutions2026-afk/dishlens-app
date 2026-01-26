"use client";

import { useState } from "react";
import { setToken } from "@/lib/auth";
import { staffLogin } from "@/lib/endpoints";

export default function WaiterLogin({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-sm p-4">
      <div className="text-2xl font-black text-zinc-900">Staff Login</div>
      <div className="mt-1 text-sm text-zinc-600">Waiter / staff access (table orders)</div>

      {err ? <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}

      <div className="mt-4 grid gap-2">
        <label className="text-xs font-bold text-zinc-700">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="waiter@restaurant.com"
        />
      </div>

      <div className="mt-3 grid gap-2">
        <label className="text-xs font-bold text-zinc-700">Password</label>
        <input
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="••••••••"
        />
      </div>

      <button
        type="button"
        disabled={loading}
        className="mt-4 w-full rounded-2xl bg-zinc-900 text-white py-3 text-sm font-extrabold disabled:opacity-60"
        onClick={async () => {
          setErr(null);
          setLoading(true);
          try {
            const res = await staffLogin(email.trim(), password);
            const token = res?.accessToken || res?.token;
            if (!token) throw new Error("No token returned");
            setToken(String(token));
            onLoggedIn?.();
          } catch (e: any) {
            setErr(e?.message ?? "Login failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </div>
  );
}
