"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle, Circle, Clock, FileText, FileSearch, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"

type Item = {
  id: string
  title: string
  assignedTo: string | null
  status: string
  dueDate: string | null
  sortOrder: number
}

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
}

const PARTIES = ["attorney", "buyer", "seller", "lender", "title_company", "agent"]
const STATUS_CYCLE = ["pending", "in_progress", "complete"] as const

export default function MatterDetailPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = use(params)
  const router = useRouter()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [newAssigned, setNewAssigned] = useState("")
  const [adding, setAdding] = useState(false)

  async function fetchData() {
    const res = await fetch(`/api/checklist/${matterId}`)
    if (!res.ok) { router.push("/checklist"); return }
    const data = await res.json()
    setMatter(data.matter)
    setItems(data.items)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [matterId])

  async function toggleStatus(item: Item) {
    const currentIdx = STATUS_CYCLE.indexOf(item.status as typeof STATUS_CYCLE[number])
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: nextStatus } : i))
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: nextStatus }),
    })
  }

  async function addItem() {
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", title: newTitle, assignedTo: newAssigned || undefined }),
    })
    const data = await res.json()
    if (data.item) setItems((prev) => [...prev, data.item])
    setNewTitle(""); setNewAssigned("")
    setAdding(false)
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", itemId }),
    })
  }

  async function closeMatter() {
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    })
    router.push("/checklist")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
      </div>
    )
  }
  if (!matter) return null

  const total = items.length
  const complete = items.filter((i) => i.status === "complete").length
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0

  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const key = item.assignedTo || "unassigned"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const partyLabels: Record<string, string> = {
    attorney: "Attorney", buyer: "Buyer", seller: "Seller",
    lender: "Lender", title_company: "Title Company", agent: "Agent", unassigned: "Unassigned",
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <button
          onClick={() => router.push("/checklist")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          All Matters
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{matter.clientName}</h1>
            <p className="text-sm text-muted-foreground">{matter.propertyAddress} · {matter.transactionType}</p>
            {matter.closingDate && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Closing: {new Date(matter.closingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PrintButton label="Print Checklist" />
            {matter.status === "active" && (
              <button
                onClick={closeMatter}
                className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
              >
                Close Matter
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-primary")}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <span className="text-sm font-medium text-foreground">{pct}%</span>
          <span className="text-xs text-muted-foreground">{complete}/{total}</span>
        </div>
      </motion.div>

      {/* Quick actions */}
      {matter.status === "active" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="flex flex-wrap gap-2 pb-4"
        >
          {[
            {
              href: `/status-update?clientName=${encodeURIComponent(matter.clientName)}&propertyAddress=${encodeURIComponent(matter.propertyAddress)}&transactionType=${encodeURIComponent(matter.transactionType)}`,
              icon: FileText,
              label: "Status Update",
            },
            { href: "/title-analysis", icon: FileSearch, label: "Title Analysis" },
            { href: "/cd-reviewer", icon: FileCheck, label: "CD Review" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary border border-border hover:border-primary/30 bg-card px-3 py-1.5 rounded-lg transition-colors"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </motion.div>
      )}

      {/* Items grouped by party */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => {
            const order = ["attorney", "buyer", "seller", "lender", "title_company", "agent", "unassigned"]
            return order.indexOf(a) - order.indexOf(b)
          })
          .map(([party, partyItems], groupIdx) => (
            <motion.div
              key={party}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + groupIdx * 0.06, duration: 0.3 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {partyLabels[party] ?? party}
                </span>
                <span className="text-xs text-muted-foreground/50 ml-2">
                  {partyItems.filter((i) => i.status === "complete").length}/{partyItems.length}
                </span>
              </div>
              <div className="divide-y divide-border/50">
                <AnimatePresence>
                  {partyItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 px-4 py-2.5 group"
                    >
                      <button onClick={() => toggleStatus(item)} className="shrink-0">
                        {item.status === "complete" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : item.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" />
                        )}
                      </button>
                      <span className={cn(
                        "text-sm flex-1 transition-colors",
                        item.status === "complete" ? "text-muted-foreground/50 line-through" : "text-foreground/80"
                      )}>
                        {item.title}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-red-500 transition-colors" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Add item */}
      {matter.status === "active" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mt-4 bg-card rounded-xl border border-border p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a checklist item..."
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <select
              value={newAssigned}
              onChange={(e) => setNewAssigned(e.target.value)}
              className="text-sm text-foreground bg-muted/40 border border-border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Assign to...</option>
              {PARTIES.map((p) => <option key={p} value={p}>{partyLabels[p]}</option>)}
            </select>
            <button
              onClick={addItem}
              disabled={adding || !newTitle.trim()}
              className="px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
