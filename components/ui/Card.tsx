export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"rounded-3xl border bg-white shadow-soft " + className}>{children}</div>;
}
