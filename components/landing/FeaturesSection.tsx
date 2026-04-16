"use client"

import Link from "next/link"
import { FileText, FileSearch, Shield, DollarSign, Calculator, ClipboardList, ArrowRight, FileCheck, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useState } from "react"

const tools = [
  { icon: FileText, title: "Status Update Generator", description: "Draft a professional client update email in seconds.", href: "/sign-up" },
  { icon: FileSearch, title: "Title Commitment Analyzer", description: "Plain-English breakdown of Schedule B requirements, exceptions, and red flags.", href: "/sign-up" },
  { icon: FileCheck, title: "Closing Disclosure Reviewer", description: "Compare a CD against contract terms and flag discrepancies.", href: "/sign-up" },
  { icon: Shield, title: "Wire Fraud Prevention", description: "Analyze wire instructions for fraud indicators and generate verification emails.", href: "/sign-up" },
  { icon: Building, title: "HOA Document Reviewer", description: "Extract monthly dues, assessments, restrictions, and litigation from HOA docs.", href: "/sign-up" },
  { icon: DollarSign, title: "Fee Estimate Generator", description: "Generate a professional fee estimate letter for client intake.", href: "/sign-up" },
  { icon: Calculator, title: "Tax Proration Calculator", description: "Calculate buyer/seller tax prorations with per-diem breakdown.", href: "/sign-up" },
  { icon: ClipboardList, title: "Closing Checklist Tracker", description: "Auto-generated checklists by transaction type.", href: "/sign-up" },
]

function ToolCard({ tool, index }: { tool: typeof tools[0]; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link href={tool.href}>
        <motion.div
          className="group h-full rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/30"
          whileHover={{ y: -6, boxShadow: "0 12px 24px -8px hsl(222 47% 11% / 0.08)" }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
            animate={hovered ? { rotate: 8, scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <tool.icon className="h-5 w-5 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-foreground text-sm">{tool.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
          <motion.div
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"
            initial={{ opacity: 0, x: -8 }}
            animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            Try it now <ArrowRight className="h-3 w-3" />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl tracking-tight">
            Everything you need to close faster
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            8 tools built around the real estate closing workflow
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, i) => (
            <ToolCard key={tool.title} tool={tool} index={i} />
          ))}
        </div>

        <motion.div
          className="mx-auto mt-16 max-w-xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/sign-up">
            <Button variant="hero" size="lg" className="text-base px-10">
              Try All 8 Tools Free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
