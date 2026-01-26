import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Privacy Policy - DishLens" };

export default function PrivacyPolicyPage() {
  const contact = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";
  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Effective date:</strong> {new Date().toLocaleDateString()}
      </p>
      <p>
        This Privacy Policy explains how <strong>{COMPANY_NAME}</strong> ("we", "us") collects, uses, and shares information when you use <strong>{PRODUCT_NAME}</strong> (the "Service").
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Information you provide:</strong> for example, contact details if you reach out for support, and any content you submit through the Service.
        </li>
        <li>
          <strong>Restaurant account information:</strong> for restaurant/admin users, we store login credentials (via our auth provider), and business details you configure (menu items, images, branding, table labels, etc.).
        </li>
        <li>
          <strong>Usage data:</strong> basic logs and device information (IP address, browser type, timestamps) used for security, debugging, and service reliability.
        </li>
        <li>
          <strong>Cookies:</strong> we use essential cookies required for the Service to operate, and—only with your permission—analytics cookies to understand performance and improve the experience.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>Provide, operate, and maintain the Service.</li>
        <li>Process orders and display restaurant menus and related content.</li>
        <li>Secure the Service, prevent fraud, and troubleshoot issues.</li>
        <li>Improve features, usability, and performance (including analytics with consent).</li>
        <li>Communicate with you about updates, support, and important notices.</li>
      </ul>

      <h2>How we share information</h2>
      <p>
        We do not sell personal information. We may share information with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> who help us host, deliver, and secure the Service (for example, cloud hosting, monitoring, analytics).
        </li>
        <li>
          <strong>Restaurants</strong> you interact with, where applicable (for example, order details needed to fulfill your order).
        </li>
        <li>
          <strong>Legal/safety</strong> when required to comply with law or protect users, the Service, or our rights.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We retain information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. Restaurants may remove menu content in their admin portal; some logs may remain for security and reliability.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <strong>Cookie choices:</strong> you can manage cookie preferences via the Cookie Policy page. You can also clear site data in your browser.
        </li>
        <li>
          <strong>Access and deletion:</strong> you can request access to or deletion of certain information by contacting us.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        We use reasonable administrative, technical, and physical safeguards designed to protect information. No method of transmission or storage is 100% secure.
      </p>

      <h2>Children's privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will revise the effective date above and may provide additional notice when appropriate.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have questions, contact {COMPANY_NAME} at <strong>{contact}</strong>.
      </p>
      <p className="text-xs text-zinc-500">
        This page is provided for general information and does not constitute legal advice.
      </p>
    </div>
  );
}
