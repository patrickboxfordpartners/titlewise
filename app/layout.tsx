import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { PHProvider } from "@/components/posthog-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    template: "%s | TitleWise",
  },
  description:
    "TitleWise gives closing attorneys AI-powered tools that handle the repetitive work — status updates, title analysis, CD review, wire verification, and more. Save 30+ minutes per file.",
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
  openGraph: {
    type: "website",
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered tools built for real estate closing attorneys.",
    siteName: "TitleWise",
    url: "https://titlewise.app",
  },
  twitter: {
    card: "summary",
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
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
      <html lang="en" className={`${inter.className} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          <PHProvider>{children}</PHProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
