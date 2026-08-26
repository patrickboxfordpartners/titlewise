import type { Metadata } from "next"
import Script from "next/script"
import { ClerkProvider } from "@clerk/nextjs"
import { PHProvider } from "@/components/posthog-provider"
import { CookieBanner } from "@/components/CookieBanner"
import { WebMCP } from "@/components/WebMCP"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "TitleWise, AI Tools for Real Estate Closing Attorneys",
    template: "%s | TitleWise",
  },
  description:
    "TitleWise gives closing attorneys AI-powered tools that handle the repetitive work, status updates, title analysis, CD review, wire verification, and more. Save 30+ minutes per file.",
  keywords: [
    "real estate closing attorney",
    "title commitment analyzer",
    "closing attorney software",
    "legal tech",
    "AI attorney tools",
    "real estate closing software",
    "closing disclosure reviewer",
    "wire fraud prevention",
  ],
  metadataBase: new URL("https://titlewise.app"),
  alternates: {
    canonical: "https://titlewise.app",
  },
  openGraph: {
    type: "website",
    title: "TitleWise, AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered tools built for real estate closing attorneys.",
    siteName: "TitleWise",
    url: "https://titlewise.app",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TitleWise - AI Closing Platform for Real Estate Attorneys",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TitleWise, AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered tools built for real estate closing attorneys.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <head>
          <link
            href="https://fonts.bunny.net/css?family=cabinet-grotesk:400,500,600,700,800|dm-sans:400,500,600,700|jetbrains-mono:400,500,600"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-full flex flex-col">
          <PHProvider>{children}</PHProvider>
          <CookieBanner />
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "30b945f51e3f499aa453d9af989b62a6"}'
          />
          <Script
            defer
            src="https://analytics.boxfordpartners.com/script.js"
            data-website-id="e9d66539-0dbe-44af-926b-f8e0667373b6"
          />
          <WebMCP />
        </body>
      </html>
    </ClerkProvider>
  )
}
