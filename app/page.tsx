import AppShell from "@/components/AppShell";
export default function Home() {
  return (
    <AppShell>
      <div className="rounded-3xl border bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">DishLens • UI (API wired)</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Backend: <span className="font-semibold">http://localhost:3000</span> • Frontend: <span className="font-semibold">http://localhost:3001</span>
        </p>
        <div className="mt-4 rounded-2xl bg-zinc-50 border p-4 text-sm text-zinc-700">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Copy <code className="px-1 py-0.5 bg-white border rounded">.env.example</code> to <code className="px-1 py-0.5 bg-white border rounded">.env.local</code></li>
            <li>Set <code className="px-1 py-0.5 bg-white border rounded">NEXT_PUBLIC_RESTAURANT_SLUG</code> to your real restaurant slug</li>
            <li>Go to <code className="px-1 py-0.5 bg-white border rounded">/login</code> for admin features</li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
