"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { useEffect, useState } from "react";
import { listRestaurants, uploadRestaurantHero, uploadRestaurantLogo } from "@/lib/endpoints";
import { getToken } from "@/lib/auth";

type Kind = "LOGO" | "HERO";

export default function RestaurantBrandingApi() {
  const [restaurantId, setRestaurantId] = useState("");
  const [kind, setKind] = useState<Kind>("LOGO");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const rs = await listRestaurants();
        const arr = Array.isArray(rs) ? rs : rs?.restaurants ?? rs?.data ?? [];
        setRestaurants(arr);
        if (!restaurantId && arr?.length === 1) setRestaurantId(arr[0].id);
      } catch {
        // Non-blocking; manual ID entry still works
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doUpload() {
    if (!getToken()) {
      window.location.href = "/r/login";
      return;
    }

    setBusy(true);
    setMsg(null);
    setErr(null);

    try {
      if (!restaurantId) throw new Error("Restaurant ID is required");
      if (!file) throw new Error("File is required");

      const res =
        kind === "LOGO"
          ? await uploadRestaurantLogo(restaurantId, file)
          : await uploadRestaurantHero(restaurantId, file);

      console.log("Upload response:", res);
      setMsg("Uploaded successfully.");
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function onPick(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/r/dashboard"
            className="rounded-2xl border border-zinc-200 bg-white p-2"
            aria-label="Back"
          >
            <BackIcon className="h-5 w-5 text-zinc-800" />
          </Link>
          <div>
            <div className="text-2xl font-black">Restaurant Branding</div>
            <div className="text-sm text-zinc-600">
              Upload logo and hero images for a restaurant
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">Branding Upload</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKind("LOGO")}
                className={
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
                  (kind === "LOGO"
                    ? "bg-brand text-white border-brand"
                    : "bg-white border-zinc-200")
                }
              >
                Logo
              </button>
              <button
                onClick={() => setKind("HERO")}
                className={
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
                  (kind === "HERO"
                    ? "bg-brand text-white border-brand"
                    : "bg-white border-zinc-200")
                }
              >
                Hero
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <label className="text-[11px] font-semibold text-zinc-500">
                Restaurant
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">Select a restaurant…</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}{r.city ? ` — ${r.city}` : ""}
                  </option>
                ))}
              </select>
              <details className="text-[11px] text-zinc-500">
                <summary className="cursor-pointer">Advanced: enter Restaurant ID manually</summary>
                <input
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  placeholder="70330d6d-932b-48ae-8a13-e7212273ad69"
                  className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </details>
            </div>

            <div className="text-[11px] text-zinc-500">
              Uses{" "}
              <code className="px-1 bg-zinc-50 border rounded">
                POST /restaurants/:id/{kind === "LOGO" ? "logo" : "hero"}
              </code>{" "}
              (multipart field: <b>file</b>)
            </div>
          </div>

          <div className="mt-4 rounded-3xl border bg-zinc-50 p-3">
            {!preview ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="text-sm font-semibold text-zinc-700">
                  Select an image to preview
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Uploads using multipart/form-data field name <b>file</b>
                </div>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => document.getElementById("brandingFile")?.click()}
                >
                  Choose image
                </Button>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="h-[280px] w-full rounded-2xl object-cover"
              />
            )}
          </div>

          <input
            id="brandingFile"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-zinc-600">
              {file ? (
                <>
                  <Badge>{kind}</Badge>{" "}
                  <span className="ml-2 font-semibold">{file.name}</span>
                </>
              ) : (
                "No file selected"
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => document.getElementById("brandingFile")?.click()}
                disabled={busy}
              >
                Change
              </Button>
              <Button onClick={doUpload} disabled={!file || busy}>
                {busy ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {msg}
            </div>
          )}
          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="text-sm font-bold">Tips</div>
          <div className="mt-2 text-sm text-zinc-600 space-y-2">
            <p>
              <b>Logo</b>: square image works best (e.g., 512×512).
            </p>
            <p>
              <b>Hero</b>: wide image works best (e.g., 1600×900).
            </p>
            <p className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
              This page only adds branding upload capability. It does not change customer UI.
            </p>
          </div>
        </Panel>
      </div>
    </Container>
  );
}
