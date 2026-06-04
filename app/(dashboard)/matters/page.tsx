"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, CheckCircle, AlertCircle, Loader2, FolderOpen } from "lucide-react"
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

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function MattersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(searchParams.get("new") === "1")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ clientName: "", propertyAddress: "", transactionType: "Purchase", closingDate: "", state: "" })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((d) => setMatters(d.matters ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.clientName.trim() || !form.propertyAddress.trim()) {
      setFormError("Client name and property address are required.")
      return
    }
    setCreating(true)
    setFormError("")
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.matter) {
      router.push(`/matters/${data.matter.id}`)
    } else {
      setFormError(data.error ?? "Failed to create matter.")
      setCreating(false)
    }
  }

  const active = matters.filter((m) => m.status === "active")
  const closed = matters.filter((m) => m.status === "closed")
  const closingThisWeek = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d >= 0 && d <= 7 }).length
  const overdueItems = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d < 0 }).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Matters</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} open
            {closingThisWeek > 0 && <span className="ml-2 text-amber-600 font-medium">· {closingThisWeek} closing this week</span>}
            {overdueItems > 0 && <span className="ml-2 text-red-600 font-medium">· {overdueItems} past closing date</span>}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New matter
        </button>
      </div>

      {/* New matter form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">New matter</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                placeholder="e.g. John and Jane Smith"
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Property Address *</label>
              <input
                type="text"
                value={form.propertyAddress}
                onChange={(e) => setForm((p) => ({ ...p, propertyAddress: e.target.value }))}
                placeholder="e.g. 42 Maple Street, Portsmouth, NH"
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
              <select
                value={form.transactionType}
                onChange={(e) => setForm((p) => ({ ...p, transactionType: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">State</label>
              <select
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Closing Date</label>
              <input
                type="date"
                value={form.closingDate}
                onChange={(e) => setForm((p) => ({ ...p, closingDate: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-500 mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Creating..." : "Create matter"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setFormError("") }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
      {!loading && active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No open matters</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create a matter to start tracking a closing</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New matter
          </button>
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
                      <p className="text-sm font-semibold text-foreground truncate">{m.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.propertyAddress} · {m.transactionType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {m.closingDate && (
                        <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
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

export default function MattersPage() {
  return (
    <Suspense>
      <MattersContent />
    </Suspense>
  )
}
