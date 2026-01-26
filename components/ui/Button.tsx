import { clsx } from "clsx";
export default function Button({ children, variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger"; }) {
  const base = "rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "secondary" ? "bg-white border border-zinc-200 text-zinc-800 hover:border-zinc-300" :
    variant === "danger" ? "bg-red-600 text-white hover:bg-red-700" :
    "bg-brand text-white hover:opacity-95";
  return <button className={clsx(base, styles, className)} {...props}>{children}</button>;
}
