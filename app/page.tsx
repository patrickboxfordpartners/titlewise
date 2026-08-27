import Link from "next/link"
import EmailDemo from "@/components/landing/EmailDemo"
import TitleAnalysisDemo from "@/components/landing/TitleAnalysisDemo"
import WireVerificationDemo from "@/components/landing/WireVerificationDemo"
import ClosingAgentDemo from "@/components/landing/ClosingAgentDemo"
import FAQSection from "@/components/landing/FAQSection"
import StickyMobileCTA from "@/components/landing/StickyMobileCTA"
import { featuredFaqs } from "@/components/landing/faq-data"

const BG = "#111827"
const TEXT = "#EDEEF0"
const MUTED = "rgba(237,238,240,0.5)"
const DIM = "rgba(237,238,240,0.22)"
const RULE = "rgba(237,238,240,0.07)"
const BLUE = "#3b82f6"
const ALT = "rgba(237,238,240,0.025)"

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": featuredFaqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
}

export const metadata = {
  title: "TitleWise — AI Closing Platform for Real Estate Attorneys",
  description: "From intake to clear-to-close. AI tools for title analysis, CD review, wire fraud prevention, and status updates. Built for real estate closing attorneys.",
  openGraph: {
    type: "website" as const,
    title: "TitleWise — AI Closing Platform for Real Estate Attorneys",
    description: "From intake to clear-to-close. 12 AI tools built for real estate closing attorneys.",
    siteName: "TitleWise",
    url: "https://titlewise.app",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TitleWise",
  applicationCategory: "BusinessApplication",
  description: "AI-powered closing platform for real estate attorneys.",
  url: "https://titlewise.app",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "149",
    highPrice: "999",
    priceCurrency: "USD",
    offerCount: "4",
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TitleWise",
  legalName: "Boxford Partners LLC",
  url: "https://titlewise.app",
  logo: "https://titlewise.app/logo.svg",
  description: "AI-powered closing platform for real estate attorneys. From intake to clear-to-close.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "345 California St., Suite 600",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94104",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "hello@titlewise.app",
      contactType: "customer service",
    },
    {
      "@type": "ContactPoint",
      email: "support@titlewise.app",
      contactType: "technical support",
    },
    {
      "@type": "ContactPoint",
      email: "sales@titlewise.app",
      contactType: "sales",
    },
  ],
  sameAs: [
    "https://www.linkedin.com/company/boxfordpartners",
    "https://twitter.com/titlewise_app",
    "https://github.com/boxfordpartners",
    "https://boxfordpartners.com",
  ],
}

