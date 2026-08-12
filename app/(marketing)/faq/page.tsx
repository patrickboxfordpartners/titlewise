import type { Metadata } from "next"
import Link from "next/link"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"
import FAQCategoryNav from "@/components/landing/FAQCategoryNav"
import { faqs } from "@/components/landing/faq-data"

export const metadata: Metadata = {
  title: "FAQ — TitleWise",
  description: "Answers to common questions about TitleWise: AI document review for real estate closing attorneys, pricing, security, accuracy, and how it compares to existing software.",
  alternates: { canonical: "https://titlewise.app/faq" },
  openGraph: {
    type: "website",
    title: "FAQ — TitleWise",
    description: "Answers to common questions about TitleWise: AI document review for real estate closing attorneys.",
    url: "https://titlewise.app/faq",
    siteName: "TitleWise",
  },
}

const categories = Array.from(new Set(faqs.map((f) => f.category)))

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

export default function FAQPage() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "var(--font-sans)", WebkitFontSmoothing: "antialiased" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <LandingNav />

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 32px" }}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      </div>

      {/* Hero */}
      <section style={{ backgroundColor: "var(--section-dark)", padding: "96px 32px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--primary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            FAQ
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#EDEEF0",
            marginBottom: 20,
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(237,238,240,0.55)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            Everything you need to know about TitleWise — AI document review built for real estate closing attorneys.
          </p>
        </div>
      </section>

      {/* Category nav */}
      <FAQCategoryNav categories={categories} />

      {/* FAQ sections by category */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 32px 80px" }}>
        {categories.map((cat) => {
          const items = faqs.filter((f) => f.category === cat)
          const anchor = cat.toLowerCase().replace(/\s+&?\s*/g, "-")
          return (
            <section
              key={cat}
              id={anchor}
              style={{ marginBottom: 64, scrollMarginTop: 120 }}
            >
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.375rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
                marginBottom: 32,
                paddingBottom: 16,
                borderBottom: "2px solid var(--primary)",
                display: "inline-block",
              }}>
                {cat}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {items.map((faq, i) => (
                  <details
                    key={faq.value}
                    style={{
                      borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <summary style={{
                      padding: "20px 0",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      cursor: "pointer",
                      listStyle: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}>
                      <span>{faq.question}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{ flexShrink: 0, color: "var(--muted-foreground)" }}
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <p style={{
                      padding: "0 0 20px",
                      fontSize: "0.9375rem",
                      lineHeight: 1.8,
                      color: "var(--muted-foreground)",
                      margin: 0,
                      maxWidth: 680,
                    }}>
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )
        })}

        {/* Still have questions */}
        <div style={{
          marginTop: 16,
          padding: "40px 48px",
          backgroundColor: "var(--canvas-cream, #f5e9d4)",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 12,
          }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: "0.9375rem", color: "var(--muted-foreground)", lineHeight: 1.7, marginBottom: 24 }}>
            Reach out and we will get back to you within one business day.
          </p>
          <a
            href="mailto:hello@titlewise.app"
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: "0.875rem",
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: 9999,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Contact us
          </a>
        </div>
      </div>

      {/* Bottom CTA */}
      <section style={{
        backgroundColor: "var(--section-dark)",
        padding: "72px 32px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{
            fontSize: "0.6875rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--primary)",
            marginBottom: 20,
          }}>
            TitleWise
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1.1,
            color: "#EDEEF0",
            marginBottom: 20,
          }}>
            Ready to close faster?
          </h2>
          <p style={{
            fontSize: "0.9375rem",
            color: "rgba(237,238,240,0.55)",
            lineHeight: 1.7,
            marginBottom: 36,
          }}>
            AI document review for real estate closing attorneys. Pattern work handled automatically. Attorneys focus on judgment.
          </p>
          <Link href="/sign-up" style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "0.9375rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            padding: "14px 36px",
            borderRadius: 9999,
            textDecoration: "none",
          }}>
            Try TitleWise Free
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
