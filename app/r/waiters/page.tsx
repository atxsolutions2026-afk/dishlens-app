"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getUser } from "@/lib/auth";
import { listWaiters, createWaiter, updateWaiter, deactivateWaiter, uploadWaiterPhoto, type WaiterProfile, type CreateWaiterDto, type UpdateWaiterDto } from "@/lib/api/admin";
import { listRestaurants } from "@/lib/api/admin";
import Button from "@/components/ui/Button";
import { clsx } from "clsx";

export default function WaitersPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [waiters, setWaiters] = useState<WaiterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<WaiterProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/r/login");
      return;
    }

    // Get restaurant ID from user
    if (user.restaurantId) {
      setRestaurantId(user.restaurantId);
      loadWaiters(user.restaurantId);
    } else {
      // If no restaurantId, try to get from restaurants list
      listRestaurants().then((restaurants: any[]) => {
        if (restaurants.length > 0) {
          const id = restaurants[0].id;
          setRestaurantId(id);
          loadWaiters(id);
        }
      });
    }
  }, [router, includeInactive]);

  async function loadWaiters(rid: string) {
    setLoading(true);
    try {
      const data = await listWaiters(rid, includeInactive);
      setWaiters(data);
    } catch (e: any) {
      console.error("Failed to load waiters:", e);
      alert(e?.message || "Failed to load waiters");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(dto: CreateWaiterDto) {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await createWaiter(restaurantId, dto);
      setShowCreateModal(false);
      loadWaiters(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to create waiter");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(waiterId: string, dto: UpdateWaiterDto) {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await updateWaiter(restaurantId, waiterId, dto);
      setEditingWaiter(null);
      loadWaiters(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to update waiter");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(waiterId: string) {
    if (!restaurantId) return;
    if (!confirm("Are you sure you want to deactivate this waiter?")) return;
    try {
      await deactivateWaiter(restaurantId, waiterId);
      loadWaiters(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to deactivate waiter");
    }
  }

  if (!restaurantId) {
    return (
      <AppShell activeHref="/r/waiters">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/r/waiters">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Waiters</h1>
            <p className="mt-1 text-sm text-zinc-600">Manage waiter profiles and staff</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIncludeInactive(!includeInactive)}
              className={clsx(
                "rounded-xl px-4 py-2 text-xs font-semibold transition",
                includeInactive
                  ? "bg-zinc-600 text-white"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
              )}
            >
              {includeInactive ? "Hide Inactive" : "Show Inactive"}
            </button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Add Waiter
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading waiters...
          </div>
        ) : waiters.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-sm text-zinc-500 mb-4">No waiters found</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add First Waiter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiters.map((waiter) => (
              <div
                key={waiter.id}
                className={clsx(
                  "rounded-2xl border p-6 transition",
                  waiter.active
                    ? "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                    : "border-zinc-100 bg-zinc-50 opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {waiter.photoUrl ? (
                      <img
                        src={waiter.photoUrl}
                        alt={waiter.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-semibold">
                        {waiter.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">{waiter.name}</h3>
                      {waiter.user?.email && (
                        <div className="text-xs text-zinc-500">{waiter.user.email}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      waiter.active
                        ? "bg-green-100 text-green-800"
                        : "bg-zinc-100 text-zinc-600"
                    )}
                  >
                    {waiter.active ? "Active" : "Inactive"}
                  </span>
                </div>
                {waiter.phone && (
                  <div className="text-xs text-zinc-600 mb-2">📞 {waiter.phone}</div>
                )}
                {waiter.notes && (
                  <div className="text-xs text-zinc-500 mb-3 line-clamp-2">{waiter.notes}</div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditingWaiter(waiter)}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                  >
                    Edit
                  </button>
                  {waiter.active && (
                    <button
                      onClick={() => handleDeactivate(waiter.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingWaiter) && restaurantId && (
          <WaiterModal
            restaurantId={restaurantId}
            waiter={editingWaiter}
            onClose={() => {
              setShowCreateModal(false);
              setEditingWaiter(null);
            }}
            onSave={async (dto) => {
              if (editingWaiter) {
                await handleUpdate(editingWaiter.id, dto as UpdateWaiterDto);
              } else {
                await handleCreate(dto as CreateWaiterDto);
              }
            }}
            saving={saving}
          />
        )}
      </div>
    </AppShell>
  );
}

function WaiterModal({
  restaurantId,
  waiter,
  onClose,
  onSave,
  saving,
}: {
  restaurantId: string;
  waiter: WaiterProfile | null;
  onClose: () => void;
  onSave: (dto: CreateWaiterDto | UpdateWaiterDto) => Promise<void> | void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreateWaiterDto>({
    name: waiter?.name || "",
    email: waiter?.user?.email || "",
    password: "",
    photoUrl: waiter?.photoUrl || "",
    phone: waiter?.phone || "",
    notes: waiter?.notes || "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);

  function handlePhotoPick(f: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(f ?? null);
    setPhotoPreview(f ? URL.createObjectURL(f) : "");
  }

  async function handlePhotoUpload() {
    if (!waiter || !restaurantId || !photoFile) return;
    setPhotoUploading(true);
    try {
      const res = await uploadWaiterPhoto(restaurantId, waiter.id, photoFile);
      setForm((prev) => ({ ...prev, photoUrl: res.photoUrl }));
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setPhotoUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      alert("Name is required");
      return;
    }
    if (!waiter && (!form.email || !form.password)) {
      alert("Email and password are required for new waiters");
      return;
    }
    const dto = waiter
      ? { name: form.name, photoUrl: form.photoUrl, phone: form.phone, notes: form.notes }
      : form;
    onSave(dto);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">
          {waiter ? "Edit Waiter" : "Add Waiter"}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {!waiter && (
            <>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Password *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </>
          )}
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Photo</label>
            {waiter ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt={form.name}
                        className="w-20 h-20 rounded-full object-cover border border-zinc-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-semibold text-xl">
                        {form.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {form.photoUrl && (
                      <p className="text-xs text-zinc-500 truncate">Current photo</p>
                    )}
                    {!photoPreview ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="py-2 px-3 text-xs"
                          onClick={() => document.getElementById("waiterPhotoInput")?.click()}
                          disabled={photoUploading}
                        >
                          Choose image
                        </Button>
                        <span className="text-xs text-zinc-500 self-center">JPG, PNG, WebP</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-full object-cover border"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="py-2 px-3 text-xs"
                            onClick={() => document.getElementById("waiterPhotoInput")?.click()}
                            disabled={photoUploading}
                          >
                            Change
                          </Button>
                          <Button
                            type="button"
                            className="py-2 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handlePhotoUpload}
                            disabled={photoUploading}
                          >
                            {photoUploading ? "Uploading…" : "Upload"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  id="waiterPhotoInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoPick(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <input
                type="url"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="Upload photo after saving (or paste URL)"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            )}
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? "Saving..." : waiter ? "Update Waiter" : "Create Waiter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
