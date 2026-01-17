"use client";

import DishPreview from "@/components/customer/DishPreview";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPublicOrder, publicMenu } from "@/lib/endpoints";
import { normalizePublicMenu, UiDish } from "@/lib/menuAdapter";
import { getOrCreateTable } from "@/lib/table";
import { useCart } from "@/lib/useCart";
import CartDrawer from "@/components/customer/CartDrawer";

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
  const [tableNumber, settableNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = searchParams?.get("t");
    const resolved = getOrCreateTable(slug, t);
    settableNumber(resolved);
  }, [slug, searchParams]);

  const cart = useCart(slug, tableNumber || "T-000");

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
    if (!tableNumber) return;
    if (cart.lines.length === 0) return;

    try {
      setSubmitting(true);
      await createPublicOrder(slug, {
        tableNumber,
        lines: cart.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      });
      cart.clear();
      window.alert("Order submitted! The restaurant will see it on the kitchen dashboard.");
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {err && (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}

      <DishPreview
        dish={dish}
        variant="mobile"
        backHref={`/m/${encodeURIComponent(slug)}?t=${encodeURIComponent(tableNumber || "")}`}
        onAddToOrder={() => {
          if (!dish) return;
          cart.add({ menuItemId: dish.id, name: dish.name, price: Number.isFinite(dish.price) ? dish.price : 0, imageUrl: dish.imageUrl ?? null }, 1);
        }}
      />

      <CartDrawer
        tableNumber={tableNumber || "—"}
        lines={cart.lines}
        total={cart.total}
        onChangeQty={cart.setQty}
        onSubmit={submitOrder}
        submitting={submitting}
      />
    </div>
  );
}
