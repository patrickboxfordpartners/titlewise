"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText, FileSearch, ArrowRight, FileCheck,
  Shield, Building, DollarSign, Calculator, ClipboardList,
} from "lucide-react"

const tools = [
  {
    href: "/status-update",
    icon: FileText,
    title: "Status Update Generator",
    description: "Draft a professional client update email in seconds.",
  },
  {
    href: "/title-analysis",
    icon: FileSearch,
    title: "Title Commitment Analyzer",
    description: "Plain-English breakdown of requirements, exceptions, and red flags.",
  },
  {
    href: "/cd-reviewer",
    icon: FileCheck,
    title: "Closing Disclosure Reviewer",
    description: "Compare a CD against contract terms and flag discrepancies.",
  },
  {
    href: "/wire-verification",
    icon: Shield,
    title: "Wire Fraud Prevention",
    description: "Analyze wire instructions for fraud indicators and generate verification emails.",
  },
  {
    href: "/hoa-reviewer",
    icon: Building,
    title: "HOA Document Reviewer",
    description: "Extract fees, restrictions, litigation, and red flags from HOA/condo docs.",
  },
  {
    href: "/fee-estimate",
    icon: DollarSign,
    title: "Fee Estimate Generator",
    description: "Generate a professional fee estimate letter for client intake.",
  },
  {
    href: "/proration-calculator",
    icon: Calculator,
    title: "Property Tax Proration",
    description: "Calculate buyer/seller tax prorations with per-diem breakdown.",
  },
  {
    href: "/checklist",
    icon: ClipboardList,
    title: "Closing Checklist Tracker",
    description: "Auto-generated checklists by transaction type. Track items across parties.",
  },
]

export default function DashboardPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI tools built for real estate closing attorneys.
        </p>
      </motion.div>

      <div className="grid gap-3">
        {tools.map(({ href, icon: Icon, title, description }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06, duration: 0.3, ease: "easeOut" }}
          >
            <Link
              href={href}
              className="group bg-card rounded-xl border border-border p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
