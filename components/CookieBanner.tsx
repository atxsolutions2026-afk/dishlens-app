"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dishlens_cookie_consent";

type ConsentValue = "essential" | "all";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) setShow(true);
    } catch {
      // If storage is blocked, do not nag the user.
      setShow(false);
    }
  }, []);

  function setConsent(v: ConsentValue) {
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              <div className="font-semibold text-zinc-900">Cookies & Privacy</div>
              <p className="mt-1">
                We use essential cookies to make DishLens work. With your permission, we may also use
                analytics cookies to improve the experience. Read our{" "}
                <Link href="/legal/privacy" className="text-brand underline underline-offset-2">
                  Privacy Policy
                </Link>
                {" "}and{" "}
                <Link href="/legal/cookies" className="text-brand underline underline-offset-2">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => setConsent("essential")}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-300"
              >
                Essential only
              </button>
              <button
                onClick={() => setConsent("all")}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
