import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Terms of Service - DishLens" };

export default function TermsPage() {
  const contact = SUPPORT_EMAIL || "[set NEXT_PUBLIC_SUPPORT_EMAIL]";

  return (
    <div className="prose prose-zinc max-w-none">
      <h1>Terms of Service</h1>
      <p>
        <strong>Effective date:</strong> {new Date().toLocaleDateString()}
      </p>
      <p>
        These Terms of Service ("Terms") govern your use of <strong>{PRODUCT_NAME}</strong> (the "Service"), operated by <strong>{COMPANY_NAME}</strong> ("we", "us"). By accessing or using the Service, you agree to these Terms.
      </p>

      <h2>Who may use the Service</h2>
      <p>
        You may use the Service only if you can form a binding contract and comply with these Terms and all applicable laws.
      </p>

      <h2>Restaurant accounts</h2>
      <ul>
        <li>
          Restaurant/admin features may require an account. You are responsible for maintaining the confidentiality of credentials and for all activity under your account.
        </li>
        <li>
          You agree to provide accurate information and to update it as needed.
        </li>
      </ul>

      <h2>Customer experiences (QR / menu / ordering)</h2>
      <p>
        The Service may display menus, pricing, photos, videos, and allow submitting orders or requests to a restaurant. Restaurants are responsible for their menu content, pricing, allergen information, and fulfillment.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service in a way that violates any law or regulation.</li>
        <li>Attempt to gain unauthorized access to any system or data.</li>
        <li>Upload malicious code, exploit vulnerabilities, or disrupt the Service.</li>
        <li>Post or upload content that infringes intellectual property or is unlawful or abusive.</li>
      </ul>

      <h2>Content and intellectual property</h2>
      <ul>
        <li>
          The Service and its underlying software, design, and trademarks are owned by {COMPANY_NAME} or its licensors.
        </li>
        <li>
          Restaurants retain rights to their content (menu text, images, branding) and grant us a license to host and display it for providing the Service.
        </li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        The Service may rely on third-party services (hosting, analytics, storage, payment, etc.). We are not responsible for third-party services, and your use may be subject to their terms.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available". To the maximum extent permitted by law, we disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {COMPANY_NAME} will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues, data, or goodwill, arising from or related to your use of the Service.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate access to the Service if you violate these Terms or if necessary to protect the Service, users, or our rights.
      </p>

      <h2>Changes to the Service or Terms</h2>
      <p>
        We may update the Service and these Terms from time to time. We will update the effective date above and may provide additional notice when appropriate. Continued use of the Service after changes means you accept the updated Terms.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these Terms? Contact {COMPANY_NAME} at <strong>{contact}</strong>.
      </p>
      <p className="text-xs text-zinc-500">
        This page is provided for general information and does not constitute legal advice.
      </p>
    </div>
  );
}
