import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import Breadcrumbs from "@/components/landing/Breadcrumbs";

export const metadata: Metadata = {
  title: "Resources | TitleWise",
  description: "Whitepapers, guides, and insights on AI-native document intelligence for title attorneys.",
};

const resources = [
  {
    slug: "ai-native-closing",
    title: "The AI-Native Closing",
    description: "How AI transforms real estate closing coordination from email chaos to agent-native workflows. Covers traditional pain points, why bolt-on AI fails, agent-native architecture, and where the industry goes next.",
    category: "Whitepaper",
    date: "2026-09-08",
    readTime: "12 min read",
  },
];

export default function ResourcesPage() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <LandingNav />

      <div className="max-w-[1060px] mx-auto px-8 pt-32 pb-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Resources" }]} />

        {/* Header */}
        <div className="mb-16 mt-8">
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 400,
              color: "var(--primary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Resources
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              letterSpacing: "-1.4px",
              lineHeight: 1.1,
              color: "var(--foreground)",
              marginBottom: 16,
            }}
          >
            Whitepapers &amp; Insights
          </h1>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 300,
              color: "var(--muted-foreground)",
              lineHeight: 1.7,
              maxWidth: 520,
            }}
          >
            Deep dives on AI-native document intelligence, closing coordination, and the future of title production.
          </p>
        </div>

        {/* Resources list */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {resources.map((resource) => (
            <article
              key={resource.slug}
              style={{
                borderBottom: "1px solid var(--border)",
                padding: "40px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 400,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--primary)",
                  }}
                >
                  {resource.category}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 300,
                    color: "var(--muted-foreground)",
                  }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 300,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {new Date(resource.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 300,
                    color: "var(--muted-foreground)",
                  }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 300,
                    color: "var(--muted-foreground)",
                  }}
                >
                  {resource.readTime}
                </span>
              </div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  color: "var(--foreground)",
                  marginBottom: 10,
                }}
              >
                {resource.title}
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 300,
                  color: "var(--muted-foreground)",
                  lineHeight: 1.65,
                  maxWidth: 680,
                  marginBottom: 20,
                }}
              >
                {resource.description}
              </p>
              <Link
                href={`/resources/${resource.slug}`}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--primary)",
                  textDecoration: "none",
                }}
              >
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
