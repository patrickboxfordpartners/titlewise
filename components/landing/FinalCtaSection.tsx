"use client"

import Link from "next/link"
import { Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FinalCtaSection() {
  return (
    <section className="bg-section-dark py-20 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Zap className="mx-auto h-10 w-10 text-primary mb-6" />
          <h2 className="text-3xl font-black text-white md:text-4xl tracking-tight">
            Ready to close smarter?
          </h2>
          <p className="mt-4 text-lg text-white/70 font-medium">
            Join real estate attorneys who are closing faster and smarter with TitleWise.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/pricing">
              <Button variant="hero" size="lg" className="text-base px-10">
                View Pricing <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#contact">
              <Button variant="hero-outline" size="lg" className="text-base px-8">
                Request Demo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/60 font-medium">
            12 tools + AI agent · Plans from $149/mo · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
