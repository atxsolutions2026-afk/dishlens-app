"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { clearToken, getUser } from "@/lib/auth";

// NOTE:
// This shell is now **Restaurant Module only** (dashboard / uploads / QR).
// Customer QR menu is a separate module under /m/* and does NOT use AppShell.

const tabs = [
  { href: "/r/dashboard", label: "Dashboard" },
  { href: "/r/uploads", label: "Uploads" },
  { href: "/r/branding", label: "Branding" },
  { href: "/r/qr", label: "QR Codes" }
];

export default function AppShell({
  children,
  activeHref
}: {
  children: React.ReactNode;
  activeHref?: string;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    setUserEmail(u?.email ?? null);
  }, []);

  function logout() {
    clearToken();
    window.location.href = "/r/login";
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-zinc-900 text-white grid place-items-center font-semibold shadow-soft">
              DL
            </div>
            <div>
              <div className="font-semibold leading-tight">DishLens</div>
              <div className="text-xs text-zinc-500">Responsive Web + PWA</div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  "rounded-xl px-3 py-1.5 text-xs font-medium border transition",
                  activeHref === t.href
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-xs">
            {userEmail ? (
              <>
                <span className="rounded-xl border bg-white px-3 py-1.5 text-zinc-700">
                  {userEmail}
                </span>
                <button
                  onClick={logout}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 hover:border-zinc-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/r/login"
                className="rounded-xl bg-zinc-900 px-3 py-1.5 font-semibold text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 text-xs text-zinc-500">
        © {new Date().getFullYear()} DishLens
      </footer>
    </div>
  );
}
