import { Metadata } from "next"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"
import Breadcrumbs from "@/components/landing/Breadcrumbs"
import MarkdownDoc from "@/components/landing/MarkdownDoc"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "About",
  description: "About TITLEwise: who we are and how to reach us.",
  alternates: { canonical: "https://titlewise.app/about", types: { "text/markdown": "https://titlewise.app/about.md" } },
}

/** About page, rendered from public/about.md so it matches the agent-facing copy. */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-20 lg:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
        <div className="mt-8">
          <MarkdownDoc file="about.md" />
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
