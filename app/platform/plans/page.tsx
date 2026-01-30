"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";
import { listSubscriptionPlans } from "@/lib/api/platform";
import type { SubscriptionPlan } from "@/lib/api/platform";

// Feature bullets per plan (aligned with platform SaaS seed data)
const PLAN_FEATURES: Record<string, string[]> = {
  FREE: [
    "Digital menu (QR scan)",
    "Unlimited menu items",
    "Basic branding",
    "Public menu link",
  ],
  BASIC: [
    "Everything in Free",
    "Waiter call from table",
    "Call notifications",
    "Table management",
  ],
  PRO: [
    "Everything in Basic",
    "Table ordering & cart",
    "Dish ratings",
    "Waiter ratings",
    "Kitchen display screen",
    "Order status tracking",
    "Custom branding",
  ],
  ENTERPRISE: [
    "Everything in Pro",
    "ETA visible to guests",
    "Analytics & reporting",
    "Audit logs access",
    "Priority support",
  ],
};

type PlanTheme = {
  card: string;
  border: string;
  badge: string;
  price: string;
  accent: string;
  icon: string;
};

const PLAN_THEMES: Record<string, PlanTheme> = {
  FREE: {
    card: "bg-white border-zinc-200",
    border: "border-t-zinc-400",
    badge: "bg-zinc-100 text-zinc-700",
    price: "text-zinc-900",
    accent: "text-zinc-600",
    icon: "check",
  },
  BASIC: {
    card: "bg-white border-sky-200",
    border: "border-t-sky-500",
    badge: "bg-sky-50 text-sky-700",
    price: "text-sky-700",
    accent: "text-sky-600",
    icon: "check",
  },
  PRO: {
    card: "bg-white border-violet-300 shadow-lg shadow-violet-100/50",
    border: "border-t-violet-500",
    badge: "bg-violet-100 text-violet-800",
    price: "text-violet-700",
    accent: "text-violet-600",
    icon: "check",
  },
  ENTERPRISE: {
    card: "bg-white border-amber-200",
    border: "border-t-amber-500",
    badge: "bg-amber-50 text-amber-800",
    price: "text-amber-700",
    accent: "text-amber-600",
    icon: "check",
  },
};

const defaultTheme: PlanTheme = {
  card: "bg-white border-zinc-200",
  border: "border-t-zinc-400",
  badge: "bg-zinc-100 text-zinc-600",
  price: "text-zinc-900",
  accent: "text-zinc-600",
  icon: "check",
};

function getTheme(code: string): PlanTheme {
  return PLAN_THEMES[code] ?? defaultTheme;
}

export default function PlatformPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/platform/login");
      return;
    }

    const hasPlatformAccess = user.roles?.some((r: string) => isPlatformRole(r));
    if (!hasPlatformAccess) {
      router.push("/platform/login");
      return;
    }

    loadPlans();
  }, [router]);

  async function loadPlans() {
    try {
      const data = await listSubscriptionPlans();
      setPlans(data);
    } catch (e: unknown) {
      console.error("Failed to load plans:", e);
    } finally {
      setLoading(false);
    }
  }

  // Sort: Free, Basic, Pro, Enterprise
  const order = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  const sortedPlans = [...plans].sort(
    (a, b) => order.indexOf(a.code) - order.indexOf(b.code)
  );

  return (
    <PlatformShell activeHref="/platform/plans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Subscription Plans
          </h1>
          <p className="mt-2 text-base text-zinc-500 max-w-xl mx-auto">
            DishLens tiers for restaurants: from digital-only menus to full ordering, ratings, and analytics.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            <p className="mt-4 text-sm text-zinc-500">Loading plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
            {sortedPlans.map((plan) => {
              const theme = getTheme(plan.code);
              const features = PLAN_FEATURES[plan.code] ?? [];
              const isPro = plan.code === "PRO";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border border-t-4 ${theme.card} ${theme.border} p-6 flex flex-col transition hover:shadow-md`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                        {plan.code}
                      </p>
                      <h2 className="mt-0.5 text-xl font-bold text-zinc-900">
                        {plan.name}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${theme.badge}`}
                    >
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className={`text-3xl font-bold tabular-nums ${theme.price}`}>
                      ${Number(plan.priceMonthly ?? 0).toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm text-zinc-500">/mo</span>
                  </div>

                  {plan.description && (
                    <p className={`text-sm ${theme.accent} mb-5 leading-relaxed`}>
                      {plan.description}
                    </p>
                  )}

                  <ul className="mt-auto space-y-3 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600">
                        <span className={`mt-0.5 shrink-0 text-base font-medium ${theme.accent}`} aria-hidden>
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!plan.active && (
                    <p className="mt-4 text-xs text-zinc-400">
                      Not available for new signups
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-zinc-400">
          Plans define default features when creating or changing a restaurant. Actual features can be overridden per restaurant.
        </p>
      </div>
    </PlatformShell>
  );
}
