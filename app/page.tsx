import LandingNav from "@/components/landing/LandingNav"
import HeroSection from "@/components/landing/HeroSection"
import StatsSection from "@/components/landing/StatsSection"
import HowItWorksSection from "@/components/landing/HowItWorksSection"
import FeaturesSection from "@/components/landing/FeaturesSection"
import TestimonialSection from "@/components/landing/TestimonialSection"
import BenefitsSection from "@/components/landing/BenefitsSection"
import FAQSection from "@/components/landing/FAQSection"
import ContactSection from "@/components/landing/ContactSection"
import FinalCtaSection from "@/components/landing/FinalCtaSection"
import LandingFooter from "@/components/landing/LandingFooter"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TitleWise",
  applicationCategory: "BusinessApplication",
  description: "AI-powered tools for real estate closing attorneys — 8 tools covering every stage of the closing workflow.",
  url: "https://titlewise.app",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "99",
    highPrice: "499",
    priceCurrency: "USD",
    offerCount: "3",
  },
}

export const metadata = {
  title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
  description: "TitleWise gives closing attorneys AI-powered tools that handle the repetitive work — status updates, title analysis, CD review, wire verification, and more. Save 30+ minutes per file.",
  openGraph: {
    type: "website" as const,
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered tools built for real estate closing attorneys.",
    siteName: "TitleWise",
    url: "https://titlewise.app",
  },
  twitter: {
    card: "summary" as const,
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered tools built for real estate closing attorneys.",
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialSection />
      <BenefitsSection />
      <FAQSection />
      <ContactSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  )
}
