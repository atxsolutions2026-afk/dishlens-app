// app/customer/page.tsx
type PageProps = {
  searchParams?: { slug?: string };
};

export default function Page({ searchParams }: PageProps) {
  const slug = searchParams?.slug ?? "";

  // TODO: use slug (or show an error if missing)
  return (
    <main>
      <h1>Customer</h1>
      <p>slug: {slug || "—"}</p>
    </main>
  );
}
