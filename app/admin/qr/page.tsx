import AppShell from "@/components/AppShell";
import QrGenerating from "@/components/admin/QrGenerating";

export default function QrPage() {
  return (
    <AppShell activeHref="/admin/qr">
      <QrGenerating />
    </AppShell>
  );
}
