import { clsx } from "clsx";

export default function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-3xl border bg-white shadow-soft", className)}>
      {children}
    </div>
  );
}
