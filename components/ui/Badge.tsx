import { clsx } from "clsx";
export default function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "danger" | "warning"; }) {
  const styles =
    tone === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    tone === "danger" ? "bg-red-50 text-red-700 border-red-100" :
    tone === "warning" ? "bg-amber-50 text-amber-800 border-amber-100" :
    "bg-zinc-100 text-zinc-700 border-zinc-200";
  return <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium", styles)}>{children}</span>;
}
