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
    types: {
      "text/markdown": "https://titlewise.app/index.md",
    },
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
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#0066cc',
          colorBackground: '#ffffff',
          colorText: '#0d253d',
          colorTextSecondary: '#64748d',
          colorInputBackground: '#ffffff',
          colorInputText: '#0d253d',
          borderRadius: '0.5rem',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontWeight: { normal: 300, medium: 400, bold: 600 },
        },
        elements: {
          rootBox: 'bg-white',
          card: 'bg-white shadow-lg border border-[#e3e8ee]',
          main: 'bg-white',
          formButtonPrimary:
            'bg-[#0066cc] hover:bg-[#0052a3] text-white font-normal rounded-full shadow-sm hover:shadow-md transition-all',
          headerTitle: 'font-light text-[#0d253d] tracking-tight',
          headerSubtitle: 'font-light text-[#64748d]',
          socialButtonsBlockButton:
            'font-normal border-[#e3e8ee] hover:bg-[#f8fafc] transition-colors',
          formFieldLabel: 'font-light text-[#64748d] text-sm',
          formFieldInput:
            'font-light border-[#e3e8ee] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]',
          footerActionLink: 'text-[#0066cc] hover:text-[#0052a3] font-normal',
          identityPreviewText: 'font-light text-[#64748d]',
          identityPreviewEditButton: 'text-[#0066cc] hover:text-[#0052a3]',
          formFieldSuccessText: 'text-green-600 font-light',
          formFieldErrorText: 'text-red-600 font-light',
          dividerLine: 'bg-[#e3e8ee]',
          dividerText: 'text-[#64748d] font-light',
        }
      }}
    >
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
