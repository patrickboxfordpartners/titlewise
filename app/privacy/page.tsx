import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TitleWise",
  description: "Learn how TitleWise collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: June 16, 2026</p>

      <div className="prose prose-neutral mt-12 max-w-none [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:list-disc [&_li]:leading-relaxed">

        <p>TitleWise ("TitleWise," "we," "us," or "our"), a Boxford Partners LLC product, operates titlewise.app. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it.</p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly to us:</p>
        <ul>
          <li><strong>Account data</strong> — name, email address, firm name, and registration information collected during sign-up.</li>
          <li><strong>Matter data</strong> — real estate transaction details, document information, and related data you enter while using the platform.</li>
          <li><strong>Billing information</strong> — payment details processed through Stripe. We do not store full card numbers.</li>
          <li><strong>Usage data</strong> — pages visited, features used, and interactions within the platform, collected via analytics tools.</li>
          <li><strong>Communications</strong> — emails and messages sent through the platform.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and improve the TitleWise platform</li>
          <li>To process payments and manage your subscription</li>
          <li>To send transactional and account-related communications</li>
          <li>To provide AI-powered document analysis and review features</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2>Third-Party Service Providers</h2>
        <p>We use trusted third-party providers to operate our services. These providers process data only as directed by us:</p>
        <ul>
          <li><strong>Clerk</strong> — authentication and user management</li>
          <li><strong>Neon</strong> — database infrastructure</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>Postmark</strong> — transactional email delivery</li>
          <li><strong>Anthropic</strong> — AI-powered document analysis features</li>
          <li><strong>Vercel</strong> — hosting and infrastructure</li>
        </ul>

        <h2>Cookies and Tracking</h2>
        <p>We use cookies and similar technologies to maintain sessions, remember preferences, and understand how visitors use our platform. You can disable cookies in your browser settings, though some features may not function correctly.</p>

        <h2>Data Retention</h2>
        <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us at the address below.</p>

        <h2>Your Rights</h2>
        <p>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. California residents have additional rights under the CCPA, including the right to know what data we've collected and the right to opt out of any sale of personal information. We do not sell personal information.</p>

        <h2>Children's Privacy</h2>
        <p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from minors.</p>

        <h2>Changes to This Policy</h2>
        <p>We may update this policy from time to time. Material changes will be noted with a new "Last updated" date. Continued use of our services after changes constitutes acceptance.</p>

        <h2>Contact</h2>
        <p>Questions about this policy or requests related to your data:</p>
        <p>
          TitleWise / Boxford Partners LLC<br />
          <a href="mailto:hello@titlewise.app" className="text-blue-600 hover:underline">hello@titlewise.app</a>
        </p>
      </div>
    </div>
  );
}
