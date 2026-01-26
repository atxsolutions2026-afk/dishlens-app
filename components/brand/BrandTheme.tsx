"use client";

import { useEffect } from "react";

export type BrandTheme = {
  brand?: string; // primary color (e.g. "#0F766E")
  brandSoft?: string; // subtle backgrounds (e.g. "#ECFDF5")
  brandAccent?: string; // accent (e.g. "#F59E0B")
};

export default function BrandTheme({
  theme,
  children,
}: {
  theme?: BrandTheme;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;

    const setVar = (name: string, value?: string) => {
      if (value) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    };

    setVar("--brand", theme?.brand);
    setVar("--brand-soft", theme?.brandSoft);
    setVar("--brand-accent", theme?.brandAccent);

    return () => {
      root.style.removeProperty("--brand");
      root.style.removeProperty("--brand-soft");
      root.style.removeProperty("--brand-accent");
    };
  }, [theme?.brand, theme?.brandSoft, theme?.brandAccent]);

  return <>{children}</>;
}
