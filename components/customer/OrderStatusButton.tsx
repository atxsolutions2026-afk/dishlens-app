"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  lines?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

export default function OrderStatusButton({
  slug,
  orderId,
  orderToken,
  tableSessionId,
}: {
  slug: string;
  orderId: string;
  orderToken: string;
  tableSessionId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<OrderStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!orderId || !orderToken) {
      console.log("[OrderStatusButton] Missing orderId or orderToken:", { orderId, orderToken });
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await getPublicOrder(slug, orderId, orderToken);
        if (!cancelled) {
          setOrder(data as OrderStatusData);
          setLoading(false);
          
          // Stop polling if order is complete
          if (data?.status === "SERVED" || data?.status === "CANCELLED") {
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("[OrderStatusButton] Failed to fetch order status:", e);
          setLoading(false);
          // Don't clear order on error - keep showing last known state
        }
      }
    };

    // Initial load
    poll();
    
    // Poll every 5 seconds
    intervalId = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [slug, orderId, orderToken]);

  const getStatusConfig = (status: OrderStatus) => {
    // Map legacy statuses to new ones
    const normalizedStatus = 
      status === "NEW" ? "PLACED" :
      status === "IN_PROGRESS" ? "IN_KITCHEN" :
      status === "DONE" ? "READY" :
      status;

    const configs: Record<string, { label: string; color: string; bg: string; border: string }> = {
      PLACED: { label: "Order received", color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-300" },
      IN_KITCHEN: { label: "Preparing", color: "text-yellow-800", bg: "bg-yellow-50", border: "border-yellow-300" },
      READY: { label: "Ready", color: "text-green-800", bg: "bg-green-50", border: "border-green-300" },
      SERVING: { label: "Serving", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-300" },
      SERVED: { label: "Served", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-300" },
      CANCELLED: { label: "Cancelled", color: "text-red-800", bg: "bg-red-50", border: "border-red-300" },
    };
    return configs[normalizedStatus] || configs.PLACED;
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  if (loading && !order) {
    return (
      <div className="rounded-full border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 animate-pulse">
        Loading order...
      </div>
    );
  }

  if (!order) return null;

  const config = getStatusConfig(order.status);
  const isComplete = order.status === "SERVED" || order.status === "CANCELLED";

  const orderStatusUrl = `/m/${slug}/order-status?orderId=${orderId}&token=${orderToken}${tableSessionId ? `&tableSessionId=${tableSessionId}` : ""}`;

  return (
    <Link
      href={orderStatusUrl}
      className={clsx(
        "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition hover:opacity-80",
        config.bg,
        config.color,
        config.border
      )}
    >
      <span className="flex items-center gap-1.5">
        <span>📦</span>
        <span>{order.statusMessage || config.label}</span>
        {order.lines && order.lines.length > 0 && (
          <span className="opacity-75">
            • {order.lines.length} item{order.lines.length !== 1 ? "s" : ""}
          </span>
        )}
        {!isComplete && (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        )}
      </span>
    </Link>
  );
}
