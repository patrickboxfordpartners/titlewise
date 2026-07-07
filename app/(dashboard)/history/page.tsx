"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText, FileSearch, Clock, Copy, Check, ChevronDown,
  AlertTriangle, Search, RotateCcw, Loader2, FileCheck,
  Building, DollarSign, CheckCircle, XCircle, FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type StatusUpdateEntry = {
  id: string; clientName: string; propertyAddress: string
  transactionType: string; closingStage: string
  completedItems: string | null; outstandingItems: string | null
  upcomingDeadlines: string | null; additionalNotes: string | null
  tone: string | null; generatedEmail: string | null
  matterId: string | null; createdAt: string
}

type TitleAnalysisEntry = {
  id: string; propertyAddress: string | null; redFlagCount: number | null
  analysis: Record<string, unknown>; matterId: string | null; createdAt: string
}

type CdReviewEntry = {
  id: string; propertyAddress: string | null; buyer: string | null; seller: string | null
  discrepancyCount: number | null; result: Record<string, unknown> | null
  matterId: string | null; createdAt: string
}

type HoaReviewEntry = {
  id: string; associationName: string | null; redFlagCount: number | null
  result: Record<string, unknown> | null; matterId: string | null; createdAt: string
}

type FeeEstimateEntry = {
  id: string; clientName: string; transactionType: string; jurisdiction: string | null
  generatedLetter: string | null; matterId: string | null; createdAt: string
}

type Tab = "updates" | "analyses" | "cd" | "hoa" | "fees"

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

function ExpandToggle({ expanded }: { expanded: boolean }) {
  return (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
      <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
    </motion.div>
  )
}

function DetailPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-t border-border"
    >
      <div className="px-5 py-4 space-y-4">{children}</div>
    </motion.div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{children}</p>
}

function CopyButton({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (id: string, text: string) => void }) {
  const copied = copiedId === id
  return (
    <button
      onClick={() => onCopy(id, text)}
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
        copied ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  )
}

function MatterLink({ matterId }: { matterId: string | null }) {
  if (!matterId) return null
  return (
    <Link href={`/matters/${matterId}`} className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
      <FolderOpen className="h-3 w-3" /> View matter
    </Link>
  )
}

// ── Status Update detail ──────────────────────────────────────────────────────

