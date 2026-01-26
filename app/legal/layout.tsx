import Link from "next/link";
import Image from "next/image";
import LegalFooter from "@/components/LegalFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55 sticky top-0 z-50">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <Image src="/icon/icon-192.png" alt="DishLens" width={32} height={32} className="rounded-xl" />
          <div className="flex-1">
            <div className="font-semibold">DishLens Legal</div>
            <div className="text-xs text-zinc-500">Privacy, terms, cookies, and more</div>
          </div>
          <Link href="/" className="text-sm font-semibold text-brand">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>

      <LegalFooter />
    </div>
  );
}
