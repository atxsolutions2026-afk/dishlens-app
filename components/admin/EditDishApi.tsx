"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { useState } from "react";
import { uploadMenuItemImage, uploadMenuItemVideo } from "@/lib/endpoints";
import { getToken } from "@/lib/auth";

type Kind = "IMAGE" | "VIDEO";

export default function EditDishApi() {
  const [menuItemId, setMenuItemId] = useState("");
  const [kind, setKind] = useState<Kind>("IMAGE");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function doUpload() {
    if (!getToken()) {
      window.location.href = "/r/login";
      return;
    }

    setBusy(true);
    setMsg(null);
    setErr(null);

    try {
      if (!menuItemId) throw new Error("Menu Item ID is required");
      if (!file) throw new Error("File is required");

      const res =
        kind === "IMAGE"
          ? await uploadMenuItemImage(menuItemId, file)
          : await uploadMenuItemVideo(menuItemId, file);

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
            <div className="text-2xl font-black">Upload Dish Media</div>
            <div className="text-sm text-zinc-600">
              Upload image/video for a menu item
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">Media Upload</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKind("VIDEO")}
                className={
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
                  (kind === "VIDEO"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white border-zinc-200")
                }
              >
                Video
              </button>
              <button
                onClick={() => setKind("IMAGE")}
                className={
                  "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
                  (kind === "IMAGE"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white border-zinc-200")
                }
              >
                Photo
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <label className="text-[11px] font-semibold text-zinc-500">
              Menu Item ID (required)
            </label>
            <input
              value={menuItemId}
              onChange={(e) => setMenuItemId(e.target.value)}
              placeholder="fdf5b60a-bdaa-4151-ae61-4a86f55a33ba"
              className="rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <div className="text-[11px] text-zinc-500">
              Uses{" "}
              <code className="px-1 bg-zinc-50 border rounded">
                POST /menu-items/:id/{kind === "IMAGE" ? "image" : "video"}
              </code>{" "}
              (multipart field: <b>file</b>)
            </div>
          </div>

          <div className="mt-4 rounded-3xl border bg-zinc-50 p-3">
            {!preview ? (
              <div className="grid place-items-center py-12 text-center">
                <div className="text-sm font-semibold text-zinc-700">
                  Select a {kind.toLowerCase()} to preview
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Uploads using multipart/form-data field name <b>file</b>
                </div>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  Choose file
                </Button>
              </div>
            ) : kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="h-[280px] w-full rounded-2xl object-cover"
              />
            ) : (
              <video
                src={preview}
                controls
                className="h-[280px] w-full rounded-2xl object-cover"
              />
            )}
          </div>

          <input
            id="fileInput"
            type="file"
            accept={kind === "IMAGE" ? "image/*" : "video/*"}
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
                onClick={() => document.getElementById("fileInput")?.click()}
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
          <div className="text-sm font-bold">Edit Dish Fields</div>
          <div className="mt-1 text-sm text-zinc-600">
            Next step wiring:{" "}
            <code className="px-1 bg-zinc-50 border rounded">
              PATCH /restaurants/:restaurantId/menu/items/:itemId
            </code>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              placeholder="Dish name"
              className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <input
              placeholder="Price"
              className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <textarea
              placeholder="Description"
              className="min-h-[120px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-600">
              These fields are UI-only right now. Once you confirm the PATCH payload shape, I’ll wire it.
            </div>
          </div>
        </Panel>
      </div>
    </Container>
  );
}
