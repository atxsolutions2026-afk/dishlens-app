import AppShell from "@/components/AppShell";
import AdminDashboardApi from "@/components/admin/AdminDashboardApi";

export default function AdminPage() {
  return (
    <AppShell activeHref="/admin">
      <AdminDashboardApi />
    </AppShell>
  );
}
