"use client";

import Image from "next/image";
import Link from "next/link";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@atxit.solutions";
const LOCATION = process.env.NEXT_PUBLIC_COMPANY_LOCATION || "Austin, TX";

const groups = [
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Contact", href: "/legal/contact" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
  {
    title: "Product",
    items: [
      { label: "Security", href: "/legal/security" },
      { label: "Data & Retention", href: "/legal/data" },
    ],
  },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-md py-1.5 text-[13px] text-zinc-600 transition
                 hover:text-brand focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
    </Link>
  );
}

function MobileAccordion() {
  return (
    <div className="mt-6 sm:hidden" aria-label="Footer navigation">
      {groups.map((g) => (
        <details key={g.title} className="group border-t border-zinc-200 py-2">
          <summary
            className="flex cursor-pointer list-none items-center justify-between rounded-md py-2 text-sm font-semibold text-zinc-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {g.title}
            <span
              className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition group-open:rotate-180"
              aria-hidden="true"
            >
              ▾
            </span>
          </summary>
          <ul role="list" className="pb-2 pl-1">
            {g.items.map((it) => (
              <li key={it.href} className="py-1">
                <FooterLink href={it.href} label={it.label} />
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

export default function LegalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-zinc-200 bg-white"
      role="contentinfo"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      {/* Modern container + subtle top padding */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top grid: Brand + link columns (tight, centered, modern) */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-5">
            <div className="flex items-start gap-3">
              <div className="relative h-9 w-9 shrink-0">
                <Image
                  src="/icon/icon-192.png"
                  alt="DishLens logo"
                  fill
                  className="rounded-lg object-contain"
                  sizes="36px"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  DishLens <span className="font-medium text-zinc-500">by</span>{" "}
                  <span className="text-zinc-700">ATX IT Solutions</span>
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Visual-first menus &amp; ordering.
                </p>

                <div className="mt-4 text-sm text-zinc-600">
                  <p className="truncate">
                    <span className="font-medium text-zinc-700">Support:</span>{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-zinc-700">Location:</span>{" "}
                    {LOCATION}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop/tablet links: 3 columns, aligned, not “far right” */}
          <nav
            className="hidden sm:block lg:col-span-7"
            aria-label="Footer navigation"
          >
            <div className="grid grid-cols-3 gap-8 lg:justify-items-start">
              {groups.map((g) => (
                <div key={g.title}>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {g.title}
                  </h3>
                  <ul role="list" className="mt-3 space-y-2">
                    {g.items.map((it) => (
                      <li key={it.href}>
                        <FooterLink href={it.href} label={it.label} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Mobile links (accordion) */}
        <MobileAccordion />

        {/* Bottom bar (modern: compact + aligned) */}
        <div className="mt-10 border-t border-zinc-200 pt-6">
          <div className="flex flex-col gap-2 text-[13px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} ATX IT Solutions. All rights reserved.</p>
            <p className="text-zinc-500">
              By using this site, you agree to our{" "}
              <Link
                href="/legal/terms"
                className="hover:text-brand underline-offset-2 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/privacy"
                className="hover:text-brand underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
