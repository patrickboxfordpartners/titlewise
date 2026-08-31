import Link from "next/link"
import { featuredFaqs } from "@/components/landing/faq-data"
import FAQSection from "@/components/landing/FAQSection"
import StickyMobileCTA from "@/components/landing/StickyMobileCTA"

const PRIMARY = "#533afd"
const INK = "#0d253d"
const MUTED = "#64748d"
const HAIRLINE = "#e3e8ee"
const CREAM = "#f5e9d4"
const CANVAS_SOFT = "#f6f9fc"

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: featuredFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

export const metadata = {
  title: "TitleWise -- AI Closing Platform for Real Estate Attorneys",
  description:
    "From intake to clear-to-close. AI tools for title analysis, CD review, wire fraud prevention, and status updates. Built for real estate closing attorneys.",
  openGraph: {
    type: "website" as const,
    title: "TitleWise -- AI Closing Platform for Real Estate Attorneys",
    description:
      "From intake to clear-to-close. 12 AI tools built for real estate closing attorneys.",
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
  description:
    "AI-powered closing platform for real estate attorneys. From intake to clear-to-close.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "345 California St., Suite 600",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94104",
    addressCountry: "US",
  },
  contactPoint: [
    { "@type": "ContactPoint", email: "hello@titlewise.app", contactType: "customer service" },
    { "@type": "ContactPoint", email: "support@titlewise.app", contactType: "technical support" },
    { "@type": "ContactPoint", email: "sales@titlewise.app", contactType: "sales" },
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
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        color: INK,
        fontFamily: "Inter, 'SF Pro Display', system-ui, -apple-system, sans-serif",
        fontWeight: 300,
        fontFeatureSettings: '"ss01"',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            height="28"
            viewBox="0 0 36 43"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "auto" }}
          >
            <rect x="10" y="0" width="24" height="32" rx="4" fill="#b9b9f9" />
            <rect x="2" y="8" width="24" height="32" rx="4" fill={PRIMARY} />
          </svg>
          <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>TITLE</span>
            <span style={{ fontWeight: 300, color: MUTED }}>wise</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link
            href="/pricing"
            className="tw-nav-link"
            style={{ fontSize: "0.9375rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="tw-nav-link"
            style={{ fontSize: "0.9375rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}
          >
            Blog
          </Link>
          <Link
            href="/demo"
            className="tw-nav-link"
            style={{ fontSize: "0.9375rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}
          >
            Demo
          </Link>
          <Link
            href="/login"
            className="tw-nav-link"
            style={{ fontSize: "0.9375rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: "0.9375rem",
              fontWeight: 400,
              color: "#fff",
              backgroundColor: PRIMARY,
              borderRadius: 9999,
              padding: "8px 20px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>
      <style>{`
        @media (max-width: 640px) { .tw-nav-link { display: none !important; } }
        @media (max-width: 768px) {
          .tw-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .tw-features-grid { grid-template-columns: 1fr !important; }
          .tw-pricing-grid { grid-template-columns: 1fr 1fr !important; }
          .tw-how-grid { grid-template-columns: 1fr !important; }
          .tw-demo-layout { grid-template-columns: 1fr !important; }
          .tw-footer-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .tw-stats-grid { grid-template-columns: 1fr !important; }
          .tw-pricing-grid { grid-template-columns: 1fr !important; }
          .tw-footer-grid { grid-template-columns: 1fr !important; text-align: center; }
        }
      `}</style>

      {/* Hero with gradient mesh */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* Gradient mesh backdrop */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "-5%",
              right: "-5%",
              height: "70%",
              background:
                "radial-gradient(ellipse 80% 50% at 20% 40%, #f5e9d4 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 40% 30%, #ffb347 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 55% 35%, #e6d5ff 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 70% 30%, #533afd 0%, transparent 50%), radial-gradient(ellipse 40% 40% at 85% 40%, #ea2261 0%, transparent 50%), radial-gradient(ellipse 30% 30% at 95% 35%, #f96bee 0%, transparent 50%)",
              filter: "blur(60px)",
              opacity: 0.35,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,1) 100%)",
            }}
          />
        </div>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "120px 32px 96px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: 680 }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 400,
                color: PRIMARY,
                letterSpacing: "0.1px",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              AI Closing Platform
            </p>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 300,
                letterSpacing: "-1.4px",
                lineHeight: 1.03,
                color: INK,
                marginBottom: 24,
              }}
            >
              The average closing takes 47 days.
              <br />
              <span style={{ color: PRIMARY }}>Yours doesn't have to.</span>
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                fontWeight: 300,
                color: MUTED,
                lineHeight: 1.6,
                maxWidth: 520,
                marginBottom: 40,
              }}
            >
              AI closing coordinator for real estate attorneys. Title analysis in
              30 seconds. TRID compliance checks automatic. Wire fraud caught
              before it happens.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              <Link
                href="/pricing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: PRIMARY,
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 400,
                  padding: "10px 24px",
                  borderRadius: 9999,
                  textDecoration: "none",
                }}
              >
                See pricing
              </Link>
              <Link
                href="/demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  border: `1px solid ${HAIRLINE}`,
                  color: INK,
                  fontSize: "1rem",
                  fontWeight: 400,
                  padding: "10px 24px",
                  borderRadius: 9999,
                  textDecoration: "none",
                }}
              >
                Try the demo
              </Link>
            </div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: MUTED,
                marginTop: 16,
                letterSpacing: "-0.39px",
              }}
            >
              Plans from $149/mo &middot; No setup fees &middot; Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          padding: "72px 32px",
          backgroundColor: "#fff",
        }}
      >
        <div
          className="tw-stats-grid"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "48px 40px",
          }}
        >
          {[
            {
              stat: "$1.2B",
              label: "Lost to wire fraud in 2023",
              body: "The FBI reported $1.2 billion in real estate wire fraud losses. TitleWise cross-references every wire instruction against institutional memory across all your closings.",
            },
            {
              stat: "93%",
              label: "Faster title commitment review",
              body: "What takes 45 minutes by hand takes 30 seconds with TitleWise. Exceptions flagged, requirements listed, red flags surfaced -- structured and ready to act on.",
            },
            {
              stat: "$4,100",
              label: "Average TRID violation penalty",
              body: "Tolerance violations and fee misclassifications add up fast. TitleWise automatically checks Bucket A/B/C classifications and cure amount calculations.",
            },
            {
              stat: "12",
              label: "AI tools in one platform",
              body: "Title analysis, CD review, wire verification, HOA review, fee estimates, tax proration, status updates, and more. Everything closing attorneys need.",
            },
          ].map((item) => (
            <div key={item.stat}>
              <p
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 300,
                  color: INK,
                  letterSpacing: "-1.4px",
                  lineHeight: 1,
                  marginBottom: 8,
                  fontFeatureSettings: '"tnum", "ss01"',
                }}
              >
                {item.stat}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: PRIMARY,
                  marginBottom: 12,
                  letterSpacing: "-0.39px",
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 300,
                  color: MUTED,
                  lineHeight: 1.55,
                }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          backgroundColor: CANVAS_SOFT,
          padding: "96px 32px",
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "-0.64px",
              color: INK,
              marginBottom: 64,
            }}
          >
            Open a matter. Close the deal.
          </h2>
          <div
            className="tw-how-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "48px 56px",
            }}
          >
            {[
              {
                n: "01",
                title: "Create the matter",
                body: "Client name, property address, transaction type. TitleWise generates a state-specific closing checklist and sets up the workspace in seconds.",
              },
              {
                n: "02",
                title: "Let AI handle the analysis",
                body: "Upload title commitments, closing disclosures, HOA docs, or wire instructions. TitleWise reads them, flags issues, and drafts status updates -- ready to review.",
              },
              {
                n: "03",
                title: "Close with confidence",
                body: "Wire verification cross-checks every instruction against prior closings. Compliance runs automatically. Your checklist tracks every step to clear-to-close.",
              },
            ].map((item) => (
              <div key={item.n}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 300,
                    color: MUTED,
                    marginBottom: 16,
                    letterSpacing: "0",
                  }}
                >
                  {item.n}
                </p>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 300,
                    color: INK,
                    marginBottom: 12,
                    lineHeight: 1.4,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 300,
                    color: MUTED,
                    lineHeight: 1.55,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product demo -- dashboard mockup */}
      <section
        style={{
          padding: "96px 32px",
          borderTop: `1px solid ${HAIRLINE}`,
          backgroundColor: "#fff",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="tw-demo-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 400,
                  color: PRIMARY,
                  letterSpacing: "0.1px",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Title Commitment Analysis
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 300,
                  letterSpacing: "-0.64px",
                  color: INK,
                  marginBottom: 20,
                  lineHeight: 1.1,
                }}
              >
                45 minutes of review.
                <br />
                Done in 30 seconds.
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 300,
                  color: MUTED,
                  lineHeight: 1.55,
                  marginBottom: 32,
                }}
              >
                Upload a title commitment and get a structured analysis
                instantly. Schedule B exceptions flagged by severity.
                Requirements categorized. Liens, easements, and conditions that
                need attention before closing -- all surfaced automatically.
              </p>
              <Link
                href="/demo"
                style={{
                  fontSize: "15px",
                  fontWeight: 400,
                  color: PRIMARY,
                  textDecoration: "none",
                }}
              >
                Try it yourself &rarr;
              </Link>
            </div>

            {/* Mockup card */}
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: "rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: `1px solid ${HAIRLINE}`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                />
                <span
                  style={{ fontSize: "13px", fontWeight: 400, color: INK, letterSpacing: "-0.39px" }}
                >
                  Analysis Complete
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    fontWeight: 300,
                    color: MUTED,
                  }}
                >
                  0.8s
                </span>
              </div>

              {/* Exceptions */}
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 400,
                  color: MUTED,
                  textTransform: "uppercase",
                  letterSpacing: "0.1px",
                  marginBottom: 12,
                }}
              >
                Schedule B Exceptions
              </p>
              {[
                { severity: "high", text: "Mortgage lien -- First National Bank, $342,000" },
                { severity: "medium", text: "Easement -- Duke Energy utility access, 15ft" },
                { severity: "low", text: "CC&Rs -- Oakwood HOA, recorded 2019" },
                { severity: "low", text: "Property tax lien -- Mecklenburg Co., current" },
              ].map((ex, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < 3 ? `1px solid ${HAIRLINE}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      marginTop: 6,
                      flexShrink: 0,
                      backgroundColor:
                        ex.severity === "high"
                          ? "#ea2261"
                          : ex.severity === "medium"
                            ? "#f59e0b"
                            : "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 300,
                      color: INK,
                      lineHeight: 1.4,
                      letterSpacing: "-0.42px",
                      fontFeatureSettings: '"tnum", "ss01"',
                    }}
                  >
                    {ex.text}
                  </span>
                </div>
              ))}

              <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#b9b9f9",
                    color: "#4434d4",
                    fontSize: "10px",
                    fontWeight: 400,
                    padding: "4px 8px",
                    borderRadius: 9999,
                    textTransform: "uppercase",
                    letterSpacing: "0.1px",
                  }}
                >
                  4 Exceptions
                </span>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#b9b9f9",
                    color: "#4434d4",
                    fontSize: "10px",
                    fontWeight: 400,
                    padding: "4px 8px",
                    borderRadius: 9999,
                    textTransform: "uppercase",
                    letterSpacing: "0.1px",
                  }}
                >
                  2 Requirements
                </span>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "#fde2ec",
                    color: "#ea2261",
                    fontSize: "10px",
                    fontWeight: 400,
                    padding: "4px 8px",
                    borderRadius: 9999,
                    textTransform: "uppercase",
                    letterSpacing: "0.1px",
                  }}
                >
                  1 Red Flag
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wire fraud demo */}
      <section
        style={{
          padding: "96px 32px",
          borderTop: `1px solid ${HAIRLINE}`,
          backgroundColor: CANVAS_SOFT,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="tw-demo-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 64,
              alignItems: "center",
            }}
          >
            {/* Mockup card -- left side this time */}
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 12,
                padding: 24,
                boxShadow: "rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: `1px solid ${HAIRLINE}`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ea2261",
                  }}
                />
                <span
                  style={{ fontSize: "13px", fontWeight: 400, color: "#ea2261", letterSpacing: "-0.39px" }}
                >
                  Wire Alert
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#991b1b",
                    marginBottom: 8,
                    letterSpacing: "-0.42px",
                  }}
                >
                  Routing number mismatch detected
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#b91c1c",
                    lineHeight: 1.5,
                    letterSpacing: "-0.39px",
                  }}
                >
                  This routing number (021000089) does not match the verified
                  routing number for First National Title across 23 prior
                  closings.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}>
                  Prior verified wires
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 300,
                    color: INK,
                    fontFeatureSettings: '"tnum", "ss01"',
                    letterSpacing: "-0.42px",
                  }}
                >
                  23
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderTop: `1px solid ${HAIRLINE}`,
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}>
                  Confidence score
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#ea2261",
                    fontFeatureSettings: '"tnum", "ss01"',
                    letterSpacing: "-0.42px",
                  }}
                >
                  12% match
                </span>
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 400,
                  color: PRIMARY,
                  letterSpacing: "0.1px",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Wire Fraud Prevention
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 300,
                  letterSpacing: "-0.64px",
                  color: INK,
                  marginBottom: 20,
                  lineHeight: 1.1,
                }}
              >
                $1.2 billion in losses.
                <br />
                Caught in milliseconds.
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 300,
                  color: MUTED,
                  lineHeight: 1.55,
                  marginBottom: 32,
                }}
              >
                Every wire instruction is verified against your institutional
                memory across all prior closings. Routing numbers, account
                numbers, and beneficiary names are cross-referenced
                automatically. Anomalies flagged before a single dollar moves.
              </p>
              <Link
                href="/demo"
                style={{
                  fontSize: "15px",
                  fontWeight: 400,
                  color: PRIMARY,
                  textDecoration: "none",
                }}
              >
                See how it works &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features list */}
      <section
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          backgroundColor: "#fff",
          padding: "96px 32px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "-0.64px",
              color: INK,
              marginBottom: 16,
            }}
          >
            Everything built in.
          </h2>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 300,
              color: MUTED,
              marginBottom: 56,
              maxWidth: 480,
            }}
          >
            12 AI tools and an autonomous closing agent. Every plan includes
            every tool.
          </p>
          <div
            className="tw-features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0 48px",
            }}
          >
            {[
              ["Title Commitment Analysis", "Exceptions, requirements, and red flags in 30 seconds"],
              ["Closing Disclosure Reviewer", "TRID compliance against federal tolerances -- automatic"],
              ["Wire Fraud Prevention", "Cross-matter verification catches fraudulent instructions"],
              ["HOA Document Review", "Fees, restrictions, and pending assessments surfaced instantly"],
              ["Status Update Generator", "AI drafts client updates from checklist state -- one click to send"],
              ["Fee Estimate Tool", "County-specific closing cost breakdowns for any transaction type"],
              ["Tax Proration Calculator", "Per-diem buyer/seller calculations with settlement formatting"],
              ["Client Portal", "Shareable read-only checklist view for your clients"],
              ["Team Invites", "Role-based access for colleagues across matters"],
              ["Email Integration", "Postmark, Gmail, or custom SMTP -- sends from your inbox"],
              ["Closing Checklist", "State-specific checklists auto-generated per transaction"],
              ["Autonomous Closing Agent", "AI that monitors matters, updates checklists, surfaces blockers"],
            ].map(([title, sub]) => (
              <div
                key={title}
                style={{
                  paddingTop: 20,
                  paddingBottom: 20,
                  borderTop: `1px solid ${HAIRLINE}`,
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: INK,
                    marginBottom: 4,
                  }}
                >
                  {title}
                </p>
                <p
                  style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cream band -- social proof / positioning */}
      <section
        style={{
          backgroundColor: CREAM,
          padding: "96px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 300,
              letterSpacing: "-0.96px",
              color: INK,
              marginBottom: 20,
              lineHeight: 1.15,
            }}
          >
            Built for the attorneys who actually close.
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              fontWeight: 300,
              color: "#273951",
              lineHeight: 1.6,
              marginBottom: 40,
            }}
          >
            Not a general legal tool. Not a CRM. TitleWise is purpose-built for
            real estate closing attorneys -- the only platform designed around
            the closing workflow from intake to clear-to-close.
          </p>
          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: PRIMARY,
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 400,
              padding: "10px 24px",
              borderRadius: 9999,
              textDecoration: "none",
            }}
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* Pricing preview */}
      <section
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          padding: "96px 32px",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 300,
                letterSpacing: "-0.64px",
                color: INK,
                marginBottom: 12,
              }}
            >
              Simple pricing. No surprises.
            </h2>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 300,
                color: MUTED,
                maxWidth: 480,
              }}
            >
              One flat monthly rate. All 12 tools included. No per-file fees, no
              feature gating.
            </p>
          </div>
          <div
            className="tw-pricing-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {[
              { name: "Solo", price: "$149", note: "1 attorney &middot; 100 AI generations/mo" },
              {
                name: "Small Firm",
                price: "$349",
                note: "Up to 5 seats &middot; Client portal",
                featured: true,
              },
              { name: "Pro", price: "$599", note: "Up to 10 seats &middot; Priority support" },
              { name: "Enterprise", price: "$999", note: "25 seats &middot; Custom onboarding" },
            ].map((plan) => (
              <Link key={plan.name} href="/pricing" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    backgroundColor: plan.featured ? "#1c1e54" : "#fff",
                    border: `1px solid ${plan.featured ? "#1c1e54" : HAIRLINE}`,
                    borderRadius: 12,
                    padding: "28px 24px",
                    cursor: "pointer",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: plan.featured ? "rgba(255,255,255,0.6)" : MUTED,
                      marginBottom: 10,
                      letterSpacing: "-0.39px",
                    }}
                  >
                    {plan.name}
                  </p>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: 300,
                      color: plan.featured ? "#fff" : INK,
                      letterSpacing: "-0.96px",
                      lineHeight: 1,
                      marginBottom: 12,
                      fontFeatureSettings: '"tnum", "ss01"',
                    }}
                  >
                    {plan.price}
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 300,
                        color: plan.featured ? "rgba(255,255,255,0.5)" : MUTED,
                      }}
                    >
                      /mo
                    </span>
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: plan.featured ? "rgba(255,255,255,0.5)" : MUTED,
                      lineHeight: 1.5,
                      letterSpacing: "-0.39px",
                    }}
                    dangerouslySetInnerHTML={{ __html: plan.note }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          padding: "96px 32px",
          backgroundColor: CANVAS_SOFT,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 300,
              letterSpacing: "-0.96px",
              color: INK,
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Start closing smarter.
          </h2>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 300,
              color: MUTED,
              marginBottom: 36,
              lineHeight: 1.55,
            }}
          >
            Every tool included from day one. Set up in under five minutes.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap" as const,
            }}
          >
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: PRIMARY,
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 400,
                padding: "10px 28px",
                borderRadius: 9999,
                textDecoration: "none",
              }}
            >
              See pricing
            </Link>
            <Link
              href="/demo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#fff",
                border: `1px solid ${HAIRLINE}`,
                color: INK,
                fontSize: "1rem",
                fontWeight: 400,
                padding: "10px 28px",
                borderRadius: 9999,
                textDecoration: "none",
              }}
            >
              Try the demo
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

      {/* Footer -- light per DESIGN.md */}
      <footer
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          backgroundColor: "#fff",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 0" }}>
          <div
            className="tw-footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "0 48px",
            }}
          >
            {/* Brand */}
            <div style={{ paddingBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg
                  height="22"
                  viewBox="0 0 36 43"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: "auto" }}
                >
                  <rect x="10" y="0" width="24" height="32" rx="4" fill="#b9b9f9" />
                  <rect x="2" y="8" width="24" height="32" rx="4" fill={PRIMARY} />
                </svg>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                  <span style={{ fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>
                    TITLE
                  </span>
                  <span style={{ fontWeight: 300, color: MUTED }}>wise</span>
                </span>
              </div>
              <p
                style={{
                  marginTop: 16,
                  fontSize: "13px",
                  fontWeight: 300,
                  color: MUTED,
                  lineHeight: 1.65,
                  maxWidth: 280,
                  letterSpacing: "-0.39px",
                }}
              >
                AI-powered closing platform for real estate attorneys. From
                intake to clear-to-close.
              </p>
              <a
                href="https://boxfordpartners.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 20,
                  padding: "5px 10px 5px 8px",
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 6,
                  textDecoration: "none",
                  backgroundColor: CANVAS_SOFT,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: PRIMARY,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 400,
                    color: MUTED,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  A Boxford Partners Company
                </span>
              </a>
            </div>

            {/* Product */}
            <div style={{ paddingBottom: 40 }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 400,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: MUTED,
                  marginBottom: 16,
                }}
              >
                Product
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {[
                  ["Pricing", "/pricing"],
                  ["Demo", "/demo"],
                  ["Blog", "/blog"],
                  ["Log in", "/login"],
                  ["Sign up", "/signup"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        fontSize: "13px",
                        fontWeight: 300,
                        color: MUTED,
                        textDecoration: "none",
                        letterSpacing: "-0.39px",
                      }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div style={{ paddingBottom: 40 }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 400,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: MUTED,
                  marginBottom: 16,
                }}
              >
                Company
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <li>
                  <a
                    href="https://boxfordpartners.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    Boxford Partners
                  </a>
                </li>
                <li>
                  <a
                    href="https://cal.com/boxfordpartners/titlewise-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    Book a Demo
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@titlewise.app"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/boxfordpartners"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div style={{ paddingBottom: 40 }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 400,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: MUTED,
                  marginBottom: 16,
                }}
              >
                Legal
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <li>
                  <Link
                    href="/privacy"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    style={{
                      fontSize: "13px",
                      fontWeight: 300,
                      color: MUTED,
                      textDecoration: "none",
                      letterSpacing: "-0.39px",
                    }}
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: `1px solid ${HAIRLINE}`,
              paddingTop: 20,
              paddingBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap" as const,
              gap: 16,
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 300,
                color: MUTED,
                margin: 0,
              }}
            >
              &copy; {new Date().getFullYear()} Boxford Partners LLC. All rights
              reserved. &nbsp;&middot;&nbsp; 345 California St., Suite 600, San
              Francisco CA 94104
            </p>
            <a
              href="https://www.linkedin.com/company/boxfordpartners"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Boxford Partners on LinkedIn"
              style={{ color: MUTED }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
