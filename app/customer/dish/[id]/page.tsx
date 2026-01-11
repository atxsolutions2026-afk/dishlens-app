import AppShell from "@/components/AppShell";
import CustomerDishDetailApi from "@/components/customer/CustomerDishDetailApi";

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell activeHref="/customer">
      <CustomerDishDetailApi dishId={id} />
    </AppShell>
  );
}
