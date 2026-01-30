"use client";

import { Suspense } from "react";
import PlatformLoginClient from "./PlatformLoginClient";

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-zinc-100 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PlatformLoginClient />
    </Suspense>
  );
}
