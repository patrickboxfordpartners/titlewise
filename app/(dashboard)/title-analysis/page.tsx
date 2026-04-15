"use client"

import { useState, useRef } from "react"
import { Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Flag, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"

type Requirement = {
  item: string
  description: string
  flagged: boolean
}

type Exception = {
  item: string
  description: string
  flagged: boolean
}

type RedFlag = {
  severity: "high" | "medium"
  issue: string
  detail: string
}

type Analysis = {
  property: {
    address: string | null
    type: string | null
    owners: string | null
    amount: string | null
  }
  scheduleA: { summary: string }
  requirements: Requirement[]
  exceptions: Exception[]
  redFlags: RedFlag[]
  summary: string
}

export default function TitleAnalysisPage() {
  const [commitment, setCommitment] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    requirements: true,
    exceptions: true,
    redFlags: true,
  })

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to parse PDF")
      }
      const data = await res.json()
      setCommitment(data.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse PDF")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleAnalyze() {
    setError("")
    if (commitment.trim().length < 100) {
      setError("Paste or upload a title commitment before analyzing.")
      return
    }
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch("/api/analyze-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitment }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Analysis failed")
      }
      const data = await res.json()
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const flaggedReqs = analysis?.requirements.filter((r) => r.flagged).length ?? 0
  const flaggedExcs = analysis?.exceptions.filter((e) => e.flagged).length ?? 0
  const highFlags = analysis?.redFlags.filter((f) => f.severity === "high").length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Title Commitment Analyzer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste a title commitment and get a plain-English breakdown of requirements, exceptions, and red flags.
        </p>
      </div>

      {!analysis ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">
              Paste Title Commitment Text
            </label>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-blue-400 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Extracting text...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Upload PDF
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            placeholder="Paste the full text of the title commitment here (Schedule A, B-I, B-II), or upload a PDF..."
            rows={18}
            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleAnalyze}
            disabled={loading || uploading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing commitment...
              </>
            ) : (
              "Analyze Title Commitment"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {analysis.property.address ?? "Address not found"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {[analysis.property.type, analysis.property.owners, analysis.property.amount]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PrintButton label="Export PDF" />
            <button
              onClick={() => { setAnalysis(null); setCommitment("") }}
              className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Analyze another
            </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Red Flags"
              value={analysis.redFlags.length}
              highlight={highFlags > 0}
              color="red"
            />
            <StatCard
              label="Flagged Requirements"
              value={flaggedReqs}
              highlight={flaggedReqs > 0}
              color="amber"
            />
            <StatCard
              label="Flagged Exceptions"
              value={flaggedExcs}
              highlight={flaggedExcs > 0}
              color="amber"
            />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Red Flags */}
          {analysis.redFlags.length > 0 && (
            <Section
              title="Red Flags"
              count={analysis.redFlags.length}
              open={openSections.redFlags}
              onToggle={() => toggleSection("redFlags")}
              accent="red"
            >
              <div className="space-y-3">
                {analysis.redFlags.map((flag, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-3",
                      flag.severity === "high"
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className={cn("h-3.5 w-3.5", flag.severity === "high" ? "text-red-500" : "text-amber-500")} />
                      <span className={cn("text-xs font-semibold uppercase tracking-wide", flag.severity === "high" ? "text-red-700" : "text-amber-700")}>
                        {flag.severity}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{flag.issue}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-5">{flag.detail}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Requirements */}
          <Section
            title="Schedule B-I — Requirements"
            count={analysis.requirements.length}
            open={openSections.requirements}
            onToggle={() => toggleSection("requirements")}
            accent="blue"
          >
            <div className="space-y-2">
              {analysis.requirements.map((req, i) => (
                <ItemRow key={i} item={req.item} description={req.description} flagged={req.flagged} />
              ))}
              {analysis.requirements.length === 0 && (
                <p className="text-sm text-slate-400 italic">No requirements found.</p>
              )}
            </div>
          </Section>

          {/* Exceptions */}
          <Section
            title="Schedule B-II — Exceptions"
            count={analysis.exceptions.length}
            open={openSections.exceptions}
            onToggle={() => toggleSection("exceptions")}
            accent="blue"
          >
            <div className="space-y-2">
              {analysis.exceptions.map((exc, i) => (
                <ItemRow key={i} item={exc.item} description={exc.description} flagged={exc.flagged} />
              ))}
              {analysis.exceptions.length === 0 && (
                <p className="text-sm text-slate-400 italic">No exceptions found.</p>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  color,
}: {
  label: string
  value: number
  highlight: boolean
  color: "red" | "amber"
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight && color === "red" && "bg-red-50 border-red-200",
        highlight && color === "amber" && "bg-amber-50 border-amber-200",
        !highlight && "bg-white border-slate-200"
      )}
    >
      <div className={cn("text-2xl font-bold", highlight && color === "red" ? "text-red-600" : highlight ? "text-amber-600" : "text-slate-700")}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function Section({
  title,
  count,
  open,
  onToggle,
  accent,
  children,
}: {
  title: string
  count: number
  open: boolean
  onToggle: () => void
  accent: "blue" | "red"
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            accent === "red" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          )}>
            {count}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-4 pt-1">{children}</div>}
    </div>
  )
}

function ItemRow({ item, description, flagged }: { item: string; description: string; flagged: boolean }) {
  return (
    <div className={cn("flex gap-3 p-3 rounded-lg", flagged ? "bg-amber-50 border border-amber-200" : "bg-slate-50")}>
      <div className="shrink-0 mt-0.5">
        {flagged ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-slate-300" />
        )}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-slate-500 mr-2">{item}</span>
        <span className="text-sm text-slate-700 leading-relaxed">{description}</span>
      </div>
    </div>
  )
}
