"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, FileText, Shield, Calculator, Building, Mail, TrendingUp, Clock } from "lucide-react"

type DashboardStats = {
  activeMatters: number
  closingThisWeek: number
  generationsUsed: number
  generationsLimit: number
}

const TOOLS = [
  { href: "/status-update", icon: Mail, title: "Status Update", desc: "Draft client updates" },
  { href: "/title-analysis", icon: FileText, title: "Title Analysis", desc: "Analyze commitments" },
  { href: "/cd-reviewer", icon: Shield, title: "CD Reviewer", desc: "Review disclosures" },
  { href: "/wire-verification", icon: Shield, title: "Wire Verification", desc: "Verify instructions" },
  { href: "/hoa-reviewer", icon: Building, title: "HOA Reviewer", desc: "Review HOA docs" },
  { href: "/fee-estimate", icon: Calculator, title: "Fee Estimate", desc: "Generate estimates" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/checklist").then(r => r.ok ? r.json() : { matters: [] }),
      fetch("/api/settings").then(r => r.ok ? r.json() : { user: {} })
    ])
      .then(([mattersData, settingsData]) => {
        const matters = mattersData.matters || []
        const active = matters.filter((m: any) => m.status === "active")
        const closingThisWeek = active.filter((m: any) => {
          if (!m.closingDate) return false
          const days = Math.ceil((new Date(m.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return days >= 0 && days <= 7
        }).length

        setStats({
          activeMatters: active.length,
          closingThisWeek,
          generationsUsed: settingsData.user?.monthlyUsageCount || 0,
          generationsLimit: 100, // TODO: Get from plan
        })
      })
      .catch(() => setStats({ activeMatters: 0, closingThisWeek: 0, generationsUsed: 0, generationsLimit: 100 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-light tracking-[-0.72px] text-foreground mb-2">Dashboard</h1>
          <p className="text-sm font-light text-muted-foreground">Your closing activity overview</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-light text-foreground">{loading ? "–" : stats?.activeMatters}</p>
            </div>
            <p className="text-xs font-light text-muted-foreground">Active matters</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-light text-foreground">{loading ? "–" : stats?.closingThisWeek}</p>
            </div>
            <p className="text-xs font-light text-muted-foreground">Closing this week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-light text-foreground">
                {loading ? "–" : `${stats?.generationsUsed}/${stats?.generationsLimit}`}
              </p>
            </div>
            <p className="text-xs font-light text-muted-foreground">AI generations this month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <Link href="/matters?new=1" className="block h-full">
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="text-sm font-normal text-primary">New Matter</p>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-sm font-normal uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TOOLS.map((tool, i) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <tool.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs font-light text-foreground leading-tight mb-1">{tool.title}</p>
                <p className="text-[10px] font-light text-muted-foreground leading-tight">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-normal uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
            <Link href="/history" className="text-xs font-light text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-light text-muted-foreground text-center py-8">
              No recent activity. <Link href="/matters?new=1" className="text-primary hover:underline">Create your first matter</Link> to get started.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
