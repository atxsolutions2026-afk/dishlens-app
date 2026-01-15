import AppShell from "@/components/AppShell";
import AdminRatingsApi from "@/components/admin/AdminRatingsApi";

export default function RatingsPage() {
  return (
    <AppShell activeHref="/r/ratings">
      <AdminRatingsApi />
    </AppShell>
  );
}
