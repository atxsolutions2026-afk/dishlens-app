import AppShell from "@/components/AppShell";
import CustomerMenuApi from "@/components/customer/CustomerMenuApi";

export default function CustomerPage() {
  return (
    <AppShell activeHref="/customer">
      <CustomerMenuApi />
    </AppShell>
  );
}
