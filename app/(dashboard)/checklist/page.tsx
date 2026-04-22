"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Plus, FolderOpen, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
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
  createdAt: string
}

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

export default function ChecklistPage() {
  const [mattersList, setMattersList] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ clientName: "", propertyAddress: "", transactionType: "Purchase", closingDate: "", state: "" })

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((d) => setMattersList(d.matters ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.clientName || !form.propertyAddress) return
    setCreating(true)
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.matter) {
      window.location.href = `/checklist/${data.matter.id}`
    }
    setCreating(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Closing Checklists</h1>
          <p className="text-sm text-muted-foreground mt-1">Track every item across your active files.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> New Matter
        </button>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="John and Jane Smith"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Property Address</label>
                  <input
                    type="text"
                    value={form.propertyAddress}
                    onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                    placeholder="42 Maple St, Portsmouth, NH"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Type</label>
                  <select
                    value={form.transactionType}
                    onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                    className={inputClass}
                  >
                    {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Closing Date</label>
                  <input
                    type="date"
                    value={form.closingDate}
                    onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">State <span className="text-muted-foreground/60">(optional — adds state-specific items)</span></label>
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass}>
                    <option value="">Select state...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !form.clientName || !form.propertyAddress}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</> : "Create & Generate Checklist"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matters list */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40 mx-auto" />
        </div>
      ) : mattersList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">No matters yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click "New Matter" to create your first closing checklist.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {mattersList.map((m, i) => {
            const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link
                  href={`/checklist/${m.id}`}
                  className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.propertyAddress}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground/60">{m.transactionType}</span>
                      {m.status === "closed" && (
                        <span className="text-[10px] font-medium bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">Closed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-primary")}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <CheckCircle className="h-3 w-3" />
                      {m.completedItems}/{m.totalItems}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
