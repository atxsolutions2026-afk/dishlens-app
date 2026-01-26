import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Security - DishLens" };

export default function SecurityPage() {
  const contact = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";
  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Security</h1>
      <p>
        {COMPANY_NAME} takes reasonable measures to protect {PRODUCT_NAME} and its users.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Transport security (HTTPS) for data in transit.</li>
        <li>Access controls and least-privilege for operational systems.</li>
        <li>Monitoring and logging to help detect abuse and outages.</li>
        <li>Regular dependency updates and vulnerability remediation.</li>
      </ul>

      <h2>Report a vulnerability</h2>
      <p>
        If you believe you have found a security issue, please report it to <strong>{contact}</strong>.
        Include steps to reproduce, affected URLs, and any relevant screenshots or logs.
      </p>

      <p className="text-xs text-zinc-500">
        Please do not publicly disclose security issues until we have had a reasonable time to investigate and address them.
      </p>
    </div>
  );
}
