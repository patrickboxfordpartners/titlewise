import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, predictable pricing for TitleWise. Plans from $149/mo for solo attorneys to $999/mo for enterprise firms. All 12 AI tools included.",
  alternates: { canonical: "https://titlewise.app/pricing" },
  openGraph: {
    type: "website",
    title: "Pricing | TitleWise",
    description: "Simple, predictable pricing. Plans from $149/mo. All 12 AI tools included.",
    url: "https://titlewise.app/pricing",
    siteName: "TitleWise",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
