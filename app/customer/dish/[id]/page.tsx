import AppShell from "@/components/AppShell";
import CustomerDishDetailApi from "@/components/customer/CustomerDishDetailApi";

export default function DishDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell activeHref="/customer">
      <CustomerDishDetailApi dishId={params.id} />
    </AppShell>
  );
}
