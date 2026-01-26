import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Data & Retention - DishLens" };

export default function DataPage() {
  const contact = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";

  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Data &amp; Retention</h1>

      <p>
        This page describes, at a high level, the types of data that may be stored in {PRODUCT_NAME} and typical retention practices.
      </p>

      <h2>Data you might see in DishLens</h2>
      <ul>
        <li><strong>Restaurant content:</strong> menu items, prices, photos/videos, branding, and configuration.</li>
        <li><strong>Order data:</strong> order details necessary for restaurants to prepare and fulfill orders.</li>
        <li><strong>Ratings and feedback:</strong> optional user-provided ratings/comments if enabled.</li>
        <li><strong>Operational logs:</strong> technical logs used for security, abuse prevention, and reliability.</li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>Restaurant content is retained while a restaurant maintains an active account and until it is deleted by the restaurant.</li>
        <li>Order records may be retained for operational, accounting, and dispute-resolution purposes.</li>
        <li>Security and reliability logs may be retained for a limited period and then deleted or aggregated.</li>
      </ul>

      <h2>Deletion requests</h2>
      <p>
        Restaurant users can remove menu content from within the admin portal. For additional requests (including data export or account deletion), contact us at <strong>{contact}</strong>.
      </p>

      <p className="text-xs text-zinc-500">
        This page is provided for general information and does not constitute legal advice.
      </p>
    </div>
  );
}
