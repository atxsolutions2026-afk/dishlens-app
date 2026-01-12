import AppShell from "@/components/AppShell";
import RestaurantBrandingApi from "@/components/admin/RestaurantBrandingApi";

export default function BrandingPage() {
  return (
    <AppShell activeHref="/r/branding">
      <RestaurantBrandingApi />
    </AppShell>
  );
}
