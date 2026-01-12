"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { login } from "@/lib/endpoints";
import { setToken, setUser } from "@/lib/auth";
import { useState } from "react";

export default function RestaurantLoginPage() {
  const [email, setEmail] = useState("admin@atxsolutions.local");
  const [password, setPassword] = useState("Admin12345!");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      setUser(res.user);
      window.location.href = "/r/dashboard";
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-zinc-900 text-white grid place-items-center font-semibold shadow-soft">
              DL
            </div>
            <div>
              <h1 className="text-xl font-black">Restaurant Login</h1>
              <p className="text-xs text-zinc-500">DishLens dashboard</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-zinc-600">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-zinc-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {err}
              </div>
            )}
            <Button className="w-full" onClick={onSubmit} disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
