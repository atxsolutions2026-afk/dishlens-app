import AppShell from "@/components/AppShell";
import AdminMenuManager from "@/components/admin/AdminMenuManager";

export default function RestaurantMenuPage() {
  return (
    <AppShell activeHref="/r/menu">
      <AdminMenuManager />
    </AppShell>
  );
}
