"use client"

import { useState, useEffect } from "react"
import { Bot, Loader2, ChevronDown, ChevronUp, Zap, AlertTriangle, CheckCircle, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

type AgentReport = {
  overall_status: "on_track" | "needs_attention" | "at_risk" | "critical"
  status_summary: string
  immediate_actions: Array<{ action: string; assigned_to: string; urgency: string; reason: string }>
  blockers: Array<{ item: string; impact: string; resolution: string }>
  checklist_updates: Array<{ item_title: string; suggested_status: string; reason: string }>
  draft_status_email: { subject: string; body: string }
  risk_flags: string[]
}

export default function ClosingAgentPanel({ matterId }: { matterId: string }) {
  const [tier, setTier] = useState<string | null>(null)
  const [tierLoading, setTierLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<AgentReport | null>(null)
  const [updatedItems, setUpdatedItems] = useState(0)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => setTier(d.subscriptionTier ?? null))
      .finally(() => setTierLoading(false))
  }, [])

  const hasAccess = tier === "pro" || tier === "enterprise"

  async function runAgent() {
    setRunning(true)
    setError("")
    setReport(null)
    const res = await fetch("/api/agent/analyze-matter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matterId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Agent analysis failed")
    } else {
      setReport(data.report)
      setUpdatedItems(data.updatedItems ?? 0)
    }
    setRunning(false)
  }

  if (tierLoading) return null

  if (!hasAccess) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Closing Agent</p>
          <p className="text-xs text-muted-foreground">Analyzes your matter, updates checklist, drafts status email. Pro plan.</p>
        </div>
        <a
          href="/pricing"
          className="shrink-0 text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide"
        >
          Upgrade
        </a>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-semibold text-foreground">Closing Agent</span>
          {report && updatedItems > 0 && (
            <span className="text-[10px] text-green-600 font-medium">{updatedItems} item{updatedItems !== 1 ? "s" : ""} updated</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={runAgent}
            disabled={running}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-60"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {running ? "Analyzing..." : report ? "Re-run" : "Run"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {running && !report && (
        <div className="border-t border-border px-5 py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Analyzing matter, updating checklist...</span>
        </div>
      )}

      {report && expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {/* Summary */}
          <div className="px-5 py-4">
            <p className="text-xs text-foreground leading-relaxed">{report.status_summary}</p>
          </div>

          {/* Risk flags */}
          {report.risk_flags?.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Risk Flags</p>
              <ul className="space-y-1">
                {report.risk_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {report.blockers?.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 mb-2">Blockers</p>
              <ul className="space-y-2">
                {report.blockers.map((b, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-medium text-foreground">{b.item}</span>
                    <span className="text-muted-foreground"> — {b.resolution}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Immediate actions */}
          {report.immediate_actions?.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Next Steps</p>
              <ul className="space-y-2">
                {report.immediate_actions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/60 mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-xs text-foreground">{p.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist updates */}
          {report.checklist_updates?.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-2">Checklist Updated</p>
              <ul className="space-y-1">
                {report.checklist_updates.map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground">{u.item_title} → <span className="font-medium capitalize">{u.suggested_status.replace("_", " ")}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Draft status email */}
          {report.draft_status_email?.body && (
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Draft Status Email
                </p>
                <a
                  href={`/status-update?matterId=${matterId}&completedItems=${encodeURIComponent("")}`}
                  className="text-[10px] text-primary hover:underline"
                >
                  Open in editor
                </a>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Subject: {report.draft_status_email.subject}</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{report.draft_status_email.body}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
