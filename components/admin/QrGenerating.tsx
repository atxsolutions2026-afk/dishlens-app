"use client";

import Container from "@/components/layout/Container";
import Panel from "@/components/layout/Panel";

export default function QrGenerating() {
  return (
    <Container>
      <Panel className="p-8 bg-zinc-900 text-white">
        <div className="text-sm font-semibold text-white/80">Generating QR Code...</div>

        <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:items-center">
          <div className="rounded-3xl bg-white p-5">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <rect width="220" height="220" fill="#fff" />
              <g fill="#000">
                <rect x="16" y="16" width="60" height="60" />
                <rect x="144" y="16" width="60" height="60" />
                <rect x="16" y="144" width="60" height="60" />
                <rect x="36" y="36" width="20" height="20" fill="#fff" />
                <rect x="164" y="36" width="20" height="20" fill="#fff" />
                <rect x="36" y="164" width="20" height="20" fill="#fff" />
                <rect x="96" y="36" width="12" height="12" />
                <rect x="112" y="52" width="12" height="12" />
                <rect x="96" y="68" width="12" height="12" />
                <rect x="124" y="84" width="12" height="12" />
                <rect x="92" y="92" width="12" height="12" />
                <rect x="140" y="108" width="12" height="12" />
                <rect x="108" y="116" width="12" height="12" />
                <rect x="92" y="132" width="12" height="12" />
                <rect x="124" y="148" width="12" height="12" />
                <rect x="108" y="164" width="12" height="12" />
                <rect x="140" y="172" width="12" height="12" />
              </g>
            </svg>
          </div>

          <div className="flex-1">
            <div className="text-2xl font-black">QR Code is being prepared</div>
            <div className="mt-2 text-sm text-white/80">
              This will link to the public menu URL (customer view). Next we can wire it to a real QR endpoint.
            </div>

            <div className="mt-6 h-14 w-14 animate-spin rounded-full border-4 border-white/25 border-t-white" />
            <div className="mt-3 text-xs text-white/70">Please wait...</div>
          </div>
        </div>
      </Panel>
    </Container>
  );
}
