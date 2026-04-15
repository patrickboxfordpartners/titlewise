import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    template: "%s | TitleWise",
  },
  description:
    "TitleWise helps real estate closing attorneys save time with AI-powered status update generation and title commitment analysis.",
  keywords: [
    "real estate closing attorney",
    "title commitment analyzer",
    "closing attorney software",
    "legal tech",
    "AI attorney tools",
    "real estate closing software",
  ],
  openGraph: {
    type: "website",
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered status updates and title commitment analysis.",
    siteName: "TitleWise",
  },
  twitter: {
    card: "summary_large_image",
    title: "TitleWise — AI Tools for Real Estate Closing Attorneys",
    description: "Save 30+ minutes per file with AI-powered status updates and title commitment analysis.",
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
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  )
}
