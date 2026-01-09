import { clsx } from "clsx";

export default function SplitView({
  left,
  right,
  className
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("grid gap-4 lg:grid-cols-[420px_1fr]", className)}>
      <div className="lg:sticky lg:top-24 lg:self-start">{left}</div>
      <div>{right}</div>
    </div>
  );
}
