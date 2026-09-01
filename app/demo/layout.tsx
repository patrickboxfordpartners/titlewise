import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo",
  description: "Try the TITLEwise AI status update generator live. See how closing attorneys save 30+ minutes per file with AI-powered document analysis.",
  alternates: { canonical: "https://titlewise.app/demo" },
  openGraph: {
    type: "website",
    title: "Demo | TITLEwise",
    description: "Try the AI status update generator live. See TITLEwise in action.",
    url: "https://titlewise.app/demo",
    siteName: "TITLEwise",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
