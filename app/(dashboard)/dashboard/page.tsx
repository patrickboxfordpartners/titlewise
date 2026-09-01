"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Plus, CheckCircle, AlertCircle, Loader2, FolderOpen,
  FileText, Shield, Calculator, Building, Mail, Clock, TrendingUp,
} from "lucide-react"
import { US_STATES } from "@/lib/checklist-templates"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
  totalItems: number
  completedItems: number
  updatedAt: string
}

type DashboardStats = {
  activeMatters: number
  closingThisWeek: number
  generationsUsed: number
  generationsLimit: number
}

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

const TOOLS = [
  { href: "/status-update", icon: Mail, title: "Status Update", desc: "Draft client updates" },
  { href: "/title-analysis", icon: FileText, title: "Title Analysis", desc: "Analyze commitments" },
  { href: "/cd-reviewer", icon: Shield, title: "CD Reviewer", desc: "Review disclosures" },
  { href: "/wire-verification", icon: Shield, title: "Wire Verification", desc: "Verify instructions" },
  { href: "/hoa-reviewer", icon: Building, title: "HOA Reviewer", desc: "Review HOA docs" },
  { href: "/fee-estimate", icon: Calculator, title: "Fee Estimate", desc: "Generate estimates" },
]

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(searchParams.get("new") === "1")
  const [creating, setCreating] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [form, setForm] = useState({
    clientName: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
    transactionType: "Purchase",
    closingDate: "",
    state: ""
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/checklist").then(r => r.ok ? r.json() : { matters: [] }),
      fetch("/api/settings").then(r => r.ok ? r.json() : { user: {} }),
    ])
      .then(([mattersData, settingsData]) => {
        const allMatters = mattersData.matters ?? []
        setMatters(allMatters)
        const active = allMatters.filter((m: Matter) => m.status === "active")
        const closingThisWeek = active.filter((m: Matter) => {
          if (!m.closingDate) return false
          const days = Math.ceil((new Date(m.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return days >= 0 && days <= 7
        }).length

        setStats({
          activeMatters: active.length,
          closingThisWeek,
          generationsUsed: settingsData.user?.monthlyUsageCount || 0,
          generationsLimit: 100,
        })
      })
      .catch(() => {
        setMatters([])
        setStats({ activeMatters: 0, closingThisWeek: 0, generationsUsed: 0, generationsLimit: 100 })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.clientName.trim() || !form.propertyAddress.trim()) {
      setFormError("Client name and property address are required.")
      return
    }
    setCreating(true)
    setFormError("")

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setFormError(data.error ?? "Failed to create matter.")
        return
      }
      const data = await res.json()
      router.push(`/matters/${data.matter.id}`)
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const active = matters.filter((m) => m.status === "active")
  const closed = matters.filter((m) => m.status === "closed")

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-[-0.72px] text-foreground">Dashboard</h1>
          <p className="text-sm font-light text-muted-foreground mt-0.5">Your closing activity overview</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-normal rounded-full hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New matter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            <p className="text-2xl font-light text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? "-" : stats?.activeMatters}
            </p>
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
            <p className="text-2xl font-light text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? "-" : stats?.closingThisWeek}
            </p>
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
            <p className="text-2xl font-light text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              {loading ? "-" : `${stats?.generationsUsed}/${stats?.generationsLimit}`}
            </p>
          </div>
          <p className="text-xs font-light text-muted-foreground">AI generations this month</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8"
      >
        <h2 className="text-xs font-normal uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TOOLS.map((tool) => (
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

      {/* New matter form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm"
        >
          <h2 className="text-sm font-light text-foreground mb-4">New matter</h2>
          <div className="mb-3">
            <label className="text-xs font-light text-muted-foreground block mb-1">Client Name *</label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              placeholder="e.g. John and Jane Smith"
              className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-light text-muted-foreground block mb-1">Street Address *</label>
            <input
              type="text"
              value={form.propertyAddress}
              onChange={(e) => setForm((p) => ({ ...p, propertyAddress: e.target.value }))}
              placeholder="e.g. 42 Maple Street"
              className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs font-light text-muted-foreground block mb-1">City *</label>
              <input
                type="text"
                value={form.propertyCity}
                onChange={(e) => setForm((p) => ({ ...p, propertyCity: e.target.value }))}
                placeholder="e.g. Portsmouth"
                className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-light text-muted-foreground block mb-1">State *</label>
              <select
                value={form.propertyState}
                onChange={(e) => setForm((p) => ({ ...p, propertyState: e.target.value, state: e.target.value }))}
                className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-light text-muted-foreground block mb-1">ZIP Code *</label>
              <input
                type="text"
                value={form.propertyZip}
                onChange={(e) => setForm((p) => ({ ...p, propertyZip: e.target.value }))}
                placeholder="e.g. 03801"
                className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-light text-muted-foreground block mb-1">Transaction Type</label>
              <select
                value={form.transactionType}
                onChange={(e) => setForm((p) => ({ ...p, transactionType: e.target.value }))}
                className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-light text-muted-foreground block mb-1">Closing Date</label>
              <input
                type="date"
                value={form.closingDate}
                onChange={(e) => setForm((p) => ({ ...p, closingDate: e.target.value }))}
                className="w-full text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {formError && <p className="text-xs font-light text-red-500 mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-normal rounded-full hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Creating..." : "Create matter"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setFormError("") }}
              className="px-4 py-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && active.length === 0 && !showCreate && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-light text-foreground mb-2 tracking-[-0.2px]">Create your first matter</h2>
          <p className="text-sm font-light text-muted-foreground mb-6 max-w-sm mx-auto">
            Matters are the foundation of TITLEwise. Each matter represents a real estate closing with its own checklist, documents, and AI tools.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
            <p className="text-xs font-normal uppercase tracking-widest text-muted-foreground mb-3">
              What you'll track
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-light text-foreground">Auto-generated closing checklist</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-light text-foreground">Document uploads and analysis</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-light text-foreground">Client communication and status updates</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-light text-foreground">Wire verification and fee calculations</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-6 py-2 bg-primary text-white text-base font-normal rounded-full hover:bg-primary/90 transition-colors mx-auto shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Create your first matter
          </button>
        </div>
      )}

      {/* Matters heading */}
      {!loading && active.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-normal uppercase tracking-widest text-muted-foreground">
            Matters
            <span className="ml-2 text-foreground">{active.length}</span>
          </h2>
        </div>
      )}

      {/* Active matters */}
      {!loading && active.length > 0 && (
        <div className="space-y-3 mb-8">
          {active.map((m) => {
            const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
            const days = daysUntil(m.closingDate)
            const isUrgent = days !== null && days >= 0 && days <= 7
            const isOverdue = days !== null && days < 0
            const borderColor = isOverdue ? "border-red-200" : isUrgent ? "border-amber-200" : "border-border"
            const progressColor = isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-primary"

            return (
              <Link key={m.id} href={`/matters/${m.id}`}>
                <motion.div
                  className={`bg-card rounded-xl border ${borderColor} p-5 hover:shadow-sm transition-all duration-200`}
                  whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-light text-foreground truncate">{m.clientName}</p>
                      <p className="text-xs font-light text-muted-foreground truncate">{m.propertyAddress} · {m.transactionType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {m.closingDate && (
                        <span className={`text-xs font-light ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
                          {isOverdue ? "Closed " : ""}{formatDate(m.closingDate)}
                        </span>
                      )}
                      {isUrgent && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {m.completedItems}/{m.totalItems}
                    </div>
                  </div>
                  <p className="text-[10px] font-light text-muted-foreground/60 mt-1.5">
                    Updated {formatRelative(m.updatedAt)}
                  </p>
                </motion.div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Closed matters */}
      {!loading && closed.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Closed</p>
          <div className="space-y-2">
            {closed.slice(0, 5).map((m) => (
              <Link key={m.id} href={`/matters/${m.id}`} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{m.clientName}</p>
                  <p className="text-xs text-muted-foreground/60 truncate">{m.propertyAddress}</p>
                </div>
                {m.closingDate && (
                  <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(m.closingDate)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
