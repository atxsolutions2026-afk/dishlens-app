"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform/PlatformShell";
import { getUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/roles";
import { getAuditLogs, listPlatformRestaurants } from "@/lib/api/platform";
import type { AuditLog } from "@/lib/api/platform";

const ACTION_LABELS: Record<string, string> = {
  RESTAURANT_CREATED: "Restaurant created",
  RESTAURANT_UPDATED: "Restaurant updated",
  RESTAURANT_SUSPENDED: "Restaurant suspended",
  RESTAURANT_ACTIVATED: "Restaurant activated",
  RESTAURANT_TERMINATED: "Restaurant terminated",
  PLAN_CHANGED: "Plan changed",
  FEATURE_ENABLED: "Features updated",
  FEATURE_DISABLED: "Features disabled",
  BRANDING_UPDATED: "Branding updated",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  IMPERSONATION_STARTED: "Impersonation started",
  IMPERSONATION_ENDED: "Impersonation ended",
};

function formatChangeSummary(log: AuditLog): string {
  const before = log.beforeJson ?? {};
  const after = log.afterJson ?? {};
  const details = log.actionDetails ?? {};
  const type = log.actionType;

  if (type === "FEATURE_ENABLED" || type === "FEATURE_DISABLED") {
    const changes: string[] = [];
    for (const key of Object.keys(after) as (keyof typeof after)[]) {
      const a = after[key];
      const b = before[key];
      if (a !== b && (a === true || a === false)) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
        changes.push(`${label}: ${b === true ? "on" : "off"} → ${a === true ? "on" : "off"}`);
      }
    }
    return changes.length ? changes.join(" · ") : "Features changed";
  }

  if (type === "BRANDING_UPDATED") {
    const parts: string[] = [];
    if (after.primaryColor !== before.primaryColor) parts.push("Primary color");
    if (after.secondaryColor !== before.secondaryColor) parts.push("Secondary color");
    if (after.logoUrl !== before.logoUrl) parts.push("Logo");
    if (after.heroImageUrl !== before.heroImageUrl) parts.push("Hero image");
    if (after.fontFamily !== before.fontFamily) parts.push("Font");
    return parts.length ? parts.join(", ") + " updated" : "Branding changed";
  }

  if (type === "RESTAURANT_CREATED") {
    const name = details.restaurantName ?? after.name;
    return typeof name === "string" ? name : "New restaurant";
  }

  if (type === "RESTAURANT_UPDATED" || type === "RESTAURANT_SUSPENDED") {
    const parts: string[] = [];
    if (after.name !== before.name) parts.push(`Name → "${after.name}"`);
    if (after.status !== before.status) parts.push(`Status → ${after.status}`);
    return parts.length ? parts.join(" · ") : "Restaurant updated";
  }

  if (Object.keys(details).length) {
    const s = JSON.stringify(details);
    return s.length <= 60 ? s : s.slice(0, 57) + "...";
  }

  return "—";
}

export default function PlatformAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

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

    loadData();
  }, [router]);

  async function loadData() {
    try {
      const [logsRes, restaurants] = await Promise.all([
        getAuditLogs({ limit: 100 }),
        listPlatformRestaurants(),
      ]);
      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      const names: Record<string, string> = {};
      for (const r of restaurants) names[r.id] = r.name;
      setRestaurantNames(names);
    } catch (e: unknown) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlatformShell activeHref="/platform/audit-logs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Platform action history · {total} {total === 1 ? "entry" : "entries"}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            No audit logs found
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      When
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Action
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Restaurant
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      What changed
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Who
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/80">
                      <td className="px-5 py-4 text-sm text-zinc-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-zinc-900">
                          {ACTION_LABELS[log.actionType] ?? log.actionType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {log.targetRestaurantId ? (
                          restaurantNames[log.targetRestaurantId] ? (
                            <Link
                              href={`/platform/restaurants/${log.targetRestaurantId}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {restaurantNames[log.targetRestaurantId]}
                            </Link>
                          ) : (
                            <span className="text-sm text-zinc-500" title={log.targetRestaurantId}>
                              Unknown restaurant
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600 max-w-[240px]">
                        {formatChangeSummary(log)}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600">
                        {log.actorPlatformUserId ? (
                          <span className="text-zinc-600" title={log.actorPlatformUserId}>
                            Platform user
                          </span>
                        ) : (
                          <span className="text-zinc-400">Restaurant user</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
