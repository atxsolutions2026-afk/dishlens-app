"use client";

import Container from "@/components/layout/Container";
import DishPreview from "@/components/customer/DishPreview";
import { useEffect, useState } from "react";
import { publicMenu } from "@/lib/endpoints";
import { normalizePublicMenu, UiDish } from "@/lib/menuAdapter";

export default function CustomerDishDetailApi({
  slug,
  dishId
}: {
  slug: string;
  dishId: string;
}) {
  const [dish, setDish] = useState<UiDish | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <Container className="max-w-3xl px-0 sm:px-4">
      {err && (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err}
        </div>
      )}

      <DishPreview dish={dish} variant="mobile" backHref={`/m/${encodeURIComponent(slug)}`} />
    </Container>
  );
}
