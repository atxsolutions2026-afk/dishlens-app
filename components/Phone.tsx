import { clsx } from "clsx";
export default function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("mx-auto w-full max-w-[420px]", className)}>
      <div className="rounded-[44px] bg-black p-2 shadow-soft">
        <div className="rounded-[38px] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 text-[12px] font-semibold text-zinc-900">
            <span>9:41</span><span className="text-zinc-500 font-medium">DishLens</span><span className="text-zinc-500 font-medium">􀙇</span>
          </div>
          <div className="h-[1px] bg-zinc-100" />
          <div className="min-h-[760px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
