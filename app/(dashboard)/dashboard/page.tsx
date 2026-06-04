"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, FolderOpen, Plus, Clock } from "lucide-react"

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

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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

export default function DashboardPage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/checklist").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([mattData, settData]) => {
      setMatters(mattData.matters ?? [])
      setUserName(settData.name ?? null)
    }).finally(() => setLoading(false))
  }, [])

  const active = matters.filter((m) => m.status === "active")
  const closingThisWeek = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d >= 0 && d <= 7 })
  const overdue = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d < 0 })
  const other = active.filter((m) => {
    const d = daysUntil(m.closingDate)
    return d === null || d > 7
  })

  function MatterCard({ m }: { m: Matter }) {
    const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
    const days = daysUntil(m.closingDate)
    const isUrgent = days !== null && days >= 0 && days <= 7
    const isOverdue = days !== null && days < 0
    return (
      <Link href={`/matters/${m.id}`}>
        <motion.div
          className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all duration-200"
          whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{m.clientName}</p>
              <p className="text-xs text-muted-foreground truncate">{m.propertyAddress.split(",")[0]}</p>
            </div>
            {m.closingDate && (
              <span className={`text-xs font-medium shrink-0 ml-2 ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
                {formatDate(m.closingDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{m.completedItems}/{m.totalItems}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {formatRelative(m.updatedAt)}
          </p>
        </motion.div>
      </Link>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {userName ? `Good morning, ${userName.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {active.length} open matter{active.length !== 1 ? "s" : ""}
          {closingThisWeek.length > 0 && <span className="text-amber-600 font-medium"> · {closingThisWeek.length} closing this week</span>}
          {overdue.length > 0 && <span className="text-red-600 font-medium"> · {overdue.length} past closing date</span>}
        </p>
      </div>

      {!loading && active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No open matters</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first matter to start tracking a closing</p>
          <Link
            href="/matters?new=1"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New matter
          </Link>
        </div>
      )}

      {closingThisWeek.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Closing This Week</p>
          </div>
          <div className="space-y-2">
            {closingThisWeek.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {overdue.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Past Closing Date</p>
          </div>
          <div className="space-y-2">
            {overdue.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open</p>
          </div>
          <div className="space-y-2">
            {other.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
    </div>
  )
}
