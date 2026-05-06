"use client"

import Link from "next/link"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import {
  FileText, FileSearch, ArrowRight, FileCheck,
  Shield, Building, DollarSign, Calculator, ClipboardList,
  Bot, Users, Scale, Brain, Lock, Clock, AlertCircle, FolderOpen, CheckCircle, Plus,
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

type OpenMatter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  totalItems: number
  completedItems: number
  updatedAt: string
}

const coreTools = [
  {
    href: "/status-update",
    icon: FileText,
    title: "Status Updates",
    description: "Client emails drafted. Seconds, not minutes.",
    color: "blue" as const
  },
  {
    href: "/title-analysis",
    icon: FileSearch,
    title: "Title Analyzer",
    description: "Schedule B requirements in plain English. Red flags caught.",
    color: "blue" as const
  },
  {
    href: "/cd-reviewer",
    icon: FileCheck,
    title: "CD Reviewer",
    description: "Compare CD against contract. Discrepancies flagged.",
    color: "purple" as const
  },
  {
    href: "/wire-verification",
    icon: Shield,
    title: "Wire Fraud Prevention",
    description: "Fraud indicators detected. Verification emails auto-sent.",
    color: "red" as const
  },
  {
    href: "/hoa-reviewer",
    icon: Building,
    title: "HOA Reviewer",
    description: "Dues, assessments, restrictions extracted. Litigation flagged.",
    color: "purple" as const
  },
  {
    href: "/fee-estimate",
    icon: DollarSign,
    title: "Fee Estimator",
    description: "Professional estimate letters for intake. Auto-generated.",
    color: "green" as const
  },
  {
    href: "/proration-calculator",
    icon: Calculator,
    title: "Tax Proration",
    description: "Buyer/seller prorations calculated. Per-diem breakdown included.",
    color: "green" as const
  },
  {
    href: "/checklist",
    icon: ClipboardList,
    title: "Closing Checklist",
    description: "State-specific checklists. NH, MA, NY, CA, FL, TX, PA.",
    color: "blue" as const
  },
]

const premiumTools = [
  {
    href: "/checklist",
    icon: Bot,
    title: "Autonomous Agent",
    description: "Analyzes matters, updates checklists, drafts status emails. Automatic.",
    requiredPlans: ["pro", "enterprise"],
    badge: "Pro",
    featureKey: "hasAgent" as const,
    color: "purple" as const
  },
  {
    href: "/checklist",
    icon: Users,
    title: "Client Portal",
    description: "Clients track checklist progress and status in real time.",
    requiredPlans: ["small_firm", "pro", "enterprise"],
    badge: "Small Firm+",
    featureKey: "hasClientPortal" as const,
    color: "blue" as const
  },
  {
    href: "/cd-reviewer",
    icon: Scale,
    title: "TRID Engine",
    description: "Bucket A/B/C classification. Tolerance cure amounts calculated.",
    requiredPlans: ["pro", "enterprise"],
    badge: "Pro",
    featureKey: "hasTridEngine" as const,
    color: "orange" as const
  },
  {
    href: "/wire-verification",
    icon: Brain,
    title: "Wire Fraud Memory",
    description: "Verified wires stored. Routing number deviations flagged across matters.",
    requiredPlans: ["small_firm", "pro", "enterprise"],
    badge: "Small Firm+",
    featureKey: "hasWireFraudMemory" as const,
    color: "red" as const
  },
]

const colorClasses = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    shadow: "rgba(59, 130, 246, 0.25)",
    hoverShadow: "rgba(59, 130, 246, 0.35)",
    progressBg: "bg-blue-500"
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    icon: "text-purple-600",
    shadow: "rgba(168, 85, 247, 0.25)",
    hoverShadow: "rgba(168, 85, 247, 0.35)",
    progressBg: "bg-purple-500"
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-600",
    shadow: "rgba(239, 68, 68, 0.25)",
    hoverShadow: "rgba(239, 68, 68, 0.35)",
    progressBg: "bg-red-500"
  },
  green: {
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    icon: "text-green-600",
    shadow: "rgba(34, 197, 94, 0.25)",
    hoverShadow: "rgba(34, 197, 94, 0.35)",
    progressBg: "bg-green-500"
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    icon: "text-orange-600",
    shadow: "rgba(249, 115, 22, 0.25)",
    hoverShadow: "rgba(249, 115, 22, 0.35)",
    progressBg: "bg-orange-500"
  }
}

function MagneticCard({ children, href, color }: { children: React.ReactNode; href: string; color: keyof typeof colorClasses }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { damping: 20, stiffness: 200 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const colors = colorClasses[color]

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    x.set(distanceX * 0.08)
    y.set(distanceY * 0.08)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ x: springX, y: springY, boxShadow: `6px 6px 0px ${colors.shadow}` }}
        whileHover={{
          boxShadow: `8px 8px 0px ${colors.hoverShadow}`,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
        className={`group bg-card rounded-2xl border-2 ${colors.border} p-5 transition-all duration-200`}
      >
        {children}
      </motion.div>
    </Link>
  )
}

function hasFeatureAccess(tier: string | null, requiredPlans: string[]): boolean {
  if (!tier) return false
  return requiredPlans.includes(tier)
}

