import AppShell from "@/components/AppShell";

export default function RestaurantLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Restaurant Module: dashboard / uploads / QR codes (requires login).
  // Individual pages handle auth redirect based on token.
  return <>{children}</>;
}
