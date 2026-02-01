import Link from "next/link";
import { restaurantSlug } from "@/lib/env";

export default function Home() {
  const slug = restaurantSlug();
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-black tracking-tight">DishLens</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Customer QR Menu (no login), Restaurant Dashboard, Waiter, Kitchen, and Platform admin — use the links below.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Customer (no login)</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/m/${encodeURIComponent(slug)}`}
              className="rounded-2xl border px-4 py-3 font-semibold hover:bg-zinc-50"
            >
              Open Customer Menu
              <div className="mt-1 text-xs font-normal text-zinc-500 break-all">/m/{slug}</div>
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Login</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Link
              href="/platform/login"
              className="rounded-2xl border px-4 py-3 font-semibold hover:bg-zinc-50"
            >
              Platform Login
              <div className="mt-1 text-xs font-normal text-zinc-500">/platform/login</div>
            </Link>
            <Link
              href="/r/login"
              className="rounded-2xl border px-4 py-3 font-semibold hover:bg-zinc-50"
            >
              Restaurant Login
              <div className="mt-1 text-xs font-normal text-zinc-500">Admin &amp; kitchen /r/login</div>
            </Link>
            <Link
              href="/r/login"
              className="rounded-2xl border px-4 py-3 font-semibold hover:bg-zinc-50"
            >
              Waiter Login
              <div className="mt-1 text-xs font-normal text-zinc-500">Same page, waiter role → /r/waiter</div>
            </Link>
          </div>
        </section>

        <div className="mt-8 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
          <div className="font-bold">Setup</div>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>
              Copy <code className="px-1 py-0.5 bg-white border rounded">.env.example</code> to{" "}
              <code className="px-1 py-0.5 bg-white border rounded">.env.local</code>
            </li>
            <li>
              Set <code className="px-1 py-0.5 bg-white border rounded">NEXT_PUBLIC_API_BASE_URL</code> to your API
            </li>
            <li>
              Set <code className="px-1 py-0.5 bg-white border rounded">NEXT_PUBLIC_RESTAURANT_SLUG</code> for the demo link above
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
