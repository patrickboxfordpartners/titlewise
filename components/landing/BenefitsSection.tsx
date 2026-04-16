"use client"

import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const benefits = [
  "8 tools covering every stage of the closing workflow",
  "Built for real estate closing attorneys, not title companies",
  "Plain English output your clients actually understand",
  "Saves 30+ minutes per file, every day",
]

export default function BenefitsSection() {
  return (
    <section className="bg-section-dark py-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            className="text-3xl font-bold text-white md:text-4xl tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Designed for how closing attorneys actually work
          </motion.h2>
          <motion.p
            className="mt-3 text-base text-white/60"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Not a general-purpose AI tool. Not built for title companies. Built for you.
          </motion.p>
          <div className="mt-10 space-y-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
              >
                <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-white/80">{b}</span>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/sign-up">
              <Button variant="hero" size="lg" className="text-base px-8">
                Get Started Today <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
