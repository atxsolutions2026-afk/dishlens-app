"use client";

import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { clearToken, getUser } from "@/lib/auth";

const platformTabs = [
  { href: "/platform/dashboard", label: "Dashboard" },
  { href: "/platform/restaurants", label: "Restaurants" },
  { href: "/platform/plans", label: "Plans" },
  { href: "/platform/audit-logs", label: "Audit Logs" },
];

export default function PlatformShell({
  children,
  activeHref
}: {
  children: React.ReactNode;
  activeHref?: string;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
  }, []);

  function logout() {
    clearToken();
    window.location.href = "/platform/login";
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icon/icon-192.png"
              alt="DishLens Platform"
              width={40}
              height={40}
              className="rounded-2xl shadow-soft"
            />
            <div>
              <div className="font-bold text-zinc-900">DishLens Platform</div>
              <div className="text-xs text-zinc-500">ATX IT Solutions</div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {platformTabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  "rounded-xl px-4 py-2 text-xs font-semibold transition",
                  activeHref === t.href
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <>
                <span className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-700">
                  {user.email}
                </span>
                <span className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-600 font-medium">
                  {user.roles?.[0] || 'Platform'}
                </span>
                <button
                  onClick={logout}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 font-semibold text-zinc-700 hover:border-zinc-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/platform/login"
                className="rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">{children}</main>
    </div>
  );
}
