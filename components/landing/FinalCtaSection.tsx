"use client"

import Link from "next/link"
import { Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function FinalCtaSection() {
  return (
    <section className="bg-section-alt py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Zap className="mx-auto h-10 w-10 text-primary mb-6" />
          <h2 className="text-3xl font-bold text-foreground md:text-4xl tracking-tight">
            Ready to close smarter?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join hundreds of real estate attorneys who've streamlined their practice with TitleWise.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/sign-up">
              <Button variant="hero" size="lg" className="text-base px-10">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="hero-outline" size="lg" className="text-base px-8">
                Compare Plans
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            All 8 tools included · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
