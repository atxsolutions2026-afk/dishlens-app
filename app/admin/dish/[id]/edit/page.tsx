import AppShell from "@/components/AppShell";
import EditDishApi from "@/components/admin/EditDishApi";

export default function EditDishPage() {
  return (
    <AppShell activeHref="/admin/dish/demo/edit">
      <EditDishApi />
    </AppShell>
  );
}
