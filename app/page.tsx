import Link from "next/link"
import EmailDemo from "@/components/landing/EmailDemo"

const BG = "#0f1219"
const TEXT = "#EDEEF0"
const MUTED = "rgba(237,238,240,0.5)"
const DIM = "rgba(237,238,240,0.22)"
const RULE = "rgba(237,238,240,0.07)"
const BLUE = "#3b82f6"
const ALT = "rgba(237,238,240,0.025)"

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
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "149",
    highPrice: "999",
    priceCurrency: "USD",
    offerCount: "4",
  },
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

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: `${BG}f0`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${RULE}`,
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, letterSpacing: "-0.02em" }}>
            TitleWise
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/pricing" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Pricing</Link>
          <Link href="/demo" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Demo</Link>
          <Link href="/sign-in" style={{ fontSize: "0.875rem", color: MUTED, textDecoration: "none" }}>Sign in</Link>
          <Link href="/pricing" style={{
            fontSize: "0.875rem", fontWeight: 600, color: "#fff",
            backgroundColor: BLUE, borderRadius: 8,
            padding: "7px 16px", textDecoration: "none",
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

      {/* App screenshot */}
      <section style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: `1px solid ${RULE}`,
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}>
            <img src="/screenshots/matter-detail.png" alt="TitleWise matter workspace" style={{ width: "100%", display: "block" }} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: DIM, marginTop: 12, textAlign: "center" }}>
            Matter workspace — checklist, parties, documents, and AI tools in one view
          </p>
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

      {/* Second screenshot */}
      <section style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: `1px solid ${RULE}`,
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}>
            <img src="/screenshots/status-update.png" alt="TitleWise status update generator" style={{ width: "100%", display: "block" }} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: DIM, marginTop: 12, textAlign: "center" }}>
            Status Update Generator — AI drafts the client email from checklist state in seconds
          </p>
        </div>
      </section>

      {/* Email demo */}
      <EmailDemo />

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

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${RULE}`, padding: "40px 32px" }}>
        <div style={{
          maxWidth: 1060, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap" as const, gap: 16,
        }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: TEXT }}>TitleWise</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              ["Pricing", "/pricing"],
              ["Demo", "/demo"],
              ["Privacy", "/privacy"],
              ["Terms", "/(marketing)/terms"],
              ["Sign in", "/sign-in"],
            ].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: "0.8125rem", color: DIM, textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: "0.75rem", color: DIM }}>© 2026 TitleWise / Boxford Partners LLC</span>
        </div>
      </footer>
    </div>
  )
}
