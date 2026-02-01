"use client";

import { useState, useEffect } from "react";
import { apiBaseUrl } from "@/lib/env";

const DISMISS_KEY = "dishlens_api_banner_dismissed";

/**
 * Shows a warning when the app is served from a public host (e.g. Vercel)
 * but the API base URL is localhost or HTTP (mixed content). This commonly
 * causes "load failed" on mobile or other devices that can't reach localhost.
 */
export default function ApiConnectivityBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;

      const origin = window.location.origin;
      const apiBase = apiBaseUrl();
      const isPublicHost =
        !origin.includes("localhost") && !origin.startsWith("http://127.0.0.1");
      const apiIsLocalhost =
        apiBase.includes("localhost") || apiBase.includes("127.0.0.1");
      const pageIsHttps = origin.startsWith("https://");
      const apiIsHttp = apiBase.startsWith("http://");
      const mixedContent = pageIsHttps && apiIsHttp;

      if (isPublicHost && (apiIsLocalhost || mixedContent)) {
        setShow(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg sm:left-auto sm:right-4 sm:max-w-md"
    >
      <p className="font-semibold">API may be unreachable on this device</p>
      <p className="mt-1 text-amber-800">
        This app is loading from a public URL but the API is set to localhost or
        HTTP. On mobile or other networks, that causes &quot;load failed&quot; after
        login. In Vercel, set{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_API_BASE_URL</code>{" "}
        to your <strong>public HTTPS</strong> API URL and redeploy.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-3 rounded-lg bg-amber-200 px-3 py-1.5 text-sm font-medium hover:bg-amber-300"
      >
        Dismiss
      </button>
    </div>
  );
}
