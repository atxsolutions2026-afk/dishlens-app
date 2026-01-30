"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";
import {
  getWaiterProfile,
  getWaiterFloorMap,
  claimTable,
  releaseTable,
  getTableOrders,
  getWaiterCalls,
  acceptWaiterCall,
  closeWaiterCall,
  handleWaiterCall,
  getReadyOrders,
  markOrderServing,
  markOrderServed,
  createWaiterOrder,
  type TableWithStatus,
  type WaiterCall,
  type TableOrders,
} from "@/lib/api/waiter";
import { staffUpdateOrder, staffClaimOrder, updateOrderStatus, adminMenu } from "@/lib/api/admin";
import { clsx } from "clsx";
import Button from "@/components/ui/Button";

export default function WaiterDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [tableOrders, setTableOrders] = useState<TableOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [activeTab, setActiveTab] = useState<"tables" | "ready" | "calls">("tables");
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/r/login");
      return;
    }

    // Check if user is a waiter
    const isWaiter = user.roles?.includes("WAITER");
    const isAdmin = user.roles?.includes("RESTAURANT_OWNER") || user.roles?.includes("ATX_ADMIN");
    if (!isWaiter && !isAdmin) {
      router.push("/r/login");
      return;
    }

    setMyUserId(user.id);
    loadData();
  }, [router]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    if (!myUserId) return;

    const interval = setInterval(() => {
      loadCalls();
      if (activeTab === "ready" && restaurantId) {
        loadReadyOrders();
      }
      if (selectedTable) {
        loadTableOrders(selectedTable.id);
      }
      loadFloorMap();
    }, 5000);

    return () => clearInterval(interval);
  }, [myUserId, selectedTable]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileData, floorMapData, callsData] = await Promise.all([
        getWaiterProfile().catch(() => null),
        getWaiterFloorMap().catch(() => ({ tables: [] })),
        getWaiterCalls().catch(() => ({ calls: [] })),
      ]);

      if (profileData) setProfile(profileData);
      if (floorMapData.tables) setTables(floorMapData.tables);
      if (callsData.calls) setCalls(callsData.calls);
    } catch (e: any) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadFloorMap() {
    try {
      const data = await getWaiterFloorMap();
      setTables(data.tables);
    } catch (e: any) {
      console.error("Failed to load floor map:", e);
    }
  }

  async function loadCalls() {
    try {
      const data = await getWaiterCalls("REQUESTED");
      setCalls(data.calls);
    } catch (e: any) {
      console.error("Failed to load calls:", e);
    }
  }

  async function loadReadyOrders() {
    if (!restaurantId) return;
    try {
      const orders = await getReadyOrders(restaurantId);
      setReadyOrders(orders);
    } catch (e: any) {
      console.error("Failed to load ready orders:", e);
    }
  }

  async function loadTableOrders(tableId: string) {
    try {
      const data = await getTableOrders(tableId);
      setTableOrders(data);
    } catch (e: any) {
      console.error("Failed to load table orders:", e);
    }
  }

  async function handleClaimTable(table: TableWithStatus) {
    try {
      await claimTable(table.id);
      await loadFloorMap();
      if (selectedTable?.id === table.id) {
        await loadTableOrders(table.id);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to claim table");
    }
  }

  async function handleReleaseTable(table: TableWithStatus) {
    try {
      await releaseTable(table.id);
      await loadFloorMap();
      if (selectedTable?.id === table.id) {
        setSelectedTable(null);
        setTableOrders(null);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to release table");
    }
  }

  async function handleSelectTable(table: TableWithStatus) {
    setSelectedTable(table);
    try {
      await loadTableOrders(table.id);
    } catch (e: any) {
      console.error("Failed to load table orders:", e);
      // Still show the table even if orders fail to load
    }
  }

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  async function handleAcceptCall(call: WaiterCall) {
    // Accept both OPEN (legacy) and REQUESTED (new flow)
    if (call.status !== "OPEN" && call.status !== "REQUESTED") return;
    try {
      setAcceptingId(call.id);
      await acceptWaiterCall(call.id);
      await loadCalls();
    } catch (e: any) {
      alert(e?.message || "Failed to accept call");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleMarkDone(call: WaiterCall) {
    if (call.status !== "ACCEPTED") return;
    try {
      setHandlingId(call.id);
      await closeWaiterCall(call.id);
      await loadCalls();
    } catch (e: any) {
      alert(e?.message || "Failed to mark done");
    } finally {
      setHandlingId(null);
    }
  }

  async function handleMarkServing(orderId: string) {
    if (!restaurantId) return;
    try {
      await markOrderServing(restaurantId, orderId);
      await loadReadyOrders();
    } catch (e: any) {
      alert(e?.message || "Failed to mark as serving");
    }
  }

  async function handleMarkServed(orderId: string) {
    if (!restaurantId) return;
    try {
      await markOrderServed(restaurantId, orderId);
      await loadReadyOrders();
    } catch (e: any) {
      alert(e?.message || "Failed to mark as served");
    }
  }

  // Tables assigned to this waiter
  const myTables = tables.filter(
    (t) => t.currentWaiter?.userId === myUserId && t.active
  );

  // Calls visible to this waiter: OPEN (my tables + unassigned) and ACCEPTED (mine)
  const myCalls = calls;
  const openCalls = calls.filter((c) => c.status === "OPEN" || c.status === "REQUESTED");
  const acceptedByMe = calls.filter((c) => c.status === "ACCEPTED");

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading waiter dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                {profile?.name || "Waiter Dashboard"}
              </h1>
              <p className="text-xs text-zinc-600 mt-1">
                {myTables.length} table{myTables.length !== 1 ? "s" : ""} assigned
                {myCalls.length > 0 && (
                  <span className="ml-2 text-red-600 font-semibold">
                    • {myCalls.length} call{myCalls.length !== 1 ? "s" : ""} waiting
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
                className={clsx(
                  "rounded-xl px-4 py-2 text-xs font-semibold transition",
                  viewMode === "map"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                )}
              >
                {viewMode === "list" ? "Map View" : "List View"}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  router.push("/r/login");
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => {
              setActiveTab("tables");
              if (selectedTable) loadTableOrders(selectedTable.id);
            }}
            className={clsx(
              "px-4 py-2 text-sm font-semibold border-b-2 transition",
              activeTab === "tables"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            )}
          >
            Tables
          </button>
          <button
            onClick={() => {
              setActiveTab("ready");
              if (restaurantId) loadReadyOrders();
            }}
            className={clsx(
              "px-4 py-2 text-sm font-semibold border-b-2 transition relative",
              activeTab === "ready"
                ? "border-green-600 text-green-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            )}
          >
            Ready Orders
            {readyOrders.length > 0 && (
              <span className="ml-2 rounded-full bg-green-600 text-white text-xs px-2 py-0.5">
                {readyOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("calls");
              loadCalls();
            }}
            className={clsx(
              "px-4 py-2 text-sm font-semibold border-b-2 transition relative",
              activeTab === "calls"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            )}
          >
            Waiter Calls
            {calls.filter((c) => c.status === "REQUESTED" || c.status === "OPEN").length > 0 && (
              <span className="ml-2 rounded-full bg-amber-600 text-white text-xs px-2 py-0.5">
                {calls.filter((c) => c.status === "REQUESTED" || c.status === "OPEN").length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "ready" && (
          <ReadyOrdersTab
            orders={readyOrders}
            myUserId={myUserId}
            restaurantId={restaurantId || ""}
            onMarkServing={handleMarkServing}
            onMarkServed={handleMarkServed}
            onRefresh={loadReadyOrders}
          />
        )}

        {activeTab === "calls" && (
          <WaiterCallsTab
            calls={calls}
            myUserId={myUserId}
            onAccept={handleAcceptCall}
            onClose={handleMarkDone}
            acceptingId={acceptingId}
            handlingId={handlingId}
          />
        )}

        {activeTab === "tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tables */}
          <div className="lg:col-span-2">
            {/* Calls: OPEN = need Accept; ACCEPTED = need Mark done */}
            {myCalls.length > 0 && (
              <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                <div className="text-lg font-bold text-amber-900 mb-3">
                  🔔 {openCalls.length > 0 && `${openCalls.length} call${openCalls.length !== 1 ? "s" : ""} waiting`}
                  {openCalls.length > 0 && acceptedByMe.length > 0 && " · "}
                  {acceptedByMe.length > 0 && `${acceptedByMe.length} on the way`}
                </div>
                <div className="space-y-2">
                  {myCalls.map((call) => (
                    <div
                      key={call.id}
                      className={clsx(
                        "flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3",
                        call.status === "ACCEPTED"
                          ? "border-green-300 bg-green-50"
                          : "border-amber-200 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">
                          Table {call.tableNumber}
                        </span>
                        {(call.status === "OPEN" || call.status === "REQUESTED") && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-200 text-amber-900">
                            {call.isMyTable ? "Your table" : "Any waiter"}
                          </span>
                        )}
                        {call.status === "ACCEPTED" && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-200 text-green-800">
                            You’re on the way
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {(call.status === "OPEN" || call.status === "REQUESTED") && (
                          <button
                            onClick={() => handleAcceptCall(call)}
                            disabled={!!acceptingId}
                            className="rounded-xl bg-amber-600 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
                          >
                            {acceptingId === call.id ? "Accepting…" : "Accept"}
                          </button>
                        )}
                        {call.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleMarkDone(call)}
                            disabled={!!handlingId}
                            className="rounded-xl bg-green-600 text-white px-4 py-2 text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                          >
                            {handlingId === call.id ? "…" : "Mark done"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables List/Map */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900">Restaurant Tables</h2>
                <button
                  onClick={loadFloorMap}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                >
                  Refresh
                </button>
              </div>

              {viewMode === "list" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tables
                    .filter((t) => t.active)
                    .map((table) => {
                      const isMine = table.currentWaiter?.userId === myUserId;
                      const hasCall = calls.some((c) => c.tableNumber === table.tableNumber);
                      return (
                        <div
                          key={table.id}
                          className={clsx(
                            "rounded-xl border-2 p-4 cursor-pointer transition",
                            selectedTable?.id === table.id
                              ? "border-blue-500 bg-blue-50"
                              : hasCall
                                ? "border-red-300 bg-red-50 animate-pulse"
                                : isMine
                                  ? "border-green-300 bg-green-50"
                                  : "border-zinc-200 bg-white hover:border-zinc-300"
                          )}
                          onClick={() => handleSelectTable(table)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-zinc-900">
                                {table.displayName || `Table ${table.tableNumber}`}
                              </div>
                              <div className="text-xs text-zinc-600 mt-1">
                                #{table.tableNumber}
                                {table.seats && ` • ${table.seats} seats`}
                                {table.zone && ` • ${table.zone}`}
                              </div>
                            </div>
                            {hasCall && (
                              <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-1">
                                CALL
                              </span>
                            )}
                          </div>
                          {table.currentWaiter && (
                            <div className="mt-2 text-xs text-zinc-600">
                              {isMine ? (
                                <span className="text-green-700 font-semibold">✓ You are serving</span>
                              ) : (
                                <span>Served by: {table.currentWaiter.name}</span>
                              )}
                            </div>
                          )}
                          {table.activeOrdersCount > 0 && (
                            <div className="mt-2 text-xs text-zinc-600">
                              {table.activeOrdersCount} active order
                              {table.activeOrdersCount !== 1 ? "s" : ""}
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            {!isMine && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimTable(table);
                                }}
                                className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
                              >
                                Claim
                              </button>
                            )}
                            {isMine && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReleaseTable(table);
                                }}
                                className="flex-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Release
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50 min-h-[400px]">
                  <div className="p-4 text-sm text-zinc-600 text-center">
                    Map view coming soon. Use list view to select tables.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Table Orders */}
          <div className="lg:col-span-1">
            {selectedTable ? (
              <TableOrdersPanel
                table={selectedTable}
                orders={tableOrders}
                myUserId={myUserId}
                onRefresh={() => loadTableOrders(selectedTable.id)}
              />
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="text-center text-sm text-zinc-500">
                  Select a table to view orders
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Ready Orders Tab Component
function ReadyOrdersTab({
  orders,
  myUserId,
  restaurantId,
  onMarkServing,
  onMarkServed,
  onRefresh,
}: {
  orders: any[];
  myUserId: string | null;
  restaurantId: string;
  onMarkServing: (orderId: string) => void;
  onMarkServed: (orderId: string) => void;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="text-lg font-semibold text-zinc-900 mb-2">No ready orders</div>
        <div className="text-sm text-zinc-600">Orders will appear here when kitchen marks them ready</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isServing = order.status === "SERVING";
        const isMyOrder = order.servingWaiterUserId === myUserId;
        const canMarkServing = order.status === "READY" || order.status === "DONE";
        const canMarkServed = isServing && isMyOrder;

        return (
          <div
            key={order.id}
            className={clsx(
              "rounded-2xl border-2 bg-white p-4",
              isServing && isMyOrder ? "border-emerald-300 bg-emerald-50" : "border-zinc-200"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-zinc-900">
                  Table {order.tableNumber}
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleTimeString()}
                </div>
                {order.servingWaiterUserId && (
                  <div className="text-xs text-zinc-600 mt-1">
                    Serving waiter: {order.servingWaiterUserId.slice(0, 8)}...
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-zinc-900">
                  ${((order.totalCents || 0) / 100).toFixed(2)}
                </div>
                <span
                  className={clsx(
                    "inline-block rounded-full px-2 py-1 text-xs font-semibold mt-1",
                    isServing
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-green-100 text-green-800"
                  )}
                >
                  {isServing ? "SERVING" : "READY"}
                </span>
              </div>
            </div>

            <div className="mb-3 space-y-1">
              {order.lines?.slice(0, 3).map((line: any) => (
                <div key={line.id} className="text-sm text-zinc-700">
                  {line.quantity}x {line.name}
                </div>
              ))}
              {order.lines?.length > 3 && (
                <div className="text-xs text-zinc-500">
                  +{order.lines.length - 3} more items
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {canMarkServing && (
                <button
                  onClick={() => {
                    setUpdating(order.id);
                    onMarkServing(order.id);
                    setTimeout(() => setUpdating(null), 1000);
                  }}
                  disabled={updating === order.id}
                  className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating === order.id ? "Updating..." : "Mark Serving"}
                </button>
              )}
              {canMarkServed && (
                <button
                  onClick={() => {
                    setUpdating(order.id);
                    onMarkServed(order.id);
                    setTimeout(() => setUpdating(null), 1000);
                  }}
                  disabled={updating === order.id}
                  className="flex-1 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating === order.id ? "Updating..." : "Mark Served"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Waiter Calls Tab Component
function WaiterCallsTab({
  calls,
  myUserId,
  onAccept,
  onClose,
  acceptingId,
  handlingId,
}: {
  calls: WaiterCall[];
  myUserId: string | null;
  onAccept: (call: WaiterCall) => void;
  onClose: (call: WaiterCall) => void;
  acceptingId: string | null;
  handlingId: string | null;
}) {
  const requestedCalls = calls.filter((c) => c.status === "REQUESTED" || c.status === "OPEN");
  const acceptedCalls = calls.filter((c) => c.status === "ACCEPTED" && c.handledByUserId === myUserId);

  if (requestedCalls.length === 0 && acceptedCalls.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <div className="text-lg font-semibold text-zinc-900 mb-2">No active calls</div>
        <div className="text-sm text-zinc-600">Customer calls will appear here</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requestedCalls.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-zinc-700 mb-2">Waiting for Response</div>
          {requestedCalls.map((call) => (
            <div
              key={call.id}
              className="mb-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900">Table {call.tableNumber}</div>
                  {call.note && (
                    <div className="text-xs text-zinc-600 mt-1">Note: {call.note}</div>
                  )}
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(call.requestedAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => onAccept(call)}
                  disabled={!!acceptingId}
                  className="rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  {acceptingId === call.id ? "Accepting..." : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptedCalls.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-zinc-700 mb-2">You're On The Way</div>
          {acceptedCalls.map((call) => (
            <div
              key={call.id}
              className="mb-3 rounded-xl border-2 border-green-300 bg-green-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900">Table {call.tableNumber}</div>
                  {call.note && (
                    <div className="text-xs text-zinc-600 mt-1">Note: {call.note}</div>
                  )}
                  <div className="text-xs text-zinc-500 mt-1">
                    Accepted: {new Date(call.requestedAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => onClose(call)}
                  disabled={!!handlingId}
                  className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {handlingId === call.id ? "Closing..." : "Mark Done"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type OrderForEdit = {
  id: string;
  notes?: string | null;
  items?: Array<{
    id?: string;
    menuItemId: string;
    name?: string;
    quantity: number;
    unitPriceCents?: number;
    spiceLevel?: string | null;
    spiceOnSide?: boolean;
    allergensAvoid?: string[];
    specialInstructions?: string | null;
  }>;
  lines?: unknown[];
};

function OrderEditForm({
  order,
  restaurantId,
  onSaved,
  onCancel,
  disabled,
  setDisabled,
}: {
  order: OrderForEdit;
  restaurantId: string;
  onSaved: () => void;
  onCancel: () => void;
  disabled: boolean;
  setDisabled: (v: boolean) => void;
}) {
  const lines = order.lines && Array.isArray(order.lines) ? order.lines : (order.items || []);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [menu, setMenu] = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [qtys, setQtys] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    (lines as { menuItemId?: string; id?: string; quantity?: number }[]).forEach((l, i) => {
      const key = l.menuItemId ?? l.id ?? String(i);
      m[key] = Number(l.quantity ?? 0);
    });
    return m;
  });

  // Load menu when form opens
  useEffect(() => {
    if (!restaurantId || menu) return;
    setMenuLoading(true);
    adminMenu(restaurantId)
      .then((data) => {
        setMenu(data);
      })
      .catch(() => {
        // Ignore errors, menu is optional
      })
      .finally(() => {
        setMenuLoading(false);
      });
  }, [restaurantId, menu]);

  const allMenuItems = menu?.categories?.flatMap((c: any) => c.items || []) || [];
  const filteredItems = searchQuery
    ? allMenuItems.filter((item: any) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMenuItems;

  async function handleSave() {
    if (!restaurantId) return;
    setDisabled(true);
    try {
      const payload = {
        notes,
        resetStatus: true, // Reset to PLACED when submitting to kitchen
        lines: (lines as { menuItemId: string; quantity?: number; spiceLevel?: string | null; spiceOnSide?: boolean; allergensAvoid?: string[]; specialInstructions?: string | null }[]).map((l, i) => {
          const key = l.menuItemId ?? (l as { id?: string }).id ?? String(i);
          return {
            menuItemId: l.menuItemId ?? (l as { id?: string }).id,
            quantity: qtys[key] ?? l.quantity ?? 0,
            spiceLevel: l.spiceLevel ?? null,
            spiceOnSide: !!l.spiceOnSide,
            allergensAvoid: Array.isArray(l.allergensAvoid) ? l.allergensAvoid : [],
            specialInstructions: l.specialInstructions ?? null,
          };
        }).filter((l) => (l.quantity ?? 0) > 0),
      };
      await staffUpdateOrder(restaurantId, order.id, payload);
      onSaved();
    } catch (e: any) {
      alert(e?.message || "Failed to save order");
    } finally {
      setDisabled(false);
    }
  }

  function addItem(menuItemId: string) {
    setQtys((prev) => ({
      ...prev,
      [menuItemId]: (prev[menuItemId] || 0) + 1,
    }));
    setSearchQuery("");
  }

  function removeItem(menuItemId: string) {
    setQtys((prev) => {
      const next = { ...prev };
      if (next[menuItemId] > 0) {
        next[menuItemId] = next[menuItemId] - 1;
      }
      return next;
    });
  }

  const orderedItems = (lines as { menuItemId?: string; id?: string; name?: string; quantity?: number; unitPriceCents?: number }[])
    .map((l, i) => {
      const key = l.menuItemId ?? l.id ?? String(i);
      return { ...l, key, qty: qtys[key] ?? l.quantity ?? 0 };
    })
    .filter((l) => l.qty > 0);

  return (
    <div className="mt-3 rounded-lg border-2 border-blue-300 bg-white p-3">
      {/* Ordered Items - On Top */}
      <div className="mb-3">
        <div className="text-xs font-bold text-zinc-900 mb-2">Ordered Items</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {orderedItems.length === 0 ? (
            <div className="text-xs text-zinc-500 py-2">No items in order</div>
          ) : (
            orderedItems.map((l) => {
              const key = l.key!;
              return (
                <div key={key} className="flex items-center justify-between gap-2 bg-zinc-50 px-2 py-1 rounded text-xs">
                  <span className="truncate font-medium text-zinc-900">{l.name || `Item`}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => removeItem(l.menuItemId || key)}
                      className="h-5 w-5 rounded border border-red-300 bg-white text-red-600 hover:bg-red-50 text-[10px] font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-bold text-zinc-900">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => addItem(l.menuItemId || key)}
                      className="h-5 w-5 rounded border border-green-300 bg-white text-green-600 hover:bg-green-50 text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Menu Search - Quick Add */}
      <div className="mb-3 border-t pt-2">
        <div className="text-xs font-bold text-zinc-900 mb-1">Add Items</div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search menu..."
          className="w-full rounded border border-zinc-200 px-2 py-1 text-xs mb-2"
        />
        {searchQuery && (
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {filteredItems.slice(0, 10).map((item: any) => {
              const currentQty = qtys[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-zinc-50 rounded text-xs"
                >
                  <span className="truncate text-zinc-700">{item.name}</span>
                  <div className="flex items-center gap-1">
                    {currentQty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="h-5 w-5 rounded border border-red-300 bg-white text-red-600 hover:bg-red-50 text-[10px]"
                        >
                          −
                        </button>
                        <span className="w-4 text-center font-medium">{currentQty}</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => addItem(item.id)}
                      className="h-5 w-5 rounded border border-green-300 bg-white text-green-600 hover:bg-green-50 text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mb-3 border-t pt-2">
        <div className="text-xs font-bold text-zinc-900 mb-1">Kitchen Notes</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
          rows={2}
          placeholder="Any updates for kitchen…"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || orderedItems.length === 0}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? "Saving…" : "Submit to Kitchen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TableOrdersPanel({
  table,
  orders,
  myUserId,
  onRefresh,
}: {
  table: TableWithStatus;
  orders: TableOrders | null;
  myUserId: string | null;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  async function handleClaimOrder(orderId: string) {
    if (!orders) return;
    setUpdating(true);
    try {
      const user = getUser();
      const restaurantId = user?.restaurantId;
      if (!restaurantId) {
        alert("Restaurant ID not found");
        return;
      }
      await staffClaimOrder(restaurantId, orderId);
      onRefresh();
    } catch (e: any) {
      alert(e?.message || "Failed to claim order");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sticky top-24">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">
            {table.displayName || `Table ${table.tableNumber}`}
          </h3>
          <div className="text-xs text-zinc-600">#{table.tableNumber}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const user = getUser();
              const restaurantId = user?.restaurantId;
              if (!restaurantId) {
                alert("Restaurant ID not found");
                return;
              }
              const params = new URLSearchParams({
                table: table.tableNumber,
              });
              if (table.id) params.set("tableId", table.id);
              window.location.href = `/r/waiter/order?${params.toString()}`;
            }}
            className="rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700"
          >
            + Create Order
          </button>
          <button
            onClick={onRefresh}
            disabled={updating}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300 disabled:opacity-50"
          >
            {updating ? "..." : "↻"}
          </button>
        </div>
      </div>

      {!orders ? (
        <div className="text-center text-sm text-zinc-500 py-8">Loading orders...</div>
      ) : orders.orders.length === 0 ? (
        <div className="text-center text-sm text-zinc-500 py-8">No orders for this table</div>
      ) : (
        <div className="space-y-4">
          {orders.orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-zinc-700">
                  Order #{order.id.slice(0, 8)}
                </div>
                <span
                  className={clsx(
                    "rounded-full px-2 py-1 text-xs font-semibold",
                    (order.status === "NEW" || order.status === "PLACED")
                      ? "bg-blue-100 text-blue-800"
                      : (order.status === "IN_PROGRESS" || order.status === "IN_KITCHEN")
                        ? "bg-yellow-100 text-yellow-800"
                        : (order.status === "DONE" || order.status === "READY")
                          ? "bg-green-100 text-green-800"
                          : order.status === "SERVING"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "SERVED"
                              ? "bg-emerald-200 text-emerald-900"
                              : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {order.status === "DONE" || order.status === "READY" ? "Ready" : 
                   order.status === "PLACED" ? "Placed" :
                   order.status === "IN_KITCHEN" ? "In Kitchen" :
                   order.status === "SERVING" ? "Serving" :
                   order.status === "SERVED" ? "Served" : order.status}
                </span>
              </div>
              <div className="text-xs text-zinc-600 mb-2">
                {new Date(order.createdAt).toLocaleTimeString()}
              </div>
              {order.servingWaiterUserId !== myUserId && order.status !== "SERVED" && (
                <button
                  onClick={() => handleClaimOrder(order.id)}
                  disabled={updating}
                  className="w-full mt-2 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Claim order
                </button>
              )}
              {order.servingWaiterUserId === myUserId && order.status !== "SERVED" && (
                <div className="mt-2 text-xs text-green-700 font-semibold">
                  ✓ You are serving this order
                </div>
              )}
              {order.servingWaiterUserId === myUserId && 
               (order.status === "NEW" || order.status === "PLACED" || order.status === "IN_KITCHEN") && (
                <button
                  type="button"
                  onClick={() => setEditingOrderId(editingOrderId === order.id ? null : order.id)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {editingOrderId === order.id ? "Close editor" : "Edit & submit to kitchen"}
                </button>
              )}
              {editingOrderId === order.id && order.servingWaiterUserId === myUserId && (
                <OrderEditForm
                  order={order}
                  restaurantId={getUser()?.restaurantId ?? ""}
                  onSaved={() => {
                    setEditingOrderId(null);
                    onRefresh();
                  }}
                  onCancel={() => setEditingOrderId(null)}
                  disabled={updating}
                  setDisabled={setUpdating}
                />
              )}
              {(order.status === "DONE" || order.status === "READY") && (order.servingWaiterUserId === myUserId || table.currentWaiter?.userId === myUserId) && (
                <div className="mt-2 space-y-2">
                  {order.status === "READY" && order.servingWaiterUserId !== myUserId && (
                    <button
                      onClick={async () => {
                        const user = getUser();
                        const restaurantId = user?.restaurantId;
                        if (!restaurantId) {
                          alert("Restaurant ID not found");
                          return;
                        }
                        setUpdating(true);
                        try {
                          await markOrderServing(restaurantId, order.id);
                          onRefresh();
                        } catch (e: any) {
                          alert(e?.message || "Failed to mark as serving");
                        } finally {
                          setUpdating(false);
                        }
                      }}
                      disabled={updating}
                      className="w-full rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Mark as Serving
                    </button>
                  )}
                  {(order.status === "DONE" || order.status === "READY" || order.status === "SERVING") && order.servingWaiterUserId === myUserId && (
                    <button
                      onClick={async () => {
                        const user = getUser();
                        const restaurantId = user?.restaurantId;
                        if (!restaurantId) {
                          alert("Restaurant ID not found");
                          return;
                        }
                        setUpdating(true);
                        try {
                          if (order.status === "READY" || order.status === "DONE") {
                            // First mark as serving, then served
                            await markOrderServing(restaurantId, order.id);
                            await markOrderServed(restaurantId, order.id);
                          } else {
                            await markOrderServed(restaurantId, order.id);
                          }
                          onRefresh();
                        } catch (e: any) {
                          alert(e?.message || "Failed to mark as served");
                        } finally {
                          setUpdating(false);
                        }
                      }}
                      disabled={updating}
                      className="w-full rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Mark as served to customer
                    </button>
                  )}
                </div>
              )}
              <div className="mt-3 space-y-2">
                {(order.items || []).map((item: any, idx: number) => (
                  <div key={item.id || idx} className="text-xs text-zinc-700">
                    {item.quantity}x {item.name || item.menuItemId}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs font-bold text-zinc-900">
                Total: ${((order.totalCents || 0) / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