function StatusUpdateDetail({ u, copiedId, onCopy, onRegenerate }: {
  u: StatusUpdateEntry; copiedId: string | null
  onCopy: (id: string, text: string) => void; onRegenerate: (u: StatusUpdateEntry) => void
}) {
  return (
    <DetailPanel>
      {u.generatedEmail && (
        <>
          <div className="flex items-center justify-between">
            <SectionHeading>Generated Email</SectionHeading>
            <div className="flex items-center gap-2">
              <MatterLink matterId={u.matterId} />
              <button
                onClick={() => onRegenerate(u)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Re-generate
              </button>
              <CopyButton text={u.generatedEmail} id={u.id} copiedId={copiedId} onCopy={onCopy} />
            </div>
          </div>
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 max-h-72 overflow-y-auto border border-border">
            {u.generatedEmail}
          </pre>
        </>
      )}
    </DetailPanel>
  )
}

// ── Title Analysis detail ─────────────────────────────────────────────────────

function TitleAnalysisDetail({ a, copiedId, onCopy }: {
  a: TitleAnalysisEntry; copiedId: string | null; onCopy: (id: string, text: string) => void
}) {
  const analysis = a.analysis as {
    summary?: string
    requirements?: Array<{ item: string; description: string; flagged: boolean }>
    exceptions?: Array<{ item: string; description: string; flagged: boolean }>
    redFlags?: Array<{ severity: string; issue: string; detail: string }>
  }

  return (
    <DetailPanel>
      <div className="flex items-center justify-between">
        <SectionHeading>Analysis Summary</SectionHeading>
        <div className="flex items-center gap-2">
          <MatterLink matterId={a.matterId} />
          {analysis.summary && <CopyButton text={analysis.summary} id={a.id} copiedId={copiedId} onCopy={onCopy} />}
        </div>
      </div>

      {analysis.summary && (
        <p className="text-sm text-foreground/80 leading-relaxed">{analysis.summary}</p>
      )}

      {(analysis.redFlags ?? []).length > 0 && (
        <div>
          <SectionHeading>Red Flags</SectionHeading>
          <div className="space-y-2">
            {analysis.redFlags!.map((f, i) => (
              <div key={i} className={cn(
                "rounded-lg px-3 py-2 text-xs border",
                f.severity === "high" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20"
              )}>
                <p className={cn("font-semibold mb-0.5", f.severity === "high" ? "text-red-700" : "text-amber-700")}>
                  {f.severity.toUpperCase()}, {f.issue}
                </p>
                <p className="text-foreground/70">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(analysis.requirements ?? []).filter(r => r.flagged).length > 0 && (
        <div>
          <SectionHeading>Flagged Requirements</SectionHeading>
          <div className="space-y-1">
            {analysis.requirements!.filter(r => r.flagged).map((r, i) => (
              <div key={i} className="text-xs text-foreground/80 bg-muted/40 rounded px-3 py-2 border border-border">
                <span className="font-medium">{r.item}</span>
                {r.description && <span className="text-muted-foreground ml-2">,  {r.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(analysis.exceptions ?? []).filter(e => e.flagged).length > 0 && (
        <div>
          <SectionHeading>Flagged Exceptions</SectionHeading>
          <div className="space-y-1">
            {analysis.exceptions!.filter(e => e.flagged).map((e, i) => (
              <div key={i} className="text-xs text-foreground/80 bg-muted/40 rounded px-3 py-2 border border-border">
                <span className="font-medium">{e.item}</span>
                {e.description && <span className="text-muted-foreground ml-2">,  {e.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailPanel>
  )
}

// ── CD Review detail ──────────────────────────────────────────────────────────

function CdReviewDetail({ r, copiedId, onCopy }: {
  r: CdReviewEntry; copiedId: string | null; onCopy: (id: string, text: string) => void
}) {
  const result = r.result as {
    summary?: string
    discrepancies?: Array<{ field: string; cdValue: string; contractValue: string; severity: string; recommendation: string }>
    warnings?: Array<{ issue: string; detail: string; severity: string }>
    verified?: string[]
  } | null
  if (!result) return null

  return (
    <DetailPanel>
      <div className="flex items-center justify-between">
        <SectionHeading>Review Summary</SectionHeading>
        <MatterLink matterId={r.matterId} />
      </div>

      {result.summary && (
        <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
      )}

      {(result.discrepancies ?? []).length > 0 && (
        <div>
          <SectionHeading>Discrepancies ({result.discrepancies!.length})</SectionHeading>
          <div className="space-y-2">
            {result.discrepancies!.map((d, i) => (
              <div key={i} className={cn(
                "rounded-lg px-3 py-2.5 text-xs border",
                d.severity === "high" ? "bg-red-500/8 border-red-500/20" : d.severity === "medium" ? "bg-amber-500/8 border-amber-500/20" : "bg-muted/40 border-border"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">{d.field}</span>
                  <span className={cn("text-[10px] font-bold uppercase", d.severity === "high" ? "text-red-600" : d.severity === "medium" ? "text-amber-600" : "text-muted-foreground")}>
                    {d.severity}
                  </span>
                </div>
                <div className="flex gap-4 text-muted-foreground mb-1">
                  <span><span className="font-medium text-foreground/60">CD:</span> {d.cdValue}</span>
                  <span><span className="font-medium text-foreground/60">Contract:</span> {d.contractValue}</span>
                </div>
                {d.recommendation && <p className="text-foreground/70">{d.recommendation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(result.warnings ?? []).length > 0 && (
        <div>
          <SectionHeading>Warnings</SectionHeading>
          <div className="space-y-1.5">
            {result.warnings!.map((w, i) => (
              <div key={i} className="rounded-lg px-3 py-2 text-xs bg-amber-500/8 border border-amber-500/20">
                <p className="font-semibold text-amber-700">{w.issue}</p>
                <p className="text-foreground/70 mt-0.5">{w.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(result.verified ?? []).length > 0 && (
        <div>
          <SectionHeading>Verified ({result.verified!.length})</SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {result.verified!.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5">
                <CheckCircle className="h-3 w-3" />{v}
              </span>
            ))}
          </div>
        </div>
      )}
    </DetailPanel>
  )
}

// ── HOA Review detail ─────────────────────────────────────────────────────────

function HoaReviewDetail({ r, copiedId, onCopy }: {
  r: HoaReviewEntry; copiedId: string | null; onCopy: (id: string, text: string) => void
}) {
  const result = r.result as {
    summary?: string
    financial?: { monthlyDues?: string | null; specialAssessments?: string | null; reserves?: string | null; transferFee?: string | null; delinquencies?: string | null }
    litigation?: { pending?: boolean; details?: string }
    redFlags?: Array<{ severity: string; issue: string; detail: string }>
    restrictions?: Array<{ category: string; detail: string; flagged: boolean }>
  } | null
  if (!result) return null

  return (
    <DetailPanel>
      <div className="flex items-center justify-between">
        <SectionHeading>Review Summary</SectionHeading>
        <MatterLink matterId={r.matterId} />
      </div>

      {result.summary && <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>}

      {result.financial && (
        <div>
          <SectionHeading>Financial</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["Monthly Dues", result.financial.monthlyDues],
              ["Special Assessments", result.financial.specialAssessments],
              ["Reserves", result.financial.reserves],
              ["Transfer Fee", result.financial.transferFee],
              ["Delinquencies", result.financial.delinquencies],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="text-xs bg-muted/40 rounded px-3 py-2 border border-border">
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.litigation?.pending && (
        <div className="rounded-lg px-3 py-2 text-xs bg-red-500/8 border border-red-500/20">
          <p className="font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Pending Litigation
          </p>
          {result.litigation.details && <p className="text-foreground/70 mt-0.5">{result.litigation.details}</p>}
        </div>
      )}

      {(result.redFlags ?? []).length > 0 && (
        <div>
          <SectionHeading>Red Flags</SectionHeading>
          <div className="space-y-2">
            {result.redFlags!.map((f, i) => (
              <div key={i} className={cn(
                "rounded-lg px-3 py-2 text-xs border",
                f.severity === "high" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20"
              )}>
                <p className={cn("font-semibold mb-0.5", f.severity === "high" ? "text-red-700" : "text-amber-700")}>
                  {f.issue}
                </p>
                <p className="text-foreground/70">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(result.restrictions ?? []).filter(r => r.flagged).length > 0 && (
        <div>
          <SectionHeading>Flagged Restrictions</SectionHeading>
          <div className="space-y-1">
            {result.restrictions!.filter(r => r.flagged).map((r, i) => (
              <div key={i} className="text-xs bg-muted/40 rounded px-3 py-2 border border-border">
                <span className="font-medium text-amber-700">{r.category}</span>
                <span className="text-muted-foreground ml-2">,  {r.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailPanel>
  )
}

// ── Fee Estimate detail ───────────────────────────────────────────────────────

function FeeEstimateDetail({ r, copiedId, onCopy }: {
  r: FeeEstimateEntry; copiedId: string | null; onCopy: (id: string, text: string) => void
}) {
  if (!r.generatedLetter) return null
  return (
    <DetailPanel>
      <div className="flex items-center justify-between">
        <SectionHeading>Fee Estimate Letter</SectionHeading>
        <div className="flex items-center gap-2">
          <MatterLink matterId={r.matterId} />
          <CopyButton text={r.generatedLetter} id={r.id} copiedId={copiedId} onCopy={onCopy} />
        </div>
      </div>
      <pre className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/40 rounded-lg p-3 max-h-80 overflow-y-auto border border-border">
        {r.generatedLetter}
      </pre>
    </DetailPanel>
  )
}

// ── Row wrapper ───────────────────────────────────────────────────────────────

function HistoryRow({
  id, icon: Icon, primary, secondary, date, badge, expanded, onToggle, children,
}: {
  id: string; icon: typeof FileText; primary: string; secondary?: string
  date: string; badge?: React.ReactNode; expanded: boolean
  onToggle: () => void; children?: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{primary}</p>
            {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
          </div>
          {badge}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs text-muted-foreground/60 hidden sm:flex items-center gap-1">
            <Clock className="h-3 w-3" />{date}
          </span>
          <ExpandToggle expanded={expanded} />
        </div>
      </button>
      {expanded && children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("updates")
  const [updates, setUpdates] = useState<StatusUpdateEntry[]>([])
  const [analyses, setAnalyses] = useState<TitleAnalysisEntry[]>([])
  const [cdReviewsList, setCdReviews] = useState<CdReviewEntry[]>([])
  const [hoaReviewsList, setHoaReviews] = useState<HoaReviewEntry[]>([])
  const [feeEstimatesList, setFeeEstimates] = useState<FeeEstimateEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (fromDate) params.set("from", fromDate)
    if (toDate) params.set("to", toDate)
    params.set("limit", "100")
    const res = await fetch(`/api/history?${params.toString()}`)
    const data = await res.json()
    setUpdates(data.updates ?? [])
    setAnalyses(data.analyses ?? [])
    setCdReviews(data.cdReviews ?? [])
    setHoaReviews(data.hoaReviews ?? [])
    setFeeEstimates(data.feeEstimates ?? [])
    setLoading(false)
  }, [debouncedSearch, fromDate, toDate])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleRegenerate(u: StatusUpdateEntry) {
    const params = new URLSearchParams({
      clientName: u.clientName, propertyAddress: u.propertyAddress,
      transactionType: u.transactionType, closingStage: u.closingStage,
      ...(u.completedItems && { completedItems: u.completedItems }),
      ...(u.outstandingItems && { outstandingItems: u.outstandingItems }),
      ...(u.upcomingDeadlines && { upcomingDeadlines: u.upcomingDeadlines }),
      ...(u.additionalNotes && { additionalNotes: u.additionalNotes }),
      ...(u.tone && { tone: u.tone }),
      ...(u.matterId && { matterId: u.matterId }),
    })
    router.push(`/status-update?${params.toString()}`)
  }

  function toggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function FlagBadge({ count, noun }: { count: number | null; noun: string }) {
    if (!count || count === 0) return null
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
        <AlertTriangle className="h-3 w-3" />{count} {noun}{count === 1 ? "" : "s"}
      </span>
    )
  }

  function DiscrepancyBadge({ count }: { count: number | null }) {
    if (!count || count === 0) return null
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
        <AlertTriangle className="h-3 w-3" />{count} discrepanc{count === 1 ? "y" : "ies"}
      </span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete record of all analyses and generated documents.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name or property address..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }} className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(""); setToDate("") }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Clear dates
          </button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }} className="flex flex-wrap gap-1 bg-muted/40 border border-border rounded-lg p-1 mb-6">
        {([
          { key: "updates", icon: FileText, label: "Status Updates", count: updates.length },
          { key: "analyses", icon: FileSearch, label: "Title Analyses", count: analyses.length },
          { key: "cd", icon: FileCheck, label: "CD Reviews", count: cdReviewsList.length },
          { key: "hoa", icon: Building, label: "HOA Reviews", count: hoaReviewsList.length },
          { key: "fees", icon: DollarSign, label: "Fee Estimates", count: feeEstimatesList.length },
        ] as const).map(({ key, icon: Icon, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === key ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />{label} ({count})
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40 mx-auto" />
        </div>
      ) : tab === "updates" ? (
        updates.length === 0
          ? <EmptyState icon={FileText} message={search ? "No matching updates" : "No status updates yet"} />
          : <div className="space-y-2">
            {updates.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <HistoryRow id={u.id} icon={FileText} primary={u.clientName}
                  secondary={`${u.propertyAddress} · ${u.closingStage}`}
                  date={formatDate(u.createdAt)} expanded={expandedId === u.id} onToggle={() => toggle(u.id)}>
                  <StatusUpdateDetail u={u} copiedId={copiedId} onCopy={handleCopy} onRegenerate={handleRegenerate} />
                </HistoryRow>
              </motion.div>
            ))}
          </div>
      ) : tab === "analyses" ? (
        analyses.length === 0
          ? <EmptyState icon={FileSearch} message={search ? "No matching analyses" : "No title analyses yet"} />
          : <div className="space-y-2">
            {analyses.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <HistoryRow id={a.id} icon={FileSearch} primary={a.propertyAddress ?? "Unknown property"}
                  date={formatDate(a.createdAt)} expanded={expandedId === a.id} onToggle={() => toggle(a.id)}
                  badge={<FlagBadge count={a.redFlagCount} noun="flag" />}>
                  <TitleAnalysisDetail a={a} copiedId={copiedId} onCopy={handleCopy} />
                </HistoryRow>
              </motion.div>
            ))}
          </div>
      ) : tab === "cd" ? (
        cdReviewsList.length === 0
          ? <EmptyState icon={FileCheck} message={search ? "No matching CD reviews" : "No CD reviews yet"} />
          : <div className="space-y-2">
            {cdReviewsList.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <HistoryRow id={r.id} icon={FileCheck} primary={r.propertyAddress ?? "CD Review"}
                  secondary={r.buyer ?? undefined} date={formatDate(r.createdAt)}
                  expanded={expandedId === r.id} onToggle={() => toggle(r.id)}
                  badge={<DiscrepancyBadge count={r.discrepancyCount} />}>
                  <CdReviewDetail r={r} copiedId={copiedId} onCopy={handleCopy} />
                </HistoryRow>
              </motion.div>
            ))}
          </div>
      ) : tab === "hoa" ? (
        hoaReviewsList.length === 0
          ? <EmptyState icon={Building} message={search ? "No matching HOA reviews" : "No HOA reviews yet"} />
          : <div className="space-y-2">
            {hoaReviewsList.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <HistoryRow id={r.id} icon={Building} primary={r.associationName ?? "HOA Review"}
                  date={formatDate(r.createdAt)} expanded={expandedId === r.id} onToggle={() => toggle(r.id)}
                  badge={<FlagBadge count={r.redFlagCount} noun="flag" />}>
                  <HoaReviewDetail r={r} copiedId={copiedId} onCopy={handleCopy} />
                </HistoryRow>
              </motion.div>
            ))}
          </div>
      ) : (
        feeEstimatesList.length === 0
          ? <EmptyState icon={DollarSign} message={search ? "No matching fee estimates" : "No fee estimates yet"} />
          : <div className="space-y-2">
            {feeEstimatesList.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                <HistoryRow id={r.id} icon={DollarSign} primary={r.clientName}
                  secondary={`${r.transactionType}${r.jurisdiction ? ` · ${r.jurisdiction}` : ""}`}
                  date={formatDate(r.createdAt)} expanded={expandedId === r.id} onToggle={() => toggle(r.id)}>
                  <FeeEstimateDetail r={r} copiedId={copiedId} onCopy={handleCopy} />
                </HistoryRow>
              </motion.div>
            ))}
          </div>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof FileText; message: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-16">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Generated content will appear here automatically.</p>
    </motion.div>
  )
}
