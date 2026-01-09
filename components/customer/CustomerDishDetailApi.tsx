"use client";

import Container from "@/components/layout/Container";
import DishPreview from "@/components/customer/DishPreview";
import Panel from "@/components/layout/Panel";
import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { useEffect, useState } from "react";
import { publicMenu } from "@/lib/endpoints";
import { restaurantSlug } from "@/lib/env";
import { normalizePublicMenu, UiDish } from "@/lib/menuAdapter";

export default function CustomerDishDetailApi({ dishId }: { dishId: string }) {
  const [dish, setDish] = useState<UiDish | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const payload = await publicMenu(restaurantSlug());
        const norm = normalizePublicMenu(payload);
        const all = norm.categories.flatMap((c) => c.items);
        setDish(all.find((x) => x.id === dishId) ?? all[0] ?? null);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load dish");
      }
    })();
  }, [dishId]);

  return (
    <Container>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/customer"
          className="rounded-2xl border border-zinc-200 bg-white p-2"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5 text-zinc-800" />
        </Link>
        <div>
          <div className="text-xl font-black">Dish Detail</div>
          <div className="text-sm text-zinc-600">Watch the video & decide confidently</div>
        </div>
      </div>

      {err && (
        <Panel className="mb-4 p-4 border-red-200 bg-red-50 text-sm text-red-800">
          {err}
        </Panel>
      )}

      <DishPreview dish={dish} variant="mobile" />
    </Container>
  );
}
