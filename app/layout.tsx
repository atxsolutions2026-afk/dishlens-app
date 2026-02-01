import "./globals.css";
import type { Metadata } from "next";
import CookieBanner from "@/components/CookieBanner";
import ApiConnectivityBanner from "@/components/ApiConnectivityBanner";

export const metadata: Metadata = {
  title: "DishLens",
  description: "DishLens responsive web UI (PWA)",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon/favicon.ico" },
      { url: "/icon/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#A01020",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900">
        {/* Accessibility: Skip link must be inside <body> */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded bg-white px-3 py-2 text-sm text-zinc-900 shadow focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Skip to main content
        </a>

        {/* Main content target */}
        <main id="main-content" className="min-h-screen">
          {children}
        </main>

        <CookieBanner />
        <ApiConnectivityBanner />
      </body>
    </html>
  );
}
