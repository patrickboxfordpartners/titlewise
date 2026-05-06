import LandingNav from "@/components/landing/LandingNav"
import HeroSection from "@/components/landing/HeroSectionUpgraded"
import StatsSection from "@/components/landing/StatsSectionUpgraded"
import HowItWorksSection from "@/components/landing/HowItWorksSectionUpgraded"
import FeaturesSection from "@/components/landing/FeaturesSectionUpgraded"
import TestimonialSection from "@/components/landing/TestimonialSection"
import BenefitsSection from "@/components/landing/BenefitsSectionUpgraded"
import FAQSection from "@/components/landing/FAQSectionUpgraded"
import ContactSection from "@/components/landing/ContactSectionUpgraded"
import FinalCtaSection from "@/components/landing/FinalCtaSection"
import LandingFooter from "@/components/landing/LandingFooter"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TitleWise",
  applicationCategory: "BusinessApplication",
  description: "AI-powered closing platform for real estate attorneys — 12 tools, autonomous closing agent, client portals, TRID compliance, and wire fraud protection.",
  url: "https://titlewise.app",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "149",
    highPrice: "999",
    priceCurrency: "USD",
    offerCount: "4",
  },
}

export const metadata = {
  title: "TitleWise — AI Closing Platform for Real Estate Attorneys",
  description: "TitleWise is the AI-powered closing platform for real estate attorneys. 12 tools, autonomous closing agent, client portals, TRID compliance, and wire fraud protection. From intake to clear-to-close.",
  openGraph: {
    type: "website" as const,
    title: "TitleWise — AI Closing Platform for Real Estate Attorneys",
    description: "From intake to clear-to-close. 12 AI tools, autonomous closing agent, client portals, and compliance checks built for real estate attorneys.",
    siteName: "TitleWise",
    url: "https://titlewise.app",
  },
  twitter: {
    card: "summary" as const,
    title: "TitleWise — AI Closing Platform for Real Estate Attorneys",
    description: "From intake to clear-to-close. 12 AI tools, autonomous closing agent, client portals, and compliance checks built for real estate attorneys.",
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
