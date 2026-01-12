import CustomerDishDetailApi from "@/components/customer/CustomerDishDetailApi";

export default async function DishDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const { slug, id } = params;
  return <CustomerDishDetailApi slug={slug} dishId={id} />;
}