export default function HomePage() {
  return (
    <div style={{
      backgroundColor: BG,
      minHeight: "100vh",
      color: TEXT,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      WebkitFontSmoothing: "antialiased",
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <style>{`
        @media (max-width: 640px) { .tw-nav-link { display: none !important; } }
        @media (max-width: 768px) { .tw-footer-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px !important; } }
        @media (max-width: 480px) { .tw-footer-grid { grid-template-columns: 1fr !important; text-align: center; } .tw-footer-grid ul { list-style: none; padding: 0; display: flex; flex-direction: column; align-items: center; } .tw-footer-brand { justify-content: center; } .tw-footer-desc { max-width: 100% !important; text-align: center; } }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: `${BG}f0`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${RULE}`,
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <svg height="28" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "auto" }}>
            <rect x="10" y="0" width="24" height="32" rx="4" fill="rgba(255,255,255,0.35)" />
            <rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB" />
          </svg>
          <span style={{ fontFamily: "inherit", fontSize: "1.125rem", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, color: "#EDEEF0", letterSpacing: "-0.01em" }}>TITLE</span>
            <span style={{ fontWeight: 300, color: "rgba(237,238,240,0.5)" }}>wise</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/pricing" className="tw-nav-link" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Pricing</Link>
          <Link href="/blog" className="tw-nav-link" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Blog</Link>
          <Link href="/demo" className="tw-nav-link" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Demo</Link>
          <Link href="/sign-in" className="tw-nav-link" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Sign in</Link>
          <Link href="/pricing" style={{
            fontSize: "0.875rem", fontWeight: 600, color: "#fff",
            backgroundColor: BLUE, borderRadius: 8,
            padding: "7px 14px", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "96px 32px 80px", maxWidth: 1060, margin: "0 auto" }}>
        <p style={{
          fontSize: "0.75rem", fontWeight: 700, color: BLUE,
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24,
        }}>
          AI Closing Platform
        </p>
        <h1 style={{
          fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.0, color: TEXT,
          maxWidth: 700, marginBottom: 28,
        }}>
          30 minutes back.<br />
          <span style={{ color: BLUE }}>Every file.</span>
        </h1>
        <p style={{
          fontSize: "1.0625rem", color: MUTED,
          lineHeight: 1.7, maxWidth: 520, marginBottom: 40,
        }}>
          AI closing coordinator for real estate attorneys. Document analysis in seconds. Compliance checks automatic. Wire fraud caught before it happens. From intake to clear-to-close.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <Link href="/pricing" style={{
            display: "inline-flex", alignItems: "center",
            backgroundColor: BLUE, color: "#fff",
            fontSize: "0.9375rem", fontWeight: 600,
            padding: "12px 28px", borderRadius: 8,
            textDecoration: "none",
          }}>
            Start free trial
          </Link>
          <Link href="/demo" style={{
            display: "inline-flex", alignItems: "center",
            backgroundColor: "transparent",
            border: `1px solid ${RULE}`,
            color: MUTED, fontSize: "0.9375rem",
            padding: "12px 28px", borderRadius: 8,
            textDecoration: "none",
          }}>
            See the demo
          </Link>
        </div>
        <p style={{ fontSize: "0.8125rem", color: DIM, marginTop: 16 }}>
          Plans from $149/mo · No setup fees · Cancel anytime
        </p>
      </section>

      {/* Stats */}
      <section style={{ borderTop: `1px solid ${RULE}`, padding: "64px 32px" }}>
        <div style={{
          maxWidth: 1060, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "48px 64px",
        }}>
          {[
            {
              stat: "30+",
              label: "minutes saved per file",
              body: "Status updates, document chasing, compliance checks — TitleWise handles the repetitive work so attorneys can focus on the closing.",
            },
            {
              stat: "12",
              label: "AI tools, one platform",
              body: "Title analysis, CD review, wire verification, HOA review, fee estimates, tax proration, and more. Everything closing attorneys need, nothing they don't.",
            },
            {
              stat: "< 30s",
              label: "to analyze a title commitment",
              body: "Upload the commitment, get a structured analysis with exceptions flagged, requirements listed, and red flags surfaced — in seconds.",
            },
          ].map((item) => (
            <div key={item.stat}>
              <p style={{ fontSize: "3.5rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8 }}>
                {item.stat}
              </p>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: BLUE, marginBottom: 10 }}>
                {item.label}
              </p>
              <p style={{ fontSize: "0.9rem", color: MUTED, lineHeight: 1.6 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: `1px solid ${RULE}`, backgroundColor: ALT, padding: "80px 32px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800,
            letterSpacing: "-0.03em", color: TEXT, marginBottom: 56,
          }}>
            Open a matter. Close the deal.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "48px 64px" }}>
            {[
              {
                n: "1",
                title: "Enter the matter once",
                body: "Client name, property address, transaction type. TitleWise loads the closing checklist, sets the timeline, and creates a dedicated matter workspace.",
              },
              {
                n: "2",
                title: "AI handles the analysis",
                body: "Upload title commitments, CDs, HOA docs, or wire instructions. TitleWise reads them, flags issues, and drafts status updates — ready to review and send.",
              },
              {
                n: "3",
                title: "Close with confidence",
                body: "Wire verification cross-checks instructions against prior closings. Compliance checks run automatically. Nothing falls through the cracks.",
              },
            ].map((item) => (
              <div key={item.n}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: DIM, marginBottom: 14, letterSpacing: "0.05em" }}>
                  0{item.n}
                </p>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: TEXT, marginBottom: 12, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: MUTED, lineHeight: 1.65 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demos */}
      <TitleAnalysisDemo />
      <WireVerificationDemo />
      <EmailDemo />
      <ClosingAgentDemo />

      {/* Features list */}
      <section style={{ borderTop: `1px solid ${RULE}`, backgroundColor: ALT, padding: "80px 32px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800,
            letterSpacing: "-0.03em", color: TEXT, marginBottom: 48,
          }}>
            Everything built in.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 48px" }}>
            {[
              ["Title Commitment Analysis", "Exceptions, requirements, and red flags in seconds"],
              ["CD Reviewer", "TRID compliance checks against federal tolerances"],
              ["Wire Fraud Protection", "Cross-matter verification catches fraudulent instructions"],
              ["HOA Document Review", "Fees, restrictions, and pending assessments surfaced automatically"],
              ["Status Update Generator", "AI drafts updates from checklist state — one click to send"],
              ["Fee Estimate Tool", "Accurate closing cost breakdowns for any transaction type"],
              ["Tax Proration Calculator", "Prorated taxes with settlement statement formatting"],
              ["Client Portal", "Shareable read-only checklist view for clients"],
              ["Team Invites", "Invite colleagues with role-based access"],
              ["Email Integration", "Postmark, Gmail, or custom SMTP — sends from your inbox"],
              ["Document Signing", "Integrated e-signatures with milestone auto-close"],
              ["Closing Agent", "Autonomous AI that updates checklists and surfaces blockers"],
            ].map(([title, sub]) => (
              <div key={title} style={{ paddingTop: 18, paddingBottom: 18, borderTop: `1px solid ${RULE}` }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: TEXT, marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: "0.8125rem", color: MUTED }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ borderTop: `1px solid ${RULE}`, padding: "80px 32px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <h2 style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800,
              letterSpacing: "-0.03em", color: TEXT, marginBottom: 12,
            }}>
              Simple pricing. No surprises.
            </h2>
            <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 480 }}>
              One flat monthly rate. All 12 tools included. No per-file fees, no feature gating.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { name: "Solo", price: "$149", note: "1 attorney · All 12 tools" },
              { name: "Small Firm", price: "$349", note: "Up to 5 seats · All 12 tools", highlight: true },
              { name: "Pro", price: "$599", note: "Up to 10 seats · Priority support" },
              { name: "Enterprise", price: "$999", note: "25 seats · Custom onboarding" },
            ].map((plan) => (
              <Link key={plan.name} href="/pricing" style={{ textDecoration: "none" }}>
                <div style={{
                  backgroundColor: plan.highlight ? "rgba(59,130,246,0.08)" : "transparent",
                  border: `1px solid ${plan.highlight ? "rgba(59,130,246,0.25)" : RULE}`,
                  borderRadius: 10, padding: "28px 24px",
                  cursor: "pointer",
                }}>
                  <p style={{ fontSize: "0.8125rem", color: MUTED, marginBottom: 10, fontWeight: 500 }}>{plan.name}</p>
                  <p style={{
                    fontSize: "2rem", fontWeight: 800, color: TEXT,
                    letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 12,
                  }}>
                    {plan.price}
                    <span style={{ fontSize: "0.875rem", fontWeight: 400, color: MUTED }}>/mo</span>
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: DIM, lineHeight: 1.5 }}>{plan.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${RULE}`, padding: "96px 32px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800,
            letterSpacing: "-0.03em", color: TEXT, marginBottom: 16, lineHeight: 1.1,
          }}>
            Start closing smarter.
          </h2>
          <p style={{ fontSize: "0.9375rem", color: MUTED, marginBottom: 36, lineHeight: 1.7 }}>
            14-day free trial. No credit card required. Every tool included from day one.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/pricing" style={{
              display: "inline-flex", alignItems: "center",
              backgroundColor: BLUE, color: "#fff",
              fontSize: "0.9375rem", fontWeight: 600,
              padding: "12px 32px", borderRadius: 8,
              textDecoration: "none",
            }}>
              Start free trial
            </Link>
            <Link href="/demo" style={{
              display: "inline-flex", alignItems: "center",
              backgroundColor: "transparent",
              border: `1px solid ${RULE}`,
              color: MUTED, fontSize: "0.9375rem",
              padding: "12px 28px", borderRadius: 8,
              textDecoration: "none",
            }}>
              See the demo
            </Link>
          </div>
        </div>
      </section>

      <FAQSection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <StickyMobileCTA />

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${RULE}`, backgroundColor: "#111827" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "56px 32px 0" }}>
          <div className="tw-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 48px" }}>

            {/* Brand */}
            <div style={{ paddingBottom: 40 }}>
              <div className="tw-footer-brand" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "auto" }}>
                  <rect x="10" y="0" width="24" height="32" rx="4" fill="rgba(255,255,255,0.35)" />
                  <rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB" />
                </svg>
                <span style={{ fontFamily: "inherit", fontSize: "1rem", lineHeight: 1 }}>
                  <span style={{ fontWeight: 700, color: "#EDEEF0", letterSpacing: "-0.01em" }}>TITLE</span>
                  <span style={{ fontWeight: 300, color: "rgba(237,238,240,0.5)" }}>wise</span>
                </span>
              </div>
              <p className="tw-footer-desc" style={{ marginTop: 16, fontSize: "0.875rem", color: MUTED, lineHeight: 1.65, maxWidth: 280 }}>
                AI-powered closing platform for real estate attorneys. From intake to clear-to-close.
              </p>
              <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20,
                padding: "5px 10px 5px 8px",
                border: `1px solid rgba(237,238,240,0.10)`,
                borderRadius: 6, textDecoration: "none",
                backgroundColor: "rgba(237,238,240,0.03)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: BLUE, flexShrink: 0 }} />
                <span style={{ fontSize: "0.65rem", color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>A Boxford Partners Company</span>
              </a>
            </div>

            {/* Product */}
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Product</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Pricing", "/pricing"], ["Demo", "/demo"], ["Blog", "/blog"], ["Sign in", "/sign-in"], ["Sign up", "/sign-up"]].map(([label, href]) => (
                  <li key={label}><Link href={href} style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Company</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Boxford Partners</a></li>
                <li><a href="mailto:hello@titlewise.app" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Contact</a></li>
                <li><a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>LinkedIn</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Legal</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <li><Link href="/privacy" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Privacy</Link></li>
                <li><Link href="/terms" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 20, paddingBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
            <p style={{ fontSize: "0.75rem", color: DIM, margin: 0 }}>
              &copy; {new Date().getFullYear()} Boxford Partners LLC. All rights reserved.
            </p>
            <a
              href="https://www.linkedin.com/company/boxfordpartners"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Boxford Partners on LinkedIn"
              style={{ color: DIM }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
