import CustomerMenuApi from "@/components/customer/CustomerMenuApi";

export default async function PublicMenuPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  return <CustomerMenuApi slug={slug} />;
}
