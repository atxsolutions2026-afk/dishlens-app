// app/m/[slug]/page.tsx
import CustomerMenuModern from "@/components/customer/CustomerMenuModern";

export default function Page({ params }: { params: { slug: string } }) {
  return <CustomerMenuModern slug={params.slug} />;
}
