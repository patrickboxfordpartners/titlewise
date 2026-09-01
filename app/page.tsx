import { featuredFaqs } from "@/components/landing/faq-data"
import HomePageClient from "@/components/landing/HomePageClient"

export const metadata = {
  title: "TITLEwise -- AI Closing Platform for Real Estate Attorneys",
  description:
    "From intake to clear-to-close. AI tools for title analysis, CD review, wire fraud prevention, and status updates. Built for real estate closing attorneys.",
  openGraph: {
    type: "website" as const,
    title: "TITLEwise -- AI Closing Platform for Real Estate Attorneys",
    description:
      "From intake to clear-to-close. 12 AI tools built for real estate closing attorneys.",
    siteName: "TITLEwise",
    url: "https://titlewise.app",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TITLEwise",
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
  name: "TITLEwise",
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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: featuredFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomePageClient />
    </>
  )
}
