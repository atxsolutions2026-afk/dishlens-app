export default function CustomerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Public Customer Module (QR menu) — no login, no dashboard chrome
  return <div className="min-h-screen bg-white">{children}</div>;
}
