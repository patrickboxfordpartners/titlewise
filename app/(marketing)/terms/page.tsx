import { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/logo"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using TitleWise products and services.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo href="/" />
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: May 7, 2026</p>

        <div className="mt-12 space-y-8 text-foreground/80 leading-relaxed">

          <p>These Terms of Service ("Terms") govern your access to and use of the websites and services operated by Boxford Partners LLC DBA TitleWise ("TitleWise," "we," "us," or "our"), including titlewise.app and our SaaS platform. By accessing or using our services, you agree to these Terms.</p>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Services</h2>
            <p>TitleWise provides AI-powered closing tools and workflow automation for real estate attorneys, including document analysis, compliance checks, wire fraud prevention, and related software-as-a-service products. We reserve the right to modify, suspend, or discontinue any service at any time with reasonable notice.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Accounts</h2>
            <p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use. We may suspend or terminate accounts that violate these Terms.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Acceptable Use</h2>
            <p>You agree to use our services only for lawful purposes. You may not use our services to engage in any activity that is illegal, harmful, deceptive, or that interferes with the operation of our infrastructure or the experience of other users.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Payments and Subscriptions</h2>
            <p>Paid services are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as expressly stated in a separate agreement. We use Stripe to process payments - your payment information is subject to Stripe's terms and privacy policy. We reserve the right to change pricing with 30 days' notice to existing subscribers.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Intellectual Property</h2>
            <p>All content, software, and materials on our websites and within our products are owned by or licensed to TitleWise. Nothing in these Terms grants you any right to use our trademarks, logos, or proprietary materials without prior written consent. You retain ownership of any content or data you submit to our services.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Confidentiality</h2>
            <p>We understand that real estate closing documents contain sensitive and confidential information. We treat all documents and data you upload to TitleWise as confidential. We do not share, sell, or use your documents for any purpose other than providing you the requested services.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Disclaimer of Warranties</h2>
            <p>Our services are provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. TitleWise is a productivity tool and does not provide legal advice. You are responsible for verifying all outputs and making independent professional judgments.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, TitleWise shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use our services. Our total liability for any claim arising from these Terms or your use of our services shall not exceed the amount you paid us in the three months preceding the claim.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Indemnification</h2>
            <p>You agree to indemnify and hold harmless TitleWise and its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorney's fees) arising from your violation of these Terms or misuse of our services.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Governing Law</h2>
            <p>These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to its conflict of law provisions. Any disputes shall be resolved exclusively in the state or federal courts located in Suffolk County, Massachusetts.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Changes to These Terms</h2>
            <p>We may revise these Terms at any time. Material changes will be communicated by updating the "Last updated" date and, where appropriate, by email. Continued use of our services after changes take effect constitutes your acceptance of the revised Terms.</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Contact</h2>
            <p>
              Boxford Partners LLC DBA TitleWise<br />
              <a href="mailto:hello@titlewise.app" className="text-primary hover:underline">hello@titlewise.app</a>
            </p>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
