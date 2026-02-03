"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getUser } from "@/lib/auth";
import {
  listTables,
  getTablesStatus,
  createTable,
  updateTable,
  deactivateTable,
  deleteTable,
  type RestaurantTable,
  type CreateTableDto,
  type UpdateTableDto,
} from "@/lib/api/admin";
import { listRestaurants } from "@/lib/api/admin";
import Button from "@/components/ui/Button";
import { clsx } from "clsx";

export default function TablesPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tables, setTables] = useState<(RestaurantTable & { occupied?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [saving, setSaving] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "layout">("list");
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [draggingTable, setDraggingTable] = useState<RestaurantTable | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/r/login");
      return;
    }

    // Get restaurant ID from user
    if (user.restaurantId) {
      setRestaurantId(user.restaurantId);
      loadTables(user.restaurantId);
    } else {
      // If no restaurantId, try to get from restaurants list
      listRestaurants().then((restaurants: any[]) => {
        if (restaurants.length > 0) {
          const id = restaurants[0].id;
          setRestaurantId(id);
          loadTables(id);
        }
      });
    }
  }, [router, includeInactive]);

  async function loadTables(rid: string) {
    setLoading(true);
    try {
      if (includeInactive) {
        const data = await listTables(rid, true);
        setTables(data.map((t) => ({ ...t, occupied: false })));
      } else {
        const status = await getTablesStatus(rid);
        setTables(status.tables);
      }
    } catch (e: any) {
      console.error("Failed to load tables:", e);
      alert(e?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(dto: CreateTableDto) {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await createTable(restaurantId, dto);
      setShowCreateModal(false);
      loadTables(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to create table");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(tableId: string, dto: UpdateTableDto) {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await updateTable(restaurantId, tableId, dto);
      setEditingTable(null);
      setSelectedTable(null);
      loadTables(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to update table");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(tableId: string) {
    if (!restaurantId) return;
    if (!confirm("Are you sure you want to deactivate this table?")) return;
    try {
      await deactivateTable(restaurantId, tableId);
      loadTables(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to deactivate table");
    }
  }

  async function handleDelete(tableId: string) {
    if (!restaurantId) return;
    if (!confirm("Permanently delete this table? This cannot be undone.")) return;
    try {
      await deleteTable(restaurantId, tableId);
      loadTables(restaurantId);
    } catch (e: any) {
      alert(e?.message || "Failed to delete table");
    }
  }

  function handleLayoutClick(e: React.MouseEvent<HTMLDivElement>) {
    if (selectedTable && !draggingTable) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleUpdate(selectedTable.id, { x, y });
    }
  }

  function handleTableMouseDown(e: React.MouseEvent, table: RestaurantTable) {
    e.stopPropagation();
    setSelectedTable(table);
    setDraggingTable(table);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - (table.x || 0),
      y: e.clientY - rect.top - (table.y || 0),
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingTable) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 60));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 60));
      setTables((prev) =>
        prev.map((t) => (t.id === draggingTable.id ? { ...t, x, y } : t))
      );
    }
  }

  function handleMouseUp() {
    if (draggingTable) {
      const table = tables.find((t) => t.id === draggingTable.id);
      if (table && (table.x !== draggingTable.x || table.y !== draggingTable.y)) {
        handleUpdate(draggingTable.id, { 
          x: table.x ?? undefined, 
          y: table.y ?? undefined 
        });
      }
      setDraggingTable(null);
    }
  }

  if (!restaurantId) {
    return (
      <AppShell activeHref="/r/tables">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/r/tables">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Tables</h1>
            <p className="mt-1 text-sm text-zinc-600">Manage restaurant table layout</p>
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
            <button
              onClick={() => setViewMode(viewMode === "list" ? "layout" : "list")}
              className={clsx(
                "rounded-xl px-4 py-2 text-xs font-semibold transition",
                viewMode === "layout"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
              )}
            >
              {viewMode === "list" ? "Layout View" : "List View"}
            </button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Add Table
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading tables...
          </div>
        ) : viewMode === "list" ? (
          tables.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
              <p className="text-sm text-zinc-500 mb-4">No tables found</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add First Table
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={clsx(
                    "rounded-2xl border p-6 transition",
                    table.active
                      ? "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                      : "border-zinc-100 bg-zinc-50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {table.displayName || `Table ${table.tableNumber}`}
                      </h3>
                      <div className="text-xs text-zinc-500">#{table.tableNumber}</div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          table.active
                            ? "bg-green-100 text-green-800"
                            : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {table.active ? "Active" : "Inactive"}
                      </span>
                      {table.active && table.occupied && (
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800">
                          Occupied
                        </span>
                      )}
                    </div>
                  </div>
                  {table.seats && (
                    <div className="text-xs text-zinc-600 mb-2">🪑 {table.seats} seats</div>
                  )}
                  {table.zone && (
                    <div className="text-xs text-zinc-500 mb-2">📍 Zone: {table.zone}</div>
                  )}
                  {(table.x !== null || table.y !== null) && (
                    <div className="text-xs text-zinc-500 mb-2">
                      📐 Position: ({Math.round(table.x || 0)}, {Math.round(table.y || 0)})
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => setEditingTable(table)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                    >
                      Edit
                    </button>
                    {table.active && (
                      <button
                        onClick={() => handleDeactivate(table.id)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-4 text-sm text-zinc-600">
              Click and drag tables to reposition. Click empty space to deselect.
            </div>
            <div
              className="relative border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50"
              style={{ width: "100%", height: "600px", minHeight: "600px" }}
              onClick={handleLayoutClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {tables
                .filter((t) => t.active && (t.x !== null || t.y !== null))
                .map((table) => (
                  <div
                    key={table.id}
                    className={clsx(
                      "absolute rounded-xl border-2 cursor-move transition",
                      selectedTable?.id === table.id
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-zinc-300 bg-white hover:border-zinc-400"
                    )}
                    style={{
                      left: `${table.x || 0}px`,
                      top: `${table.y || 0}px`,
                      width: table.width ? `${table.width}px` : "60px",
                      height: table.height ? `${table.height}px` : "60px",
                      transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                    }}
                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(table);
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-xs font-semibold text-zinc-900">
                      {table.displayName || table.tableNumber}
                    </div>
                  </div>
                ))}
              {selectedTable && (
                <div 
                  className="absolute top-4 right-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-lg max-w-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="font-semibold text-zinc-900 mb-2">
                    {selectedTable.displayName || `Table ${selectedTable.tableNumber}`}
                  </h4>
                  <div className="text-xs text-zinc-600 space-y-1">
                    <div>Number: {selectedTable.tableNumber}</div>
                    {selectedTable.seats && <div>Seats: {selectedTable.seats}</div>}
                    {selectedTable.zone && <div>Zone: {selectedTable.zone}</div>}
                    <div>
                      Position: ({Math.round(selectedTable.x || 0)},{" "}
                      {Math.round(selectedTable.y || 0)})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable(selectedTable);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                    >
                      Edit
                    </button>
                    {selectedTable.active && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivate(selectedTable.id);
                          setSelectedTable(null);
                        }}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(selectedTable.id);
                        setSelectedTable(null);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(null);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingTable) && (
          <TableModal
            table={editingTable}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTable(null);
            }}
            onSave={async (dto) => {
              if (editingTable) {
                await handleUpdate(editingTable.id, dto as UpdateTableDto);
              } else {
                await handleCreate(dto as CreateTableDto);
              }
            }}
            saving={saving}
          />
        )}
      </div>
    </AppShell>
  );
}

function TableModal({
  table,
  onClose,
  onSave,
  saving,
}: {
  table: RestaurantTable | null;
  onClose: () => void;
  onSave: (dto: CreateTableDto | UpdateTableDto) => Promise<void> | void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreateTableDto>({
    tableNumber: table?.tableNumber || "",
    displayName: table?.displayName || "",
    seats: table?.seats || undefined,
    x: table?.x || undefined,
    y: table?.y || undefined,
    width: table?.width || undefined,
    height: table?.height || undefined,
    rotation: table?.rotation || undefined,
    zone: table?.zone || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tableNumber) {
      alert("Table number is required");
      return;
    }
    const dto = table
      ? {
          displayName: form.displayName,
          seats: form.seats,
          x: form.x,
          y: form.y,
          width: form.width,
          height: form.height,
          rotation: form.rotation,
          zone: form.zone,
        }
      : form;
    onSave(dto);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">
          {table ? "Edit Table" : "Add Table"}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Table Number *</label>
            <input
              required
              disabled={!!table}
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-zinc-100"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Display Name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g., Window Table, VIP Booth"
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Seats</label>
              <input
                type="number"
                min="1"
                value={form.seats || ""}
                onChange={(e) =>
                  setForm({ ...form, seats: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Zone</label>
              <input
                value={form.zone || ""}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                placeholder="e.g., Patio, Main Hall"
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Layout Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">X Position</label>
                <input
                  type="number"
                  value={form.x || ""}
                  onChange={(e) =>
                    setForm({ ...form, x: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Y Position</label>
                <input
                  type="number"
                  value={form.y || ""}
                  onChange={(e) =>
                    setForm({ ...form, y: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Width</label>
                <input
                  type="number"
                  min="20"
                  value={form.width || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      width: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Height</label>
                <input
                  type="number"
                  min="20"
                  value={form.height || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      height: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Rotation (°)</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={form.rotation || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rotation: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
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
              {saving ? "Saving..." : table ? "Update Table" : "Create Table"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
