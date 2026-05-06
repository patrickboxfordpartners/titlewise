"use client"

import Link from "next/link"
import { FileText, FileSearch, Shield, DollarSign, Calculator, ClipboardList, ArrowRight, FileCheck, Building, Bot, Users, Scale, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useState } from "react"

const coreTools = [
  { icon: FileText, title: "Status Update Generator", description: "Draft professional client update emails in seconds." },
  { icon: FileSearch, title: "Title Commitment Analyzer", description: "Plain-English breakdown of Schedule B requirements, exceptions, and red flags." },
  { icon: FileCheck, title: "Closing Disclosure Reviewer", description: "Compare a CD against contract terms and flag discrepancies." },
  { icon: Shield, title: "Wire Fraud Prevention", description: "Analyze wire instructions for fraud indicators and generate verification emails." },
  { icon: Building, title: "HOA Document Reviewer", description: "Extract dues, assessments, restrictions, and litigation from HOA docs." },
  { icon: DollarSign, title: "Fee Estimate Generator", description: "Generate a professional fee estimate letter for client intake." },
  { icon: Calculator, title: "Tax Proration Calculator", description: "Calculate buyer/seller tax prorations with per-diem breakdown." },
  { icon: ClipboardList, title: "Closing Checklist Tracker", description: "State-specific checklists for NH, MA, NY, CA, FL, TX, PA and more." },
]

const premiumFeatures = [
  { icon: Bot, title: "Autonomous Closing Agent", description: "AI agent that analyzes your matter, updates checklists, and drafts status emails automatically.", badge: "Pro" },
  { icon: Users, title: "Client Matter Portal", description: "Shareable portal where clients track checklist progress and closing status in real time.", badge: "Small Firm+" },
  { icon: Scale, title: "TRID Compliance Engine", description: "Automatic Bucket A/B/C fee classification and tolerance cure amount calculation.", badge: "Pro" },
  { icon: Brain, title: "Wire Fraud Memory", description: "Institutional memory that stores verified wires and flags routing number deviations across matters.", badge: "Small Firm+" },
]

function ToolCard({ tool, index }: { tool: typeof coreTools[0]; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.div
        className="group h-full rounded-[2rem] border border-border bg-card p-8 transition-colors duration-200 hover:border-primary/30"
        whileHover={{
          y: -8,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <motion.div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
          animate={hovered ? { rotate: 6, scale: 1.05 } : { rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <tool.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </motion.div>
        <h3 className="font-semibold text-foreground tracking-tight">{tool.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </motion.div>
    </motion.div>
  )
}

function PremiumCard({ feature, index }: { feature: typeof premiumFeatures[0]; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        delay: index * 0.08 + 0.2,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.div
        className="group h-full rounded-[2rem] border border-primary/20 bg-gradient-to-br from-card to-primary/5 p-8 transition-colors duration-200 hover:border-primary/40"
        whileHover={{
          y: -8,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            animate={hovered ? { rotate: 6, scale: 1.05 } : { rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <feature.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </motion.div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
            {feature.badge}
          </span>
        </div>
        <h3 className="font-semibold text-foreground tracking-tight">{feature.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
      </motion.div>
    </motion.div>
  )
}

export default function FeaturesSectionUpgraded() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-16 max-w-[65ch]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl font-bold text-foreground md:text-5xl tracking-tighter">
            Everything you need to close faster
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            12 tools and an autonomous AI agent—built around the real estate closing workflow
          </p>
        </motion.div>

        {/* Core Tools */}
        <motion.div
          className="mx-auto mb-6 max-w-[1400px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.01 }}
        >
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Core Tools — Included in all plans</p>
        </motion.div>

        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {coreTools.map((tool, i) => (
            <ToolCard key={tool.title} tool={tool} index={i} />
          ))}
        </div>

        {/* Premium Features */}
        <motion.div
          className="mx-auto mt-20 mb-6 max-w-[1400px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.01 }}
        >
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Advanced Capabilities — Available on higher plans</p>
        </motion.div>

        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {premiumFeatures.map((feature, i) => (
            <PremiumCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        <motion.div
          className="mx-auto mt-16 max-w-xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/sign-up">
            <Button variant="hero" size="lg" className="text-base px-10 active:translate-y-[1px]">
              Get Started <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
