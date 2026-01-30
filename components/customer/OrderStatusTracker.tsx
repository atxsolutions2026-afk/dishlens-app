"use client";

import { useEffect, useState } from "react";
import { getPublicOrder } from "@/lib/endpoints";
import { clsx } from "clsx";

type OrderStatus = "PLACED" | "IN_KITCHEN" | "READY" | "SERVING" | "SERVED" | "CANCELLED" | 
                   "NEW" | "IN_PROGRESS" | "DONE"; // Legacy support

type OrderStatusData = {
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
  lines?: Array<{
    id: string;
    name: string;
    quantity: number;
    spiceLevel?: string | null;
    specialInstructions?: string | null;
  }>;
};

export default function OrderStatusTracker({
  slug,
  orderId,
  orderToken,
  onClose,
}: {
  slug: string;
  orderId: string;
  orderToken: string;
  onClose?: () => void;
}) {
  const [order, setOrder] = useState<OrderStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await getPublicOrder(slug, orderId, orderToken);
        if (cancelled) return;
        setOrder(data as OrderStatusData);
        setError(null);
        // Stop polling if order is completed or cancelled
        const finalStatuses = ["SERVED", "CANCELLED"];
        if (finalStatuses.includes(data.status)) {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load order status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    intervalId = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [slug, orderId, orderToken]);

  if (loading && !order) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 bg-white border-b shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="text-sm text-zinc-600">Loading order status...</div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 bg-red-50 border-b border-red-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-red-800">{error}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800 text-sm font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const getStatusConfig = (status: OrderStatus) => {
    // Map legacy statuses to new ones
    const normalizedStatus = 
      status === "NEW" ? "PLACED" :
      status === "IN_PROGRESS" ? "IN_KITCHEN" :
      status === "DONE" ? "READY" :
      status;

    const configs: Record<string, { label: string; color: string; bg: string }> = {
      PLACED: { label: "Order received", color: "text-blue-800", bg: "bg-blue-100" },
      IN_KITCHEN: { label: "Preparing your order", color: "text-yellow-800", bg: "bg-yellow-100" },
      READY: { label: "Ready - On the way to your table", color: "text-green-800", bg: "bg-green-100" },
      SERVING: { label: "Serving - Your waiter is bringing it", color: "text-emerald-800", bg: "bg-emerald-100" },
      SERVED: { label: "Served to your table", color: "text-emerald-800", bg: "bg-emerald-100" },
      CANCELLED: { label: "Order cancelled", color: "text-red-800", bg: "bg-red-100" },
    };
    return configs[normalizedStatus] || configs.PLACED;
  };

  const config = getStatusConfig(order.status);
  const isComplete = order.status === "SERVED" || order.status === "CANCELLED";

  return (
    <div className={clsx(
      "sticky top-0 z-50 border-b shadow-md transition-colors",
      config.bg,
      config.color
    )}>
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {order.statusMessage || config.label}
              </span>
              <span className="text-xs opacity-75">
                Table {order.tableNumber}
              </span>
              {order.lines && order.lines.length > 0 && (
                <span className="text-xs opacity-75">
                  • {order.lines.length} item{order.lines.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {order.lines && order.lines.length > 0 && (
              <div className="mt-1 text-xs opacity-75 line-clamp-1">
                {order.lines.map((l, i) => `${l.quantity}x ${l.name}`).join(", ")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">
              ${((order.totalCents || 0) / 100).toFixed(2)}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 text-xs font-semibold opacity-75 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {isComplete && (
          <div className="mt-2 text-xs opacity-75">
            Order complete. Thank you!
          </div>
        )}
      </div>
    </div>
  );
}
