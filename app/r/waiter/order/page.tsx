"use client";

import { Suspense } from "react";
import WaiterPos from "@/components/staff/WaiterPos";

export default function WaiterOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold">Loading POS...</div>
          </div>
        </div>
      }
    >
      <WaiterPos />
    </Suspense>
  );
}