export default function DashboardPagePersonality() {
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [openMatters, setOpenMatters] = useState<OpenMatter[]>([])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setPlan({
        subscriptionTier: data.subscriptionTier,
        subscriptionStatus: data.subscriptionStatus,
        name: data.name ?? null,
      }))
      .catch(() => {})

    fetch("/api/checklist")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.matters ?? []).filter((m: OpenMatter & { status: string }) => m.status === "active")
        setOpenMatters(active.slice(0, 4))
      })
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
        setRecent(items.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  const showNameBanner = plan !== null && !plan.name

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          30 minutes back. Every file.
        </p>
      </motion.div>

      {showNameBanner && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-amber-500/30 bg-amber-50 px-5 py-4"
          style={{ boxShadow: "4px 4px 0px rgba(245, 158, 11, 0.25)" }}
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={2.5} />
          <p className="text-sm text-amber-900 flex-1 font-medium">
            Add your name and firm to personalize generated letters and emails.
          </p>
          <Link href="/settings" className="text-xs font-black text-amber-700 hover:text-amber-900 transition-colors shrink-0 uppercase tracking-wide">
            Complete Profile →
          </Link>
        </motion.div>
      )}

      {openMatters.length > 0 && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Open Matters</p>
            <Link href="/checklist" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} /> New matter
            </Link>
          </div>
          <div className="grid gap-3">
            {openMatters.map((m) => {
              const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
              const isComplete = pct === 100
              const isUrgent = m.closingDate && new Date(m.closingDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              const borderColor = isComplete ? "border-green-500/30" : isUrgent ? "border-orange-500/30" : "border-blue-500/30"
              const shadowColor = isComplete ? "rgba(34, 197, 94, 0.25)" : isUrgent ? "rgba(249, 115, 22, 0.25)" : "rgba(59, 130, 246, 0.25)"
              const progressColor = isComplete ? "bg-green-500" : isUrgent ? "bg-orange-500" : "bg-blue-500"

              return (
                <Link
                  key={m.id}
                  href={`/checklist/${m.id}`}
                  className="group"
                >
                  <motion.div
                    className={`bg-card rounded-2xl border-2 ${borderColor} p-5 transition-all duration-200`}
                    style={{ boxShadow: `6px 6px 0px ${shadowColor}` }}
                    whileHover={{
                      y: -4,
                      boxShadow: `8px 8px 0px ${shadowColor}`,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{m.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate font-medium">{m.propertyAddress} · {m.transactionType}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.closingDate && (
                          <span className={`text-[10px] font-bold ${isUrgent ? "text-orange-600" : "text-muted-foreground/60"}`}>
                            {new Date(m.closingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 font-bold">
                        <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {m.completedItems}/{m.totalItems}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}

      {openMatters.length === 0 && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Open Matters</p>
          </div>
          <Link
            href="/checklist"
            className="group flex items-center gap-4 bg-card rounded-2xl border-2 border-dashed border-blue-500/30 p-5 hover:border-blue-500/50 transition-colors"
            style={{ boxShadow: "4px 4px 0px rgba(59, 130, 246, 0.15)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-foreground">No open matters</p>
              <p className="text-xs text-muted-foreground font-medium">Create a matter to start tracking a closing</p>
            </div>
            <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-blue-600 transition-colors" strokeWidth={2.5} />
          </Link>
        </motion.div>
      )}

      {recent.length > 0 && (
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-purple-600">Recent Activity</p>
            <Link href="/history" className="text-xs text-purple-600 hover:text-purple-700 font-bold transition-colors">View all</Link>
          </div>
          <div className="grid gap-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group bg-card rounded-xl border border-purple-500/20 px-4 py-3 flex items-center gap-3 hover:border-purple-500/40 hover:shadow-sm transition-all duration-200"
              >
                <item.icon className="h-4 w-4 text-purple-600 shrink-0" strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">{item.sub}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 shrink-0 font-medium">
                  <Clock className="h-3 w-3" strokeWidth={2.5} />
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Core Tools */}
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Core Tools</p>
      </div>
      <div className="grid gap-4 mb-10">
        {coreTools.map(({ href, icon: Icon, title, description, color }, i) => {
          const colors = colorClasses[color]
          return (
            <motion.div
              key={href + title}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
            >
              <MagneticCard href={href} color={color}>
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-11 h-11 rounded-xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-black text-foreground tracking-tight">{title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" strokeWidth={2.5} />
                </div>
              </MagneticCard>
            </motion.div>
          )
        })}
      </div>

      {/* Advanced Capabilities */}
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-purple-600">Advanced Capabilities</p>
      </div>
      <div className="grid gap-4">
        {premiumTools.map(({ href, icon: Icon, title, description, requiredPlans, badge, color }, i) => {
          const unlocked = hasFeatureAccess(plan?.subscriptionTier ?? null, requiredPlans)
          const colors = colorClasses[color]

          if (unlocked) {
            return (
              <motion.div
                key={title}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
              >
                <MagneticCard href={href} color={color}>
                  <div className="flex items-center gap-4">
                    <div className={`shrink-0 w-11 h-11 rounded-xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${colors.icon}`} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-foreground tracking-tight">{title}</h2>
                        <span className={`rounded-full ${colors.bg} border ${colors.border} px-2.5 py-0.5 text-[10px] font-black ${colors.icon} uppercase tracking-wide`}>{badge}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" strokeWidth={2.5} />
                  </div>
                </MagneticCard>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={title}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: "easeOut" }}
            >
              <Link
                href="/pricing"
                className="group bg-card rounded-2xl border-2 border-border p-5 flex items-center gap-4 opacity-60 hover:opacity-80 transition-all duration-200"
                style={{ boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.05)" }}
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-muted border-2 border-muted flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-muted-foreground tracking-tight">{title}</h2>
                    <span className="rounded-full bg-muted border border-muted px-2.5 py-0.5 text-[10px] font-black text-muted-foreground uppercase tracking-wide">{badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed font-medium">{description}</p>
                </div>
                <span className="text-xs font-black text-primary shrink-0 uppercase tracking-wide">Upgrade</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
