"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { platformLogin } from "@/lib/api/platform";
import { setToken, setUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";

export default function PlatformLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await platformLogin(email, password);
      
      // Check if user has platform role
      const hasPlatformRole = res.user.roles.some((role) => 
        ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPPORT_AGENT', 'SALES', 'ONBOARDING', 'ATX_ADMIN'].includes(role)
      );
      
      if (!hasPlatformRole) {
        setErr("Access denied. Platform access required.");
        return;
      }
      
      setToken(res.accessToken);
      setUser(res.user);
      const next = searchParams?.get("next") || "/platform/dashboard";
      router.push(next);
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/icon/icon-192.png"
              alt="DishLens Platform"
              width={48}
              height={48}
              className="rounded-2xl shadow-soft"
            />
            <div>
              <h1 className="text-2xl font-black text-zinc-900">Platform Login</h1>
              <p className="text-xs text-zinc-500">ATX IT Solutions</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@atxsolutions.com"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
            </div>
            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {err}
              </div>
            )}
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5" 
              onClick={onSubmit} 
              disabled={busy || !email || !password}
            >
              {busy ? "Signing in..." : "Sign in to Platform"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
