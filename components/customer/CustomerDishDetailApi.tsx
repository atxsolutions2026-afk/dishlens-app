"use client";

import DishPreview from "@/components/customer/DishPreview";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPublicOrder, orderLinesFromCart, publicMenu } from "@/lib/endpoints";
import { normalizePublicMenu, UiDish } from "@/lib/menuAdapter";
import { resolveTableSession, getDeviceIdForOrders } from "@/lib/table";
import { useCart } from "@/lib/useCart";
import CartDrawer from "@/components/customer/CartDrawer";
import CustomizeItemSheet from "@/components/customer/CustomizeItemSheet";
import { CartLine } from "@/lib/cart";

export default function CustomerDishDetailApi({
  slug,
  dishId
}: {
  slug: string;
  dishId: string;
}) {
  const [dish, setDish] = useState<UiDish | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [tableNumber, setTableNumber] = useState<string>("");
  const [tableSessionId, setTableSessionId] = useState<string>("");
  const [sessionSecret, setSessionSecret] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customLine, setCustomLine] = useState<CartLine | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = { get: (k: string) => searchParams?.get(k) ?? null };
        const session = await resolveTableSession(slug, params);
        if (cancelled) return;
        if (session) {
          setTableNumber(session.tableNumber);
          setTableSessionId(session.tableSessionId);
          setSessionSecret(session.sessionSecret || "");
        } else {
          setTableNumber("—");
          setTableSessionId("");
          setSessionSecret("");
        }
      } catch {
        if (!cancelled) return;
        setTableNumber("—");
        setTableSessionId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, searchParams]);

  const cart = useCart(slug, tableSessionId || "");

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const payload = await publicMenu(slug);
        const norm = normalizePublicMenu(payload);
        const all = norm.categories.flatMap((c) => c.items);
        setDish(all.find((x) => x.id === dishId) ?? all[0] ?? null);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load dish");
      }
    })();
  }, [slug, dishId]);

  const submitOrder = async () => {
    if (submitting) return;
    if (!tableSessionId || !sessionSecret) {
      window.alert("Missing table session. Refresh or use ?table=1 or scan the QR.");
      return;
    }
    if (cart.lines.length === 0) return;

    try {
      setSubmitting(true);
      await createPublicOrder(slug, {
        tableSessionId,
        sessionSecret,
        deviceId: getDeviceIdForOrders(),
        lines: orderLinesFromCart(cart.lines),
      });
      cart.clear();
      window.alert("Order submitted! The restaurant will see it on the kitchen dashboard.");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to submit order";
      if (msg.includes("expired") || msg.includes("Invalid session")) {
        window.alert("Your session expired. Please rescan the QR code or refresh the page.");
      } else {
        window.alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <CustomizeItemSheet
        open={customOpen}
        title={dish?.name || "Customize"}
        priceLabel={dish ? `${dish.price ?? ""}` : undefined}
        initial={customLine?.modifiers}
        onClose={() => {
          setCustomOpen(false);
          setCustomLine(null);
        }}
        onConfirm={(mods) => {
          if (!dish) return;
          // If editing existing line, update it. Otherwise add a new customized line.
          if (customLine) cart.editLine(customLine.key, { modifiers: mods });
          else
            cart.add(
              {
                menuItemId: dish.id,
                name: dish.name,
                price: Number.isFinite(dish.price) ? dish.price : 0,
                imageUrl: dish.imageUrl ?? null,
              },
              1,
              mods,
            );
          setCustomOpen(false);
          setCustomLine(null);
        }}
      />

      {err && (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}

      <DishPreview
        dish={dish}
        variant="mobile"
        backHref={`/m/${encodeURIComponent(slug)}?table=${encodeURIComponent(tableNumber || "")}`}
        onAddToOrder={() => {
          if (!dish) return;
          // Default flow: open customization before adding
          setCustomLine(null);
          setCustomOpen(true);
        }}
      />

      <CartDrawer
        tableNumber={tableNumber || "—"}
        lines={cart.lines}
        total={cart.total}
        onChangeQty={cart.setQty}
        onEditLine={(line) => {
          setCustomLine(line);
          setCustomOpen(true);
        }}
        onSubmit={submitOrder}
        submitting={submitting}
      />
    </div>
  );
}
