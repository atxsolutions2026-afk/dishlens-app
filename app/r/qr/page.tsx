import AppShell from "@/components/AppShell";
import QrGenerating from "@/components/admin/QrGenerating";

export default function RestaurantQrPage() {
  return (
    <AppShell activeHref="/r/qr">
      <QrGenerating />
    </AppShell>
  );
}
