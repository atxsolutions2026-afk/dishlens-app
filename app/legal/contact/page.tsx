import { COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Contact - DishLens" };

export default function ContactPage() {
  const email = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";
  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Contact</h1>
      <p>For questions, support requests, or privacy inquiries, contact {COMPANY_NAME} at:</p>
      <ul>
        <li><strong>Email:</strong> {email}</li>
      </ul>
      <p className="text-xs text-zinc-500">
        Tip: set <code>NEXT_PUBLIC_SUPPORT_EMAIL</code> in <code>.env.local</code> to show your real support email across the site.
      </p>
    </div>
  );
}
