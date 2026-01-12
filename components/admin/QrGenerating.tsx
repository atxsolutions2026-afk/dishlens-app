"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { listRestaurants } from "@/lib/endpoints";
import { getToken } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";

type RestaurantLite = {
  id?: string;
  name?: string;
  slug?: string;
};

function firstRestaurant(payload: any): RestaurantLite | null {
  const arr = Array.isArray(payload)
    ? payload
    : payload?.items || payload?.data || payload?.restaurants || [];
  const r = Array.isArray(arr) ? arr[0] : null;
  if (!r) return null;
  return { id: r.id, name: r.name, slug: r.slug };
}

export default function QrGenerating() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState<string>("Restaurant");
  const [slug, setSlug] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        window.location.href = "/r/login";
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const list = await listRestaurants();
        const r = firstRestaurant(list);
        setRestaurantName(r?.name || "Restaurant");
        setSlug(r?.slug || "house-of-chettinad");
      } catch (e: any) {
        // still allow manual entry
        setErr(e?.message ?? "Couldn't load restaurants. Enter slug manually.");
        setSlug("house-of-chettinad");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const customerUrl = useMemo(() => {
    if (!slug) return "";
    // In production you will host customer module on a different domain.
    // For now, keep a path-based URL.
    return typeof window === "undefined" ? "" : `${window.location.origin}/m/${encodeURIComponent(slug)}`;
  }, [slug]);

  useEffect(() => {
    setUrl(customerUrl);
  }, [customerUrl]);

  const qrImgUrl = useMemo(() => {
    if (!url) return "";
    // Lightweight QR generation via public endpoint (no extra npm deps)
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(
      url
    )}`;
  }, [url]);

  function copy() {
    if (!url) return;
    navigator.clipboard?.writeText(url);
  }

  async function download() {
    if (!qrImgUrl) return;
    try {
      setBusy(true);
      const res = await fetch(qrImgUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug || "dishlens"}-qr.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="text-3xl font-black tracking-tight">QR Codes</div>
        <div className="mt-1 text-sm text-zinc-600">
          Print this QR and place it on the table. Customers scan → menu opens (no login).
        </div>
      </div>

      {err && (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">{err}</Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">Target Link</div>
            <Badge>Customer Module</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500">Restaurant name</label>
              <div className="mt-1 rounded-2xl border bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800">
                {restaurantName}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500">Restaurant slug (used in URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="house-of-chettinad"
                className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <div className="mt-1 text-[11px] text-zinc-500">
                This should match your API public menu slug.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-semibold text-zinc-500">QR destination URL</label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copy} disabled={!url}>
                  Copy
                </Button>
                <Button
                  disabled={!url}
                  onClick={() => {
                    window.open(url, "_blank");
                  }}
                >
                  Open
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
            Tip: you can host customer menu on a separate URL (e.g. customer.dishlens.ai) and keep restaurant dashboard on app.dishlens.ai.
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="text-sm font-bold">QR Preview</div>

          <div className="mt-4 grid place-items-center rounded-3xl border bg-white p-5">
            {qrImgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrImgUrl} alt="QR code" className="h-[220px] w-[220px]" />
            ) : (
              <div className="text-sm text-zinc-500">No QR generated</div>
            )}
          </div>

          <div className="mt-4 grid gap-2">
            <Button variant="secondary" onClick={download} disabled={!qrImgUrl || busy}>
              Download PNG
            </Button>
            <div className="text-xs text-zinc-500 break-all">{url}</div>
          </div>
        </Panel>
      </div>
    </Container>
  );
}
