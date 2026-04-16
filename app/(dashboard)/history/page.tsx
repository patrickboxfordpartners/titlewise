"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FileText, FileSearch, Clock, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Search, RotateCcw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusUpdateEntry = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingStage: string
  completedItems: string | null
  outstandingItems: string | null
  upcomingDeadlines: string | null
  additionalNotes: string | null
  tone: string | null
  generatedEmail: string | null
  createdAt: string
}

type TitleAnalysisEntry = {
  id: string
  propertyAddress: string | null
  redFlagCount: number | null
  analysis: Record<string, unknown>
  createdAt: string
}

type Tab = "updates" | "analyses"

export default function HistoryPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("updates")
  const [updates, setUpdates] = useState<StatusUpdateEntry[]>([])
  const [analyses, setAnalyses] = useState<TitleAnalysisEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const params = debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : ""
    const res = await fetch(`/api/history${params}`)
    const data = await res.json()
    setUpdates(data.updates ?? [])
    setAnalyses(data.analyses ?? [])
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleRegenerate(u: StatusUpdateEntry) {
    const params = new URLSearchParams({
      clientName: u.clientName,
      propertyAddress: u.propertyAddress,
      transactionType: u.transactionType,
      closingStage: u.closingStage,
      ...(u.completedItems && { completedItems: u.completedItems }),
      ...(u.outstandingItems && { outstandingItems: u.outstandingItems }),
      ...(u.upcomingDeadlines && { upcomingDeadlines: u.upcomingDeadlines }),
      ...(u.additionalNotes && { additionalNotes: u.additionalNotes }),
      ...(u.tone && { tone: u.tone }),
    })
    router.push(`/status-update?${params.toString()}`)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Past generated emails and title analyses.</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="relative mb-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name or property address..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground"
        />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1 mb-6 w-fit"
      >
        <button
          onClick={() => setTab("updates")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "updates" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Status Updates ({updates.length})
        </button>
        <button
          onClick={() => setTab("analyses")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "analyses" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileSearch className="h-3.5 w-3.5" />
          Title Analyses ({analyses.length})
        </button>
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40 mx-auto" />
        </div>
      ) : tab === "updates" ? (
        updates.length === 0 ? (
          <EmptyState icon={FileText} message={search ? "No matching updates" : "No status updates yet"} />
        ) : (
          <div className="space-y-2">
            {updates.map((u, i) => {
              const isExpanded = expandedId === u.id
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.propertyAddress} · {u.closingStage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground/60 hidden sm:flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(u.createdAt)}
                      </span>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                      </motion.div>
                    </div>
                  </button>
                  {isExpanded && u.generatedEmail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 border-t border-border pt-3">
                        <div className="flex justify-end gap-2 mb-2">
                          <button
                            onClick={() => handleRegenerate(u)}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Re-generate
                          </button>
                          <button
                            onClick={() => handleCopy(u.id, u.generatedEmail!)}
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                              copiedId === u.id ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                          >
                            {copiedId === u.id ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                          </button>
                        </div>
                        <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 max-h-64 overflow-y-auto border border-border">
                          {u.generatedEmail}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )
      ) : analyses.length === 0 ? (
        <EmptyState icon={FileSearch} message={search ? "No matching analyses" : "No title analyses yet"} />
      ) : (
        <div className="space-y-2">
          {analyses.map((a, i) => {
            const summary = (a.analysis as { summary?: string })?.summary
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="bg-card rounded-xl border border-border px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSearch className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.propertyAddress ?? "Unknown property"}
                    </p>
                    {(a.redFlagCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        {a.redFlagCount} flag{a.redFlagCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground/60 hidden sm:flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDate(a.createdAt)}
                  </span>
                </div>
                {summary && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{summary}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof FileText; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Generated content will appear here automatically.</p>
    </motion.div>
  )
}
