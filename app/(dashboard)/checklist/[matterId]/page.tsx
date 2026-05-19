"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle, Circle, Clock, FileText, FileSearch, FileCheck, Share2, Check, Bot, AlertTriangle, ChevronDown, Building, DollarSign, Shield, GanttChart, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"
import { ClosingGantt } from "@/components/closing-gantt"

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
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [sharingPortal, setSharingPortal] = useState(false)
  const [copiedPortal, setCopiedPortal] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentReport, setAgentReport] = useState<any | null>(null)
  const [showAgentReport, setShowAgentReport] = useState(false)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [view, setView] = useState<"checklist" | "timeline">("checklist")

  type ActivityItem = { id: string; type: string; label: string; sub: string; createdAt: string }

  async function runAgent() {
    if (!matter) return
    setAgentRunning(true)
    setAgentReport(null)
    try {
      const res = await fetch("/api/agent/analyze-matter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matterId: matter.id }),
      })
      const d = await res.json()
      if (d.report) {
        setAgentReport(d)
        setShowAgentReport(true)
        // Reload items if agent updated any
        if (d.updatedItems > 0) {
          const r = await fetch(`/api/checklist/${matter.id}`)
          const data = await r.json()
          if (data.items) setItems(data.items)
        }
      }
    } catch {
      alert("Agent analysis failed. Please try again.")
    } finally {
      setAgentRunning(false)
    }
  }

  async function sharePortal() {
    if (!matter) return
    setSharingPortal(true)
    const res = await fetch(`/api/checklist/portal?matterId=${matter.id}`, { method: "POST" })
    const d = await res.json()
    if (d.url) setPortalUrl(d.url)
    setSharingPortal(false)
  }

  function copyPortalUrl() {
    if (!portalUrl) return
    navigator.clipboard.writeText(portalUrl)
    setCopiedPortal(true)
    setTimeout(() => setCopiedPortal(false), 2000)
  }

  async function fetchData() {
    const res = await fetch(`/api/checklist/${matterId}`)
    if (!res.ok) { router.push("/checklist"); return }
    const data = await res.json()
    setMatter(data.matter)
    setItems(data.items)
    setLoading(false)
  }

  async function fetchActivity() {
    const res = await fetch(`/api/checklist/${matterId}/activity`)
    if (!res.ok) return
    const data = await res.json()
    const items: ActivityItem[] = [
      ...(data.updates ?? []).map((u: any) => ({ id: "u-" + u.id, type: "status", label: u.closingStage, sub: "Status Update", createdAt: u.createdAt })),
      ...(data.analyses ?? []).map((a: any) => ({ id: "a-" + a.id, type: "title", label: a.propertyAddress ?? "Title Analysis", sub: `Title Analysis${a.redFlagCount ? ` · ${a.redFlagCount} flags` : ""}`, createdAt: a.createdAt })),
      ...(data.cdReviews ?? []).map((r: any) => ({ id: "cd-" + r.id, type: "cd", label: r.propertyAddress ?? "CD Review", sub: `CD Review${r.discrepancyCount ? ` · ${r.discrepancyCount} discrepancies` : ""}`, createdAt: r.createdAt })),
      ...(data.hoaReviews ?? []).map((r: any) => ({ id: "hoa-" + r.id, type: "hoa", label: r.associationName ?? "HOA Review", sub: `HOA Review${r.redFlagCount ? ` · ${r.redFlagCount} flags` : ""}`, createdAt: r.createdAt })),
      ...(data.feeEstimates ?? []).map((r: any) => ({ id: "fee-" + r.id, type: "fee", label: r.clientName, sub: `Fee Estimate · ${r.transactionType}`, createdAt: r.createdAt })),
      ...(data.wireInstructions ?? []).map((r: any) => ({ id: "wire-" + r.id, type: "wire", label: r.bankName ?? "Wire Check", sub: r.beneficiary ?? "Wire Verification", createdAt: r.createdAt })),
    ]
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setActivity(items)
  }

  useEffect(() => { fetchData() }, [matterId])
  useEffect(() => { fetchActivity() }, [matterId])

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

  // Build Gantt tasks from checklist items
  const ganttTasks = (() => {
    const today = new Date()
    const closing = matter.closingDate ? new Date(matter.closingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const totalDays = Math.max(1, (closing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item, idx) => {
        // Use dueDate if set, otherwise spread evenly toward closing
        const endDate = item.dueDate
          ? new Date(item.dueDate)
          : new Date(today.getTime() + ((idx + 1) / items.length) * totalDays * 24 * 60 * 60 * 1000)
        const startDate = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000) // 2-day default duration

        const customClass =
          item.status === "complete" ? "bar-complete" :
          item.status === "in_progress" ? "" :
          "bar-pending"

        const fmt = (d: Date) => d.toISOString().split("T")[0]

        return {
          id: item.id,
          name: item.title.length > 40 ? item.title.slice(0, 38) + "…" : item.title,
          start: fmt(startDate),
          end: fmt(endDate),
          progress: item.status === "complete" ? 100 : item.status === "in_progress" ? 50 : 0,
          custom_class: customClass,
        }
      })
  })()

  async function handleGanttDateChange(taskId: string, start: Date, end: Date) {
    if (!matter) return
    const dueDate = end.toISOString().split("T")[0]
    setItems((prev) => prev.map((i) => i.id === taskId ? { ...i, dueDate } : i))
    await fetch(`/api/checklist/${matter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: taskId, dueDate }),
    })
  }

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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runAgent}
              disabled={agentRunning}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              {agentRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
              {agentRunning ? "Analyzing..." : "Run Agent"}
            </button>
            <PrintButton label="Print Checklist" />
            <button
              onClick={portalUrl ? copyPortalUrl : sharePortal}
              disabled={sharingPortal}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {sharingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
               copiedPortal ? <Check className="h-3.5 w-3.5" /> :
               <Share2 className="h-3.5 w-3.5" />}
              {copiedPortal ? "Copied!" : portalUrl ? "Copy Link" : "Share Portal"}
            </button>
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
              href: `/status-update?matterId=${matter.id}&clientName=${encodeURIComponent(matter.clientName)}&propertyAddress=${encodeURIComponent(matter.propertyAddress)}&transactionType=${encodeURIComponent(matter.transactionType)}`,
              icon: FileText,
              label: "Status Update",
            },
            { href: `/title-analysis?matterId=${matter.id}`, icon: FileSearch, label: "Title Analysis" },
            { href: `/cd-reviewer?matterId=${matter.id}`, icon: FileCheck, label: "CD Review" },
            { href: `/wire-verification?matterId=${matter.id}`, icon: Shield, label: "Wire Check" },
            { href: `/hoa-reviewer?matterId=${matter.id}`, icon: Building, label: "HOA Review" },
            { href: `/fee-estimate?matterId=${matter.id}&clientName=${encodeURIComponent(matter.clientName)}&transactionType=${encodeURIComponent(matter.transactionType)}`, icon: DollarSign, label: "Fee Estimate" },
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

      {/* Activity feed */}
      {activity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="mb-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Tool Activity</p>
          <div className="bg-card rounded-xl border border-border divide-y divide-border/50">
            {activity.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  {item.type === "status" && <FileText className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "title" && <FileSearch className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "cd" && <FileCheck className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "hoa" && <Building className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "fee" && <DollarSign className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "wire" && <Shield className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* View toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex items-center gap-1 mb-4 bg-muted/30 rounded-lg p-1 w-fit"
      >
        <button
          onClick={() => setView("checklist")}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
            view === "checklist" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="h-3.5 w-3.5" />
          Checklist
        </button>
        <button
          onClick={() => setView("timeline")}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
            view === "timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GanttChart className="h-3.5 w-3.5" />
          Timeline
        </button>
      </motion.div>

      {/* Timeline view */}
      {view === "timeline" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <ClosingGantt
            tasks={ganttTasks}
            readonly={matter.status !== "active"}
            onDateChange={handleGanttDateChange}
          />
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            {matter.status === "active" ? "Drag bars to update due dates. " : ""}
            Items without due dates are spread evenly toward the closing date.
          </p>
        </motion.div>
      )}

      {/* Items grouped by party */}
      <div className={cn("space-y-4", view === "timeline" && "hidden")}>
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
      {/* Agent Report */}
      {showAgentReport && agentReport?.report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Closing Coordinator Report</h3>
              {agentReport.updatedItems > 0 && (
                <span className="text-xs bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md">{agentReport.updatedItems} items auto-updated</span>
              )}
            </div>
            <button onClick={() => setShowAgentReport(false)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
          </div>

          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
            agentReport.report.overall_status === "on_track" ? "bg-green-500/10 text-green-700" :
            agentReport.report.overall_status === "needs_attention" ? "bg-amber-500/10 text-amber-700" :
            "bg-red-500/10 text-red-700"
          }`}>
            {agentReport.report.overall_status?.replace(/_/g, " ").toUpperCase()}
          </div>

          <p className="text-sm text-foreground/80">{agentReport.report.status_summary}</p>

          {agentReport.report.immediate_actions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Immediate Actions</p>
              {agentReport.report.immediate_actions.map((a: any, i: number) => (
                <div key={i} className="flex gap-2 text-sm mb-2">
                  <span className={`shrink-0 text-xs font-bold mt-0.5 ${a.urgency === "today" ? "text-red-500" : a.urgency === "this_week" ? "text-amber-500" : "text-muted-foreground"}`}>
                    {a.urgency?.replace(/_/g, " ")}
                  </span>
                  <div>
                    <span className="font-medium">{a.action}</span>
                    <span className="text-muted-foreground ml-2">→ {a.assigned_to}</span>
                    {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {agentReport.report.blockers?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Blockers
              </p>
              {agentReport.report.blockers.map((b: any, i: number) => (
                <div key={i} className="text-sm mb-2">
                  <span className="font-medium">{b.item}</span>
                  {b.resolution && <p className="text-xs text-muted-foreground mt-0.5">Fix: {b.resolution}</p>}
                </div>
              ))}
            </div>
          )}

          {agentReport.report.draft_status_email && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Draft Status Email (saved to History)</p>
              <div className="bg-card border border-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap">
                {`Subject: ${agentReport.report.draft_status_email.subject}\n\n${agentReport.report.draft_status_email.body}`}
              </div>
            </div>
          )}
        </motion.div>
      )}

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
