"use client"

import { useState, useEffect } from "react"
import { FileText, FileSearch, Clock, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusUpdateEntry = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingStage: string
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
  const [tab, setTab] = useState<Tab>("updates")
  const [updates, setUpdates] = useState<StatusUpdateEntry[]>([])
  const [analyses, setAnalyses] = useState<TitleAnalysisEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setUpdates(data.updates ?? [])
        setAnalyses(data.analyses ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">History</h1>
        <p className="text-sm text-slate-500 mt-1">Past generated emails and title analyses.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("updates")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "updates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Status Updates ({updates.length})
        </button>
        <button
          onClick={() => setTab("analyses")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "analyses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileSearch className="h-3.5 w-3.5" />
          Title Analyses ({analyses.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-400">Loading...</div>
      ) : tab === "updates" ? (
        updates.length === 0 ? (
          <EmptyState icon={FileText} message="No status updates yet" />
        ) : (
          <div className="space-y-2">
            {updates.map((u) => {
              const isExpanded = expandedId === u.id
              return (
                <div key={u.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.clientName}</p>
                        <p className="text-xs text-slate-400 truncate">{u.propertyAddress} - {u.closingStage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(u.createdAt)}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </button>
                  {isExpanded && u.generatedEmail && (
                    <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => handleCopy(u.id, u.generatedEmail!)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                            copiedId === u.id ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          )}
                        >
                          {copiedId === u.id ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                        </button>
                      </div>
                      <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        {u.generatedEmail}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : analyses.length === 0 ? (
        <EmptyState icon={FileSearch} message="No title analyses yet" />
      ) : (
        <div className="space-y-2">
          {analyses.map((a) => {
            const summary = (a.analysis as { summary?: string })?.summary
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSearch className="h-4 w-4 text-blue-500 shrink-0" />
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {a.propertyAddress ?? "Unknown property"}
                    </p>
                    {(a.redFlagCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        {a.redFlagCount} flag{a.redFlagCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDate(a.createdAt)}
                  </span>
                </div>
                {summary && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{summary}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof FileText; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Generated content will appear here automatically.</p>
    </div>
  )
}
