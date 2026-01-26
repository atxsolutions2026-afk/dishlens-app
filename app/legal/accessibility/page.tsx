import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Accessibility - DishLens" };

export default function AccessibilityPage() {
  const contact = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";
  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Accessibility</h1>
      <p>
        {COMPANY_NAME} is committed to making {PRODUCT_NAME} accessible to as many people as possible.
      </p>
      <h2>Our approach</h2>
      <ul>
        <li>Keyboard-friendly navigation and visible focus states.</li>
        <li>Readable typography and sufficient contrast where possible.</li>
        <li>Alt text for key images and meaningful labels for controls.</li>
      </ul>
      <h2>Need help?</h2>
      <p>
        If you experience any accessibility barriers, please contact us at <strong>{contact}</strong> and include the page URL and a brief description.
      </p>
    </div>
  );
}
