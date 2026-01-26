import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/site";

export const metadata = { title: "Cookie Policy - DishLens" };

export default function CookiePolicyPage() {
  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Cookie Policy</h1>
      <p>
        This Cookie Policy explains how {COMPANY_NAME} uses cookies and similar technologies in {PRODUCT_NAME}.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small files stored on your device by your browser. They help sites remember preferences and enable core functionality.
      </p>

      <h2>Cookies we use</h2>
      <ul>
        <li>
          <strong>Essential cookies</strong>: required for the site to function (for example, authentication and security).
        </li>
        <li>
          <strong>Analytics cookies</strong> (optional): used to understand performance and improve the experience. These are used only if you consent.
        </li>
      </ul>

      <h2>Managing your preferences</h2>
      <ul>
        <li>You can clear cookies via your browser settings at any time.</li>
        <li>
          If you previously gave consent, you can revoke it by clearing site data in your browser (which also removes the in-app consent record).
        </li>
      </ul>

      <p className="text-xs text-zinc-500">
        This page is provided for general information and does not constitute legal advice.
      </p>
    </div>
  );
}
