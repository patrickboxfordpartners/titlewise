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
    <section className="bg-section-dark py-20 md:py-28">
      <div className="container mx-auto px-6">
        {/* Asymmetric layout: content left, trust indicator right */}
        <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[1.3fr_0.7fr] gap-16 items-start">
          <div>
            <motion.h2
              className="text-4xl font-bold text-white md:text-5xl tracking-tighter"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Designed for how closing attorneys actually work
            </motion.h2>
            <motion.p
              className="mt-5 text-base text-white/60 leading-relaxed max-w-[65ch]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Not a general-purpose AI tool. Not built for title companies. Built for you.
            </motion.p>

            <div className="mt-12 space-y-6">
              {benefits.map((b, i) => (
                <motion.div
                  key={b}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{
                    delay: i * 0.08 + 0.2,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" strokeWidth={2} />
                  <span className="text-sm text-white/80 leading-relaxed">{b}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/sign-up">
                <Button variant="hero" size="lg" className="text-base px-8 active:translate-y-[1px]">
                  Get Started Today <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right: Trust indicator */}
          <motion.div
            className="hidden lg:block lg:sticky lg:top-32"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm p-8">
              <div className="space-y-6">
                <div>
                  <div className="text-5xl font-bold text-white tracking-tighter font-mono">
                    30+
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    Minutes saved per file
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <div className="text-5xl font-bold text-white tracking-tighter font-mono">
                    7
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    States supported
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <div className="text-5xl font-bold text-white tracking-tighter font-mono">
                    24/7
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    Autonomous agent monitoring
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
