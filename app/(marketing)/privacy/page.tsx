import { Metadata } from "next"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how TITLEwise collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
        <p className="text-xs font-normal uppercase tracking-wider text-primary mt-8">Legal</p>
        <h1 className="mt-3 text-5xl font-light tracking-[-1.4px] text-foreground">Privacy Policy</h1>
        <p className="mt-4 text-sm font-light text-muted-foreground">Last updated: May 7, 2026</p>

        <div className="mt-12 space-y-8 text-foreground font-light leading-relaxed">

          <p>Boxford Partners LLC DBA TITLEwise ("TITLEwise," "we," "us," or "our") operates titlewise.app and the associated AI-powered closing platform. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it.</p>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly to us:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data</strong> - name, email address, firm name, and billing information processed through Stripe.</li>
              <li><strong>Document data</strong> - title commitments, closing disclosures, HOA documents, wire instructions, and other files you upload for analysis.</li>
              <li><strong>Contact and inquiry data</strong> - name, email, and any information submitted through our contact or demo request forms.</li>
              <li><strong>Usage data</strong> - pages visited, features used, and interactions within our platform, collected via analytics tools.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide AI-powered document analysis and closing tools</li>
              <li>To respond to inquiries and deliver services you've requested</li>
              <li>To operate, maintain, and improve our platform</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send transactional communications related to your account</li>
              <li>To comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Document Privacy</h2>
            <p>We take the confidentiality of your legal documents seriously. Documents you upload are used solely to provide analysis results to you. We do not use your documents to train AI models, share them with other users, or sell them to third parties. Documents are encrypted in transit and at rest.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Third-Party Service Providers</h2>
            <p className="mb-3">We use trusted third-party providers to operate our services. These providers process data only as directed by us:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clerk</strong> - authentication and user management</li>
              <li><strong>Stripe</strong> - payment processing (we do not store full card numbers)</li>
              <li><strong>Postmark</strong> - transactional email delivery</li>
              <li><strong>Anthropic</strong> - AI-powered document analysis features</li>
              <li><strong>Vercel</strong> - hosting and infrastructure</li>
              <li><strong>Neon</strong> - database infrastructure</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to maintain sessions, remember preferences, and understand how visitors use our site. You can disable cookies in your browser settings, though some features may not function correctly.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. Document analysis results are retained for your reference in your account history. You may request deletion of your data at any time by contacting us at the address below.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Your Rights</h2>
            <p>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. California residents have additional rights under the CCPA, including the right to know what data we've collected and the right to opt out of any sale of personal information. We do not sell personal information.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Children's Privacy</h2>
            <p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from minors.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Material changes will be noted with a new "Last updated" date. Continued use of our services after changes constitutes acceptance.</p>
          </div>

          <div>
            <h2 className="mb-3 text-[22px] font-light tracking-[-0.22px] text-foreground">Contact</h2>
            <p>Questions about this policy or requests related to your data:</p>
            <p className="mt-2">
              Boxford Partners LLC DBA TITLEwise<br />
              <a href="mailto:hello@titlewise.app" className="text-primary hover:underline">hello@titlewise.app</a>
            </p>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
