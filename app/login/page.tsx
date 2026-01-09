"use client";
import AppShell from "@/components/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { login } from "@/lib/endpoints";
import { setToken, setUser } from "@/lib/auth";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@atxsolutions.local");
  const [password, setPassword] = useState("Admin12345!");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true); setErr(null);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      setUser(res.user);
      window.location.href = "/admin";
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Card className="p-6">
          <h1 className="text-xl font-black">Admin Login</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Uses <code className="px-1 py-0.5 bg-zinc-50 border rounded">POST /auth/login</code> and stores JWT in localStorage.
          </p>
          <div className="mt-5 grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-zinc-600">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-zinc-600">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            {err && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}
            <Button className="w-full" onClick={onSubmit} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
