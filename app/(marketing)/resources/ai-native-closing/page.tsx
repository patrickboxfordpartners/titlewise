import type { Metadata } from "next";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import Breadcrumbs from "@/components/landing/Breadcrumbs";
import { WhitepaperContent } from "./WhitepaperContent";
import { DownloadButton } from "./DownloadButton";
import { CTASection } from "./CTASection";

export const metadata: Metadata = {
  title: "The AI-Native Closing | TitleWise",
  description: "How AI transforms real estate closing coordination from email chaos to agent-native workflows. A whitepaper on document intelligence, adversarial verification, and the future of title production.",
  openGraph: {
    title: "The AI-Native Closing | TitleWise",
    description: "How AI transforms real estate closing coordination from email chaos to agent-native workflows.",
    type: "article",
    publishedTime: "2026-09-08T00:00:00Z",
    authors: ["TitleWise"],
  },
};

export default function AINameClosingPage() {
  const jsonLdReport = {
    "@context": "https://schema.org",
    "@type": "Report",
    headline: "The AI-Native Closing",
    abstract: "How AI transforms real estate closing coordination from email chaos to agent-native workflows. Covers the state of traditional closing coordination, why bolt-on AI features fail, what agent-native architecture looks like, a walkthrough of an AI-coordinated closing, and where the industry goes next.",
    author: {
      "@type": "Organization",
      name: "TitleWise",
      url: "https://titlewise.app",
    },
    datePublished: "2026-09-08",
    publisher: {
      "@type": "Organization",
      name: "TitleWise",
      logo: {
        "@type": "ImageObject",
        url: "https://titlewise.app/logo.png",
      },
    },
    inLanguage: "en-US",
    keywords: ["AI", "real estate closing", "title insurance", "document intelligence", "agent-native", "MCP", "adversarial verification"],
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdReport) }}
      />

      <LandingNav />

      <div className="max-w-[860px] mx-auto px-8 pt-32 pb-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: "The AI-Native Closing" },
          ]}
        />

        {/* Header */}
        <div className="mb-12 mt-8">
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
            Whitepaper
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
            The AI-Native Closing
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              fontWeight: 300,
              color: "var(--muted-foreground)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            How AI transforms real estate closing coordination from email chaos to agent-native workflows.
          </p>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: "0.875rem",
              fontWeight: 300,
              color: "var(--muted-foreground)",
              marginBottom: 24,
            }}
          >
            <span>Published September 8, 2026</span>
            <span>·</span>
            <span>12 min read</span>
          </div>

          {/* PDF Download Button */}
          <DownloadButton />
        </div>

        {/* Whitepaper content */}
        <WhitepaperContent />

        {/* CTA Section */}
        <CTASection />
      </div>

      <LandingFooter />
    </div>
  );
}
