import AppShell from "@/components/AppShell";
import AdminDashboardApi from "@/components/admin/AdminDashboardApi";

export default function RestaurantDashboardPage() {
  return (
    <AppShell activeHref="/r/dashboard">
      <AdminDashboardApi />
    </AppShell>
  );
}
