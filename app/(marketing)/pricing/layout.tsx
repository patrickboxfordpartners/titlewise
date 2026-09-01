import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, predictable pricing for TITLEwise. Plans from $149/mo for solo attorneys to $999/mo for enterprise firms. All 12 AI tools included.",
  alternates: { canonical: "https://titlewise.app/pricing" },
  openGraph: {
    type: "website",
    title: "Pricing | TITLEwise",
    description: "Simple, predictable pricing. Plans from $149/mo. All 12 AI tools included.",
    url: "https://titlewise.app/pricing",
    siteName: "TITLEwise",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
