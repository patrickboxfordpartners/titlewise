"use client"

import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const benefits = [
  "12 tools and an autonomous AI agent covering every stage of the closing workflow",
  "Built for real estate closing attorneys, not title companies",
  "State-specific checklist templates for NH, MA, NY, CA, FL, TX, PA",
  "Client-facing portals so buyers and sellers can track progress themselves",
  "Wire fraud institutional memory that protects your firm across every matter",
  "TRID compliance engine with automatic Bucket A/B/C classification",
  "Plain English output your clients actually understand",
  "PDF exports, full-text search, and complete document version history",
]

export default function BenefitsSectionUpgraded() {
  return (
    <section className="bg-section-dark py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-12">
            <motion.h2
              className="text-4xl font-black text-white md:text-5xl tracking-tighter"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Designed for closing attorneys
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-white/70 leading-relaxed font-medium"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Not a general-purpose AI tool. Not built for title companies. Built for you.
            </motion.p>
          </div>

          <div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-[900px] mx-auto">
              {benefits.map((b, i) => (
                <motion.div
                  key={b}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" strokeWidth={2.5} />
                  <span className="text-sm text-white/80 leading-relaxed font-medium">{b}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/sign-up">
                <Button variant="hero" size="lg" className="text-base px-8 active:translate-y-[1px]">
                  Get Started Today <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2.5} />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
