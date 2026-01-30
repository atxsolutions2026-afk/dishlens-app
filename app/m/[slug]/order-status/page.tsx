"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicOrder, getTableOrders } from "@/lib/endpoints";
import { loadPersistedSession } from "@/lib/table";
import { clsx } from "clsx";
import Link from "next/link";

type OrderStatus = "PLACED" | "IN_KITCHEN" | "READY" | "SERVING" | "SERVED" | "CANCELLED" | 
                   "NEW" | "IN_PROGRESS" | "DONE"; // Legacy support

type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  spiceLevel?: string | null;
  specialInstructions?: string | null;
};

type Order = {
  id: string;
  status: OrderStatus;
  statusMessage?: string;
  tableNumber: string;
  totalCents: number;
  currency: string;
  servingWaiterUserId?: string | null;
  placedAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  lines: OrderLine[];
  notes?: string | null;
};

function getStatusConfig(status: OrderStatus) {
  const normalizedStatus = 
    status === "NEW" ? "PLACED" :
    status === "IN_PROGRESS" ? "IN_KITCHEN" :
    status === "DONE" ? "READY" :
    status;

  const configs: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PLACED: { label: "Order Placed", color: "text-blue-800", bg: "bg-blue-50", icon: "✓" },
    IN_KITCHEN: { label: "In Kitchen", color: "text-yellow-800", bg: "bg-yellow-50", icon: "👨‍🍳" },
    READY: { label: "Ready", color: "text-green-800", bg: "bg-green-50", icon: "✓" },
    SERVING: { label: "Serving", color: "text-emerald-800", bg: "bg-emerald-50", icon: "🚶" },
    SERVED: { label: "Served", color: "text-emerald-800", bg: "bg-emerald-100", icon: "✓" },
    CANCELLED: { label: "Cancelled", color: "text-red-800", bg: "bg-red-50", icon: "✕" },
  };
  return configs[normalizedStatus] || configs.PLACED;
}

function money(cents: number, currency: string = "USD") {
  return currency === "USD" 
    ? `$${(cents / 100).toFixed(2)}`
    : `${(cents / 100).toFixed(2)} ${currency}`;
}

function OrderStatusPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const tableSessionId = searchParams.get("tableSessionId");
  const urlToken = searchParams.get("t"); // Original table session token from URL

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get menu URL with preserved table session token
  const menuUrl = useMemo(() => {
    let url = `/m/${slug}`;
    const params = new URLSearchParams();
    
    // Try to preserve the original table token from URL
    if (urlToken) {
      params.set("t", urlToken);
    } else {
      // Try to get token from referrer URL or current page URL
      // Check if we came from a menu page with a token
      if (typeof window !== "undefined") {
        try {
          const referrer = document.referrer;
          if (referrer) {
            const referrerUrl = new URL(referrer);
            const referrerToken = referrerUrl.searchParams.get("t");
            if (referrerToken) {
              params.set("t", referrerToken);
            }
          }
        } catch (e) {
          // Ignore errors parsing referrer
        }
      }
      
      // If still no token, check localStorage for persisted session
      // The menu page will load from localStorage anyway, but we try to preserve URL token
      const persisted = loadPersistedSession(slug);
      if (persisted?.tableSessionId && !params.has("t")) {
        // Can't reconstruct original token, but menu page will use localStorage
        // No need to add anything to URL
      }
    }
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }, [slug, urlToken]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const loadOrders = async () => {
      if (cancelled) return;
      try {
        let data: Order[] = [];
        
        if (orderId && token) {
          // Single order view
          const order = await getPublicOrder(slug, orderId, token);
          data = [order as Order];
        } else if (tableSessionId && token) {
          // Table session orders
          data = await getTableOrders(slug, tableSessionId, token);
        } else {
          setError("Missing orderId+token or tableSessionId+token");
          return;
        }

        if (cancelled) return;
        setOrders(data);
        setError(null);

        // Stop polling if all orders are complete
        const allComplete = data.every((o) => 
          o.status === "SERVED" || o.status === "CANCELLED"
        );
        if (allComplete && intervalId) {
          clearInterval(intervalId);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();
    intervalId = setInterval(loadOrders, 5000); // Poll every 5 seconds

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [slug, orderId, token, tableSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900">Loading order status...</div>
          <div className="text-sm text-zinc-600 mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 text-center">
          <div className="text-lg font-semibold text-red-800 mb-2">Error</div>
          <div className="text-sm text-red-600 mb-4">{error}</div>
          <Link
            href={menuUrl}
            className="inline-block rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-semibold"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border p-6 text-center">
          <div className="text-lg font-semibold text-zinc-900 mb-2">No orders found</div>
          <Link
            href={`/m/${slug}`}
            className="inline-block rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-semibold mt-4"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href={menuUrl}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back to Menu
          </Link>
        </div>

        <div className="space-y-6">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            const isComplete = order.status === "SERVED" || order.status === "CANCELLED";

            return (
              <div
                key={order.id}
                className={clsx(
                  "rounded-2xl border-2 bg-white overflow-hidden",
                  config.bg,
                  config.color,
                  "border-current"
                )}
              >
                {/* Status Header */}
                <div className="p-4 border-b border-current/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "h-12 w-12 rounded-full flex items-center justify-center text-2xl font-bold",
                        config.bg,
                        config.color
                      )}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{config.label}</div>
                        <div className="text-xs opacity-75">
                          Table {order.tableNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {money(order.totalCents, order.currency)}
                      </div>
                      <div className="text-xs opacity-75">
                        Order #{order.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="text-sm font-semibold text-zinc-900 mb-3">Your Order</div>
                  <div className="space-y-3">
                    {order.lines.map((line) => (
                      <div key={line.id} className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-900">
                            {line.quantity}x {line.name}
                          </div>
                          {line.spiceLevel && (
                            <div className="text-xs text-zinc-600 mt-0.5">
                              Spice: {line.spiceLevel}
                            </div>
                          )}
                          {line.specialInstructions && (
                            <div className="text-xs text-zinc-600 mt-0.5 italic">
                              Note: {line.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {money(line.unitPriceCents * line.quantity, order.currency)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                      <div className="text-xs font-semibold text-zinc-600 mb-1">Kitchen Notes</div>
                      <div className="text-sm text-zinc-700">{order.notes}</div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 space-y-1 text-xs text-zinc-600">
                    {order.placedAt && (
                      <div>Placed: {new Date(order.placedAt).toLocaleString()}</div>
                    )}
                    {order.readyAt && (
                      <div>Ready: {new Date(order.readyAt).toLocaleString()}</div>
                    )}
                    {order.servedAt && (
                      <div>Served: {new Date(order.servedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>

                {/* Status Progress */}
                {!isComplete && (
                  <div className="px-4 pb-4">
                    <div className="text-xs font-semibold text-zinc-600 mb-2">Order Progress</div>
                    <div className="flex items-center gap-2">
                      {["PLACED", "IN_KITCHEN", "READY", "SERVING", "SERVED"].map((s, i) => {
                        const isActive = 
                          s === order.status ||
                          (s === "PLACED" && (order.status === "NEW" || order.status === "PLACED")) ||
                          (s === "IN_KITCHEN" && (order.status === "IN_PROGRESS" || order.status === "IN_KITCHEN")) ||
                          (s === "READY" && (order.status === "DONE" || order.status === "READY"));
                        const isPast = 
                          order.status === "SERVING" && ["PLACED", "IN_KITCHEN", "READY"].includes(s) ||
                          order.status === "SERVED" && s !== "SERVED";
                        
                        return (
                          <div key={s} className="flex-1 flex items-center">
                            <div className={clsx(
                              "h-2 rounded-full flex-1",
                              isPast || isActive ? "bg-emerald-500" : "bg-zinc-200"
                            )} />
                            {i < 4 && (
                              <div className={clsx(
                                "h-2 w-2 rounded-full ml-1",
                                isPast || isActive ? "bg-emerald-500" : "bg-zinc-200"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
                      <span>Placed</span>
                      <span>Kitchen</span>
                      <span>Ready</span>
                      <span>Serving</span>
                      <span>Served</span>
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div className="px-4 pb-4">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                      <div className="text-sm font-semibold text-emerald-900">
                        Order Complete. Thank you!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment Info */}
        <div className="mt-6 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-zinc-900 mb-2">How to Pay</div>
          <div className="text-sm text-zinc-600">
            Please pay at the counter when you're ready. Your server can also process payment at your table.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-zinc-900">Loading order status...</div>
          <div className="text-sm text-zinc-600 mt-2">Please wait</div>
        </div>
      </div>
    }>
      <OrderStatusPageContent />
    </Suspense>
  );
}
