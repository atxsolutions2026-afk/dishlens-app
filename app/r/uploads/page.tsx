import AppShell from "@/components/AppShell";
import EditDishApi from "@/components/admin/EditDishApi";

export default function UploadsPage() {
  return (
    <AppShell activeHref="/r/uploads">
      <EditDishApi />
    </AppShell>
  );
}
