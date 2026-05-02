"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import {
  FileText, FileSearch, ArrowRight, FileCheck,
  Shield, Building, DollarSign, Calculator, ClipboardList,
  Bot, Users, Scale, Brain, Lock, Clock, AlertCircle,
} from "lucide-react"
import { PLANS } from "@/lib/plans"

type UserPlan = {
  subscriptionTier: string | null
  subscriptionStatus: string | null
  name: string | null
}

type RecentItem = {
  id: string
  label: string
  sub: string
  href: string
  icon: typeof FileText
  createdAt: string
}

const coreTools = [
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
    description: "State-specific checklists for NH, MA, NY, CA, FL, TX, PA. Track items across parties.",
  },
]

const premiumTools = [
  {
    href: "/checklist",
    icon: Bot,
    title: "Autonomous Closing Agent",
    description: "AI agent analyzes your matter, updates checklists, and drafts status emails automatically.",
    requiredPlans: ["pro", "enterprise"],
    badge: "Pro",
    featureKey: "hasAgent" as const,
  },
  {
    href: "/checklist",
    icon: Users,
    title: "Client Matter Portal",
    description: "Shareable portal where clients track checklist progress and closing status in real time.",
    requiredPlans: ["small_firm", "pro", "enterprise"],
    badge: "Small Firm+",
    featureKey: "hasClientPortal" as const,
  },
  {
    href: "/cd-reviewer",
    icon: Scale,
    title: "TRID Compliance Engine",
    description: "Automatic Bucket A/B/C fee classification and tolerance cure amount calculation.",
    requiredPlans: ["pro", "enterprise"],
    badge: "Pro",
    featureKey: "hasTridEngine" as const,
  },
  {
    href: "/wire-verification",
    icon: Brain,
    title: "Wire Fraud Memory",
    description: "Institutional memory that stores verified wires and flags routing number deviations.",
    requiredPlans: ["small_firm", "pro", "enterprise"],
    badge: "Small Firm+",
    featureKey: "hasWireFraudMemory" as const,
  },
]

function hasFeatureAccess(tier: string | null, requiredPlans: string[]): boolean {
  if (!tier) return false
  return requiredPlans.includes(tier)
}

export default function DashboardPage() {
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setPlan({
        subscriptionTier: data.subscriptionTier,
        subscriptionStatus: data.subscriptionStatus,
        name: data.name ?? null,
      }))
      .catch(() => {})

    fetch("/api/history?limit=4")
      .then((r) => r.json())
      .then((data) => {
        const items: RecentItem[] = [
          ...(data.updates ?? []).map((u: { id: string; clientName: string; propertyAddress: string; createdAt: string }) => ({
            id: "u-" + u.id, label: u.clientName, sub: u.propertyAddress, href: "/history", icon: FileText, createdAt: u.createdAt,
          })),
          ...(data.analyses ?? []).map((a: { id: string; propertyAddress: string | null; createdAt: string }) => ({
            id: "a-" + a.id, label: a.propertyAddress ?? "Title Analysis", sub: "Title Commitment Analyzer", href: "/history", icon: FileSearch, createdAt: a.createdAt,
          })),
          ...(data.cdReviews ?? []).map((r: { id: string; propertyAddress: string | null; createdAt: string }) => ({
            id: "cd-" + r.id, label: r.propertyAddress ?? "CD Review", sub: "Closing Disclosure Reviewer", href: "/history", icon: FileSearch, createdAt: r.createdAt,
          })),
          ...(data.feeEstimates ?? []).map((r: { id: string; clientName: string; createdAt: string }) => ({
            id: "fee-" + r.id, label: r.clientName, sub: "Fee Estimate", href: "/history", icon: FileText, createdAt: r.createdAt,
          })),
        ]
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecent(items.slice(0, 4))
      })
      .catch(() => {})
  }, [])

  const showNameBanner = plan !== null && !plan.name

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
          AI-powered closing platform for real estate attorneys.
        </p>
      </motion.div>

      {showNameBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            Add your name and firm to personalize generated letters and emails.
          </p>
          <Link href="/settings" className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors shrink-0">
            Complete Profile →
          </Link>
        </motion.div>
      )}

      {recent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recent Activity</p>
            <Link href="/history" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid gap-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group bg-card rounded-lg border border-border px-4 py-2.5 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
              >
                <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Core Tools */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Core Tools</p>
      </div>
      <div className="grid gap-3 mb-10">
        {coreTools.map(({ href, icon: Icon, title, description }, i) => (
          <motion.div
            key={href + title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
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

      {/* Advanced Capabilities */}
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Advanced Capabilities</p>
      </div>
      <div className="grid gap-3">
        {premiumTools.map(({ href, icon: Icon, title, description, requiredPlans, badge }, i) => {
          const unlocked = hasFeatureAccess(plan?.subscriptionTier ?? null, requiredPlans)

          if (unlocked) {
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
              >
                <Link
                  href={href}
                  className="group bg-card rounded-xl border border-primary/20 p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">{badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
            >
              <Link
                href="/pricing"
                className="group bg-card rounded-xl border border-border p-4 flex items-center gap-4 opacity-60 hover:opacity-80 transition-all duration-200"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{description}</p>
                </div>
                <span className="text-xs font-medium text-primary shrink-0">Upgrade</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
