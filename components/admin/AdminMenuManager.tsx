"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import * as endpoints from "@/lib/endpoints";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/apiFetch";
import { apiBaseUrl } from "@/lib/env";
import { normalizePublicMenu, UiCategory, UiDish } from "@/lib/menuAdapter";

type CategoryRow = UiCategory & { isActive?: boolean };

function centsFromDollars(v: string): number {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function dollarsFromCents(c: number): string {
  const n = Number.isFinite(c) ? c : 0;
  return (n / 100).toFixed(2);
}

export default function AdminMenuManager() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Category edit
  const [editCategoryName, setEditCategoryName] = useState<string>("");
  const [editCategorySort, setEditCategorySort] = useState<string>("0");

  const [items, setItems] = useState<UiDish[]>([]);
  const [itemQuery, setItemQuery] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // Category form
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategorySort, setNewCategorySort] = useState<string>("0");

  // Item form (create/edit)
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formAllergens, setFormAllergens] = useState<string>("");
  const [formAllergenNotes, setFormAllergenNotes] = useState<string>("");
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formIsVeg, setFormIsVeg] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Media upload (image/video for selected item)
  const [mediaKind, setMediaKind] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMsg, setMediaMsg] = useState<string | null>(null);
  const [mediaErr, setMediaErr] = useState<string | null>(null);
  const [mediaDragOver, setMediaDragOver] = useState(false);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    const base = items
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (!q) return base;
    return base.filter(
      (i) =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q),
    );
  }, [items, itemQuery]);

  async function loadRestaurants() {
    const list = await endpoints.listRestaurants();
    const arr = Array.isArray(list) ? list : (list?.items ?? list?.data ?? []);
    setRestaurants(arr);
    if (!restaurantId && arr?.[0]?.id) setRestaurantId(arr[0].id);
  }

  async function loadMenu() {
    if (!restaurantId) return;
    setLoading(true);
    setErr(null);
    try {
      // Admin should be able to manage discontinued items, but customers should never see them.
      // The API supports includeInactive=1 for admin menu fetch.
      const raw = await apiFetch<any>(
        `${apiBaseUrl()}/restaurants/${restaurantId}/menu?includeInactive=1`,
      );
      const norm = normalizePublicMenu(raw);

      const cats: CategoryRow[] = (norm.categories ?? []).map((c: any) => ({
        ...c,
        isActive: c?.isActive ?? c?.is_active,
      }));
      setCategories(cats);

      // Flatten items while preserving categoryId + categoryName
      const allItems: UiDish[] = cats.flatMap((c) =>
        (c.items ?? []).map((it: any) => ({
          ...it,
          categoryName: c.name,
          categoryId: c.id,
        })),
      );
      setItems(allItems);

      if (!selectedCategoryId && cats[0]?.id) setSelectedCategoryId(cats[0].id);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        window.location.href = "/r/login";
        return;
      }
      try {
        await loadRestaurants();
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMenu().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    // Sync category edit form
    if (!selectedCategory) {
      setEditCategoryName("");
      setEditCategorySort("0");
      return;
    }
    setEditCategoryName(selectedCategory.name || "");
    setEditCategorySort(String((selectedCategory as any).sortOrder ?? 0));
  }, [selectedCategory]);

  // Reset media state when switching items
  useEffect(() => {
    setMediaFile(null);
    setMediaPreview("");
    setMediaMsg(null);
    setMediaErr(null);
  }, [selectedItemId]);

  useEffect(() => {
    // Sync form when selecting an item
    if (!selectedItem) {
      setFormCategoryId(selectedCategoryId || "");
      setFormName("");
      setFormPrice("");
      setFormDescription("");
      setFormAllergens("");
      setFormAllergenNotes("");
      setFormIsAvailable(true);
      setFormIsActive(true);
      setFormIsVeg(false);
      return;
    }

    // ✅ FIX: categoryId must come from selectedItem.categoryId
    setFormCategoryId(
      (selectedItem as any).categoryId || selectedCategoryId || "",
    );

    setFormName(selectedItem.name || "");

    // If your UiDish.price is already dollars number, keep it. If it's cents, adjust accordingly.
    // Your UI displays ${it.price?.toFixed(2)} so it appears to be dollars.
    setFormPrice(
      Number.isFinite(selectedItem.price as any)
        ? Number(selectedItem.price).toFixed(2)
        : "",
    );

    setFormDescription(selectedItem.description || "");
    setFormAllergens(((selectedItem as any).allergens || []).join(", "));

    // ✅ FIX: notes must come from allergenNotes (not allergens array)
    setFormAllergenNotes(String((selectedItem as any).allergenNotes ?? ""));

    setFormIsAvailable((selectedItem as any).isAvailable ?? true);
    setFormIsActive((selectedItem as any).isActive ?? true);
    setFormIsVeg(Boolean((selectedItem as any).isVeg));
  }, [selectedItem, selectedCategoryId]);

  const visibleItems = useMemo(() => {
    const list = filteredItems;
    if (!selectedCategoryId) return list;

    // ✅ FIX: filter by item.categoryId, not item.id
    return list.filter(
      (i: any) => String(i.categoryId || "") === String(selectedCategoryId),
    );
  }, [filteredItems, selectedCategoryId]);

  async function onCreateCategory() {
    if (!restaurantId) return;
    const name = newCategoryName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await endpoints.createMenuCategory(restaurantId, {
        name,
        sortOrder: Number(newCategorySort || 0),
      });
      setNewCategoryName("");
      setNewCategorySort("0");
      await loadMenu();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to create category");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivateCategory(categoryId: string) {
    if (!restaurantId) return;
    if (
      !window.confirm(
        "Deactivate this category? This will also discontinue all items in it.",
      )
    )
      return;
    setBusy(true);
    try {
      await endpoints.deactivateMenuCategory(restaurantId, categoryId);
      await loadMenu();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to deactivate category");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveCategoryEdits() {
    if (!restaurantId || !selectedCategoryId) return;
    const name = editCategoryName.trim();
    if (!name) {
      window.alert("Category name is required");
      return;
    }
    setBusy(true);
    try {
      await endpoints.updateMenuCategory(restaurantId, selectedCategoryId, {
        name,
        sortOrder: Number(editCategorySort || 0),
      });
      await loadMenu();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to update category");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveItem() {
    if (!restaurantId) return;

    const categoryId = (formCategoryId || selectedCategoryId || "").trim();
    if (!categoryId) {
      window.alert("Select a category first");
      return;
    }

    const name = formName.trim();
    if (!name) {
      window.alert("Item name is required");
      return;
    }

    const allergens = formAllergens
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: any = {
      categoryId,
      name,
      description: formDescription.trim() ? formDescription.trim() : undefined,

      // Backend expects priceCents:
      priceCents: centsFromDollars(formPrice),
      currency: "USD",

      isVeg: formIsVeg,
      spiceLevel: "NONE",

      allergens,
      allergenNotes: formAllergenNotes.trim()
        ? formAllergenNotes.trim()
        : undefined,

      isAvailable: formIsAvailable,
      isActive: formIsActive,
    };

    setBusy(true);
    try {
      if (selectedItemId) {
        await endpoints.updateMenuItem(restaurantId, selectedItemId, payload);
      } else {
        const created = await endpoints.createMenuItem(restaurantId, payload);
        const newId = created?.id;
        if (newId) setSelectedItemId(String(newId));
      }
      await loadMenu();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to save item");
    } finally {
      setBusy(false);
    }
  }

  /** Build payload from current form state (for partial updates) */
  function buildItemPayload(overrides?: { isAvailable?: boolean; isActive?: boolean }) {
    const categoryId = (formCategoryId || selectedCategoryId || "").trim();
    const allergens = formAllergens.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      categoryId,
      name: formName.trim(),
      description: formDescription.trim() ? formDescription.trim() : undefined,
      priceCents: centsFromDollars(formPrice),
      currency: "USD",
      isVeg: formIsVeg,
      spiceLevel: "NONE",
      allergens,
      allergenNotes: formAllergenNotes.trim() ? formAllergenNotes.trim() : undefined,
      isAvailable: overrides?.isAvailable ?? formIsAvailable,
      isActive: overrides?.isActive ?? formIsActive,
    };
  }

  async function onToggleAvailable(checked: boolean) {
    if (!restaurantId || !selectedItemId) return;
    setFormIsAvailable(checked);
    setBusy(true);
    try {
      await endpoints.updateMenuItem(restaurantId, selectedItemId, buildItemPayload({ isAvailable: checked }));
      await loadMenu();
    } catch (e: any) {
      setFormIsAvailable(!checked);
      window.alert(e?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleActive(checked: boolean) {
    if (!restaurantId || !selectedItemId) return;
    if (!checked && !window.confirm("Remove this item from the menu? It will no longer appear for customers.")) return;
    setFormIsActive(checked);
    setBusy(true);
    try {
      await endpoints.updateMenuItem(restaurantId, selectedItemId, buildItemPayload({ isActive: checked }));
      await loadMenu();
    } catch (e: any) {
      setFormIsActive(!checked);
      window.alert(e?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function doMediaUpload() {
    if (!restaurantId || !selectedItemId || !mediaFile) return;
    setMediaBusy(true);
    setMediaMsg(null);
    setMediaErr(null);
    try {
      if (mediaKind === "IMAGE") {
        await endpoints.uploadMenuItemImage(restaurantId, selectedItemId, mediaFile);
      } else {
        await endpoints.uploadMenuItemVideo(restaurantId, selectedItemId, mediaFile);
      }
      setMediaMsg("Uploaded successfully.");
      setMediaFile(null);
      setMediaPreview("");
      await loadMenu();
    } catch (e: any) {
      setMediaErr(e?.message ?? "Upload failed");
    } finally {
      setMediaBusy(false);
    }
  }

  function onMediaFilePick(f: File | null) {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(f ?? null);
    setMediaPreview(f ? URL.createObjectURL(f) : "");
  }

  function handleMediaDrop(e: React.DragEvent) {
    e.preventDefault();
    setMediaDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const isImage = mediaKind === "IMAGE" && f.type.startsWith("image/");
    const isVideo = mediaKind === "VIDEO" && f.type.startsWith("video/");
    if (isImage || isVideo) onMediaFilePick(f);
  }

  function handleMediaDragOver(e: React.DragEvent) {
    e.preventDefault();
    setMediaDragOver(true);
  }

  function handleMediaDragLeave() {
    setMediaDragOver(false);
  }

  return (
    <Container>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-3xl font-black tracking-tight">Menu Manager</div>
          <div className="mt-1 text-sm text-zinc-600">
            Create categories, add items, upload photos & videos, and toggle availability.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => loadMenu()}
            disabled={busy}
          >
            Refresh
          </Button>
          <Badge>includeInactive=1</Badge>
        </div>
      </div>

      {err ? (
        <Panel className="p-4 border-red-200 bg-red-50 text-sm text-red-800">
          {err}
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-1">
          <div className="text-sm font-bold">Restaurant</div>
          <select
            value={restaurantId}
            onChange={(e) => {
              setRestaurantId(e.target.value);
              setSelectedItemId("");
              setSelectedCategoryId("");
            }}
            className="mt-3 w-full rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="">Select a restaurant…</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.city ? ` — ${r.city}` : ""}
              </option>
            ))}
          </select>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm font-bold">Categories</div>
            <div className="text-xs text-zinc-500">{categories.length}</div>
          </div>

          {loading ? (
            <div className="mt-3 text-sm text-zinc-600">Loading…</div>
          ) : (
            <div className="mt-3 grid gap-2">
              <button
                onClick={() => {
                  setSelectedCategoryId("");
                  setSelectedItemId("");
                }}
                className={clsx(
                  "w-full rounded-2xl border px-3 py-2 text-left text-sm font-semibold",
                  !selectedCategoryId
                    ? "border-brand bg-brand/5"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">All categories</span>
                  <span className="text-xs text-zinc-500">{items.length}</span>
                </div>
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategoryId(c.id);
                    setSelectedItemId("");
                  }}
                  className={clsx(
                    "w-full rounded-2xl border px-3 py-2 text-left text-sm font-semibold",
                    selectedCategoryId === c.id
                      ? "border-brand bg-brand/5"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <span className="flex items-center gap-2">
                      {(c as any)?.isActive === false ? (
                        <span className="text-[11px] font-bold text-red-700">
                          inactive
                        </span>
                      ) : null}
                      <span className="text-xs text-zinc-500">
                        {c.items?.length ?? 0}
                      </span>
                    </span>
                  </div>
                </button>
              ))}

              <div className="mt-3 rounded-2xl border bg-zinc-50 p-3">
                <div className="text-[11px] font-semibold text-zinc-500">
                  Add category
                </div>
                <div className="mt-2 grid gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Appetizers"
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newCategorySort}
                      onChange={(e) => setNewCategorySort(e.target.value)}
                      placeholder="Sort"
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    />
                    <Button
                      onClick={onCreateCategory}
                      disabled={busy || !newCategoryName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {selectedCategory ? (
                <div className="rounded-2xl border bg-white p-3">
                  <div className="text-[11px] font-semibold text-zinc-500">
                    Edit selected category
                  </div>
                  <div className="mt-2 grid gap-2">
                    <input
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editCategorySort}
                        onChange={(e) => setEditCategorySort(e.target.value)}
                        placeholder="Sort"
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                      />
                      <Button
                        variant="secondary"
                        onClick={onSaveCategoryEdits}
                        disabled={busy || !editCategoryName.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedCategoryId ? (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => onDeactivateCategory(selectedCategoryId)}
                  disabled={busy}
                >
                  Deactivate selected category
                </Button>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold">Items</div>
              <div className="text-xs text-zinc-500">
                <b>Customers can order</b> = available; <b>Listed on menu</b> = shown. Uncheck to hide or remove.
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                placeholder="Search items…"
                className="w-full md:w-[260px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <Button
                variant="secondary"
                onClick={() => setSelectedItemId("")}
                disabled={busy}
              >
                New
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border bg-white p-3">
              <div className="max-h-[520px] overflow-auto">
                {visibleItems.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-600">
                    No items for this category.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {visibleItems.map((it: any) => (
                      <button
                        key={it.id}
                        onClick={() => setSelectedItemId(it.id)}
                        className={clsx(
                          "w-full rounded-2xl border px-3 py-2 text-left transition",
                          selectedItemId === it.id
                            ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                            : it.isActive === false
                              ? "border-red-200 bg-red-50/70 hover:border-red-300"
                              : it.isAvailable === false
                                ? "border-amber-200 bg-amber-50/70 hover:border-amber-300"
                                : "border-zinc-200 bg-white hover:border-zinc-300",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">
                              {it.name}
                            </div>
                            <div className="truncate text-xs text-zinc-500">
                              ${Number(it.price ?? 0).toFixed(2)} ·{" "}
                              {it.categoryName || "—"}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {it.isActive === false ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Removed from menu
                              </span>
                            ) : it.isAvailable === false ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                Temporarily unavailable
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Available
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">
                  {selectedItemId ? "Edit item" : "Create item"}
                </div>
                {selectedItemId ? (
                  <Badge>{selectedItemId.slice(0, 6)}…</Badge>
                ) : (
                  <Badge>new</Badge>
                )}
              </div>

              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Category
                  </label>
                  <select
                    value={formCategoryId || selectedCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="rounded-2xl border px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-200"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Item name
                  </label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Masala Dosa"
                    className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2 min-w-0">
                    <label className="text-[11px] font-semibold text-zinc-500">
                      Price (USD)
                    </label>
                    <input
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="e.g., 12.99"
                      className="
        w-full
        rounded-2xl
        border
        px-3
        py-2
        text-sm
        outline-none
        focus:ring-2
        focus:ring-zinc-200
        focus:ring-offset-0
      "
                    />
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <label className="text-[11px] font-semibold text-zinc-500">
                      Diet
                    </label>
                    <div
                      className="
        flex
        items-center
        gap-2
        rounded-2xl
        border
        px-3
        py-2
        h-[40px]
      "
                    >
                      <input
                        type="checkbox"
                        checked={formIsVeg}
                        onChange={(e) => setFormIsVeg(e.target.checked)}
                        className="shrink-0"
                      />
                      <span className="text-sm font-semibold text-zinc-700">
                        Vegetarian
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Short description (optional)"
                    className="min-h-[90px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Allergen tags
                  </label>
                  <input
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    placeholder="Comma separated (e.g., milk, nuts, wheat)"
                    className="rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Allergen notes
                  </label>
                  <textarea
                    value={formAllergenNotes}
                    onChange={(e) => setFormAllergenNotes(e.target.value)}
                    placeholder='e.g., "Prepared in a kitchen that also handles peanuts"'
                    className="min-h-[70px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={clsx(
                      "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition",
                      formIsAvailable ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formIsAvailable}
                      onChange={(e) =>
                        selectedItemId ? onToggleAvailable(e.target.checked) : setFormIsAvailable(e.target.checked)
                      }
                      disabled={busy}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-zinc-700">
                      Available for ordering
                    </span>
                  </label>

                  <label
                    className={clsx(
                      "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition",
                      formIsActive ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) =>
                        selectedItemId ? onToggleActive(e.target.checked) : setFormIsActive(e.target.checked)
                      }
                      disabled={busy}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-zinc-700">
                      Listed on menu
                    </span>
                  </label>
                </div>
                <p className="text-xs text-zinc-500">
                  Changes save automatically. Uncheck Active to discontinue.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={onSaveItem} disabled={busy}>
                    {busy ? "Saving..." : "Save details"}
                  </Button>
                </div>

                {selectedItemId ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-bold">Media</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Photo and video shown to customers on the menu.
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
                        <div className="text-xs font-semibold text-zinc-600">Photo</div>
                        {(selectedItem as any)?.imageUrl ? (
                          <div className="mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={(selectedItem as any).imageUrl}
                              alt=""
                              className="h-24 w-full rounded-lg object-cover"
                            />
                            <span className="mt-1 block text-[10px] text-emerald-600">Uploaded</span>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-zinc-500">No photo yet</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
                        <div className="text-xs font-semibold text-zinc-600">Video</div>
                        {(selectedItem as any)?.videoUrl ? (
                          <div className="mt-2">
                            <span className="text-[11px] text-emerald-600">Video uploaded</span>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-zinc-500">No video yet</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMediaKind("IMAGE");
                            onMediaFilePick(null);
                          }}
                          className={clsx(
                            "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                            mediaKind === "IMAGE"
                              ? "border-brand bg-brand text-white"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                          )}
                        >
                          Add photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaKind("VIDEO");
                            onMediaFilePick(null);
                          }}
                          className={clsx(
                            "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                            mediaKind === "VIDEO"
                              ? "border-brand bg-brand text-white"
                              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                          )}
                        >
                          Add video
                        </button>
                      </div>

                      <div
                        onDrop={handleMediaDrop}
                        onDragOver={handleMediaDragOver}
                        onDragLeave={handleMediaDragLeave}
                        className={clsx(
                          "mt-3 rounded-xl border-2 border-dashed p-6 text-center transition",
                          mediaDragOver
                            ? "border-brand bg-brand/5"
                            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300",
                        )}
                      >
                        {!mediaPreview ? (
                          <>
                            <p className="text-sm font-medium text-zinc-700">
                              Drag & drop or click to choose {mediaKind.toLowerCase()}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {mediaKind === "IMAGE" ? "JPG, PNG, WebP (max 15MB)" : "MP4, WebM"}
                            </p>
                            <Button
                              variant="secondary"
                              className="mt-3 py-2 px-4 text-xs"
                              onClick={() => document.getElementById("mediaFileInput")?.click()}
                              disabled={mediaBusy}
                            >
                              Choose file
                            </Button>
                          </>
                        ) : (
                          <div className="space-y-3">
                            {mediaKind === "IMAGE" ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={mediaPreview}
                                alt="Preview"
                                className="mx-auto h-40 max-w-full rounded-lg object-cover"
                              />
                            ) : (
                              <video
                                src={mediaPreview}
                                controls
                                className="mx-auto h-40 max-w-full rounded-lg object-cover"
                              />
                            )}
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="secondary"
                                className="py-2 px-3 text-xs"
                                onClick={() => document.getElementById("mediaFileInput")?.click()}
                                disabled={mediaBusy}
                              >
                                Change
                              </Button>
                              <Button className="py-2 px-4 text-xs" onClick={doMediaUpload} disabled={mediaBusy}>
                                {mediaBusy ? "Uploading…" : "Upload"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <input
                      id="mediaFileInput"
                      type="file"
                      accept={mediaKind === "IMAGE" ? "image/*" : "video/*"}
                      className="hidden"
                      onChange={(e) => onMediaFilePick(e.target.files?.[0] ?? null)}
                    />

                    {mediaMsg ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {mediaMsg}
                      </div>
                    ) : null}
                    {mediaErr ? (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        {mediaErr}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-2xl border bg-zinc-50 p-3 text-[11px] text-zinc-600">
                  <div className="font-semibold">Status</div>
                  <ul className="mt-1 list-disc pl-4">
                    <li>
                      <b>Available</b> — customers can order. Uncheck to hide temporarily.
                    </li>
                    <li>
                      <b>Active</b> — item is live. Uncheck to discontinue (soft delete).
                    </li>
                    <li>Both save automatically when toggled.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </Container>
  );
}
