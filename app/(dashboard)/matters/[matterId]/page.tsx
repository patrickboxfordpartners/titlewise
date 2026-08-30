"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, Plus, Trash2, ArrowLeft, CheckCircle, Circle,
  FileText, FileSearch, FileCheck, Shield, Building, DollarSign,
  Calculator, ClipboardList, ChevronDown, Share2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import PartiesPanel from "@/components/parties-panel"
import DocumentSlotsPanel from "@/components/document-slots-panel"
import EmailThreadsPanel from "@/components/email-threads-panel"
import ClosingAgentPanel from "@/components/closing-agent-panel"
import NeilChat from "@/components/neil-chat"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  state: string | null
  status: string
  portalToken: string | null
}

type Item = {
  id: string
  title: string
  assignedTo: string | null
  status: string
  dueDate: string | null
  sortOrder: number
}

const PARTIES = ["attorney", "buyer", "seller", "lender", "title_company", "agent"]
const STATUS_CYCLE = ["pending", "in_progress", "complete"] as const

const TOOLS = [
  { href: "/status-update", icon: FileText, title: "Status Update", description: "Draft a client update email" },
  { href: "/title-analysis", icon: FileSearch, title: "Title Analysis", description: "Analyze title commitment" },
  { href: "/cd-reviewer", icon: FileCheck, title: "CD Reviewer", description: "Review closing disclosure" },
  { href: "/wire-verification", icon: Shield, title: "Wire Verification", description: "Verify wire instructions" },
  { href: "/hoa-reviewer", icon: Building, title: "HOA Reviewer", description: "Review HOA documents" },
  { href: "/fee-estimate", icon: DollarSign, title: "Fee Estimate", description: "Generate fee estimate letter" },
  { href: "/proration-calculator", icon: Calculator, title: "Tax Proration", description: "Calculate prorations" },
]

