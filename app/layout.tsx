import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DishLens",
  description: "DishLens responsive web UI (PWA)",
  manifest: "/manifest.json",
  themeColor: "#111827"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