function matterQueryParams(matter: Matter, checklistItems?: Item[]): string {
  const params = new URLSearchParams({
    matterId: matter.id,
    clientName: matter.clientName,
    propertyAddress: matter.propertyAddress,
    transactionType: matter.transactionType,
  })
  if (matter.closingDate) params.set("closingDate", matter.closingDate.split("T")[0])
  if (checklistItems) {
    const completed = checklistItems
      .filter(i => i.status === "complete")
      .map(i => i.title)
      .join("\n")
    const outstanding = checklistItems
      .filter(i => i.status !== "complete")
      .map(i => i.title)
      .join("\n")
    if (completed) params.set("completedItems", completed)
    if (outstanding) params.set("outstandingItems", outstanding)
  }
  return params.toString()
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function MatterDetailPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = use(params)
  const router = useRouter()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [newAssigned, setNewAssigned] = useState("")
  const [addingItem, setAddingItem] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [portalCopied, setPortalCopied] = useState(false)
  const [closingMatter, setClosingMatter] = useState(false)
  const [generatingPortal, setGeneratingPortal] = useState(false)
  const [reopeningMatter, setReopeningMatter] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/checklist/${matterId}`)
      if (!res.ok) { router.push("/matters"); return }
      const data = await res.json()
      setMatter(data.matter)
      setItems(data.items ?? [])
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [matterId, router])

  async function toggleStatus(item: Item) {
    const idx = STATUS_CYCLE.indexOf(item.status as typeof STATUS_CYCLE[number])
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i))
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: next }),
    })
  }

  async function addItem() {
    if (!newTitle.trim()) return
    setAddingItem(true)
    const res = await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", title: newTitle.trim(), assignedTo: newAssigned || undefined }),
    })
    const data = await res.json()
    if (data.item) {
      setItems((prev) => [...prev, data.item])
      setNewTitle("")
      setNewAssigned("")
    }
    setAddingItem(false)
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
    if (!confirm("Mark this matter as closed?")) return
    setClosingMatter(true)
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    })
    router.push("/matters")
  }

  async function reopenMatter() {
    setReopeningMatter(true)
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    })
    if (matter) setMatter({ ...matter, status: "active" })
    setReopeningMatter(false)
  }

  function copyPortalUrl() {
    if (!matter?.portalToken) return
    const url = `${window.location.origin}/matter-portal/${matter.portalToken}`
    navigator.clipboard.writeText(url)
    setPortalCopied(true)
    setTimeout(() => setPortalCopied(false), 2000)
  }

  async function generatePortal() {
    setGeneratingPortal(true)
    const res = await fetch(`/api/checklist/portal?matterId=${matterId}`, { method: "POST" })
    const data = await res.json()
    if (data.url) {
      if (matter) setMatter({ ...matter, portalToken: data.token })
      navigator.clipboard.writeText(data.url)
      setPortalCopied(true)
      setTimeout(() => setPortalCopied(false), 2000)
    }
    setGeneratingPortal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!matter) return null

  const completed = items.filter((i) => i.status === "complete").length
  const total = items.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const days = daysUntil(matter.closingDate)
  const isUrgent = days !== null && days >= 0 && days <= 7
  const isOverdue = days !== null && days < 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Back */}
      <Link href="/matters" className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        All matters
      </Link>

      {/* Matter header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-foreground tracking-[-0.2px]">{matter.clientName}</h1>
            <p className="text-sm font-light text-muted-foreground mt-0.5">{matter.propertyAddress}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-light">{matter.transactionType}</span>
              {matter.state && <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-light">{matter.state}</span>}
              {matter.closingDate && (
                <span className={cn("text-xs font-light", isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground")}>
                  Closing {new Date(matter.closingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {isUrgent && !isOverdue && ` · ${days}d`}
                  {isOverdue && " · Past due"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {matter.portalToken ? (
              <button
                onClick={copyPortalUrl}
                className="flex items-center gap-1.5 text-xs font-light px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {portalCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
                {portalCopied ? "Copied" : "Portal"}
              </button>
            ) : (
              <button
                onClick={generatePortal}
                disabled={generatingPortal}
                className="flex items-center gap-1.5 text-xs font-light px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-60"
              >
                {generatingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                {generatingPortal ? "Generating..." : "Share portal"}
              </button>
            )}
            {matter.status === "active" ? (
              <button
                onClick={closeMatter}
                disabled={closingMatter}
                className="text-xs font-light px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {closingMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Close matter"}
              </button>
            ) : (
              <button
                onClick={reopenMatter}
                disabled={reopeningMatter}
                className="text-xs font-light px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {reopeningMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reopen"}
              </button>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-light text-muted-foreground shrink-0">{completed}/{total} complete</span>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="mb-6">
        <p className="text-xs font-normal uppercase tracking-widest text-muted-foreground mb-3">Tools</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TOOLS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={`${href}?${matterQueryParams(matter, href === "/status-update" ? items : undefined)}`}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all duration-150"
            >
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-light text-foreground leading-tight">{title}</p>
              <p className="text-[10px] font-light text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Closing Agent */}
      <div className="mb-6">
        <ClosingAgentPanel matterId={matterId} />
      </div>

      {/* Parties */}
      <div className="mb-6">
        <PartiesPanel matterId={matterId} />
      </div>

      {/* Document Slots */}
      <div className="mb-6">
        <DocumentSlotsPanel matterId={matterId} />
      </div>

      {/* Email Thread */}
      <div className="mb-6">
        <EmailThreadsPanel matterId={matterId} />
      </div>

      {/* Checklist */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setChecklistOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-light text-foreground">Closing Checklist</span>
            <span className="text-xs font-light text-muted-foreground">({completed}/{total})</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", checklistOpen ? "rotate-180" : "")} />
        </button>

        <AnimatePresence>
          {checklistOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                {items.length === 0 && (
                  <p className="px-5 py-4 text-sm font-light text-muted-foreground">No checklist items yet.</p>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    <button onClick={() => toggleStatus(item)} className="shrink-0">
                      {item.status === "complete"
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : item.status === "in_progress"
                        ? <Circle className="h-4 w-4 text-amber-500" />
                        : <Circle className="h-4 w-4 text-muted-foreground/40" />
                      }
                    </button>
                    <span className={cn("flex-1 text-sm font-light", item.status === "complete" ? "line-through text-muted-foreground" : "text-foreground")}>
                      {item.title}
                    </span>
                    {item.assignedTo && (
                      <span className="text-[10px] font-light text-muted-foreground/60 shrink-0 capitalize">{item.assignedTo.replace("_", " ")}</span>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}

                {/* Add item */}
                <div className="px-5 py-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      placeholder="Add checklist item..."
                      className="flex-1 text-sm font-light bg-muted/40 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
                    />
                    <select
                      value={newAssigned}
                      onChange={(e) => setNewAssigned(e.target.value)}
                      className="text-xs font-light bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-muted-foreground"
                    >
                      <option value="">Assign to</option>
                      {PARTIES.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
                    </select>
                    <button
                      onClick={addItem}
                      disabled={addingItem || !newTitle.trim()}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-normal rounded-full hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                      {addingItem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Neil Chat */}
      <NeilChat matterId={matterId} />
    </div>
  )
}
