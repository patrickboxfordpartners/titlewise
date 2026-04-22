"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Flag, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { trackEvent, EVENTS } from "@/lib/analytics"

type Requirement = { item: string; description: string; flagged: boolean }
type Exception = { item: string; description: string; flagged: boolean }
type RedFlag = { severity: "high" | "medium"; issue: string; detail: string }
type Analysis = {
  property: { address: string | null; type: string | null; owners: string | null; amount: string | null }
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
      trackEvent(EVENTS.TITLE_ANALYZED, { redFlagCount: data.analysis?.redFlags?.length ?? 0 })
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Title Commitment Analyzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a title commitment and get a plain-English breakdown of requirements, exceptions, and red flags.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!analysis ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="bg-card rounded-xl border border-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
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
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
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
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono resize-none transition-all"
            />
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <ShimmerButton loading={loading} disabled={loading || uploading} onClick={handleAnalyze}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing commitment...
                </>
              ) : (
                "Analyze Title Commitment"
              )}
            </ShimmerButton>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Header bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {analysis.property.address ?? "Address not found"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[analysis.property.type, analysis.property.owners, analysis.property.amount]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PrintButton label="Export PDF" />
                <button
                  onClick={() => { setAnalysis(null); setCommitment("") }}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
                >
                  Analyze another
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Red Flags", value: analysis.redFlags.length, highlight: highFlags > 0, color: "red" as const },
                { label: "Flagged Requirements", value: flaggedReqs, highlight: flaggedReqs > 0, color: "amber" as const },
                { label: "Flagged Exceptions", value: flaggedExcs, highlight: flaggedExcs > 0, color: "amber" as const },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Summary
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{analysis.summary}</p>
            </motion.div>

            {/* Red Flags */}
            {analysis.redFlags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33, duration: 0.35 }}
              >
                <Section
                  title="Red Flags"
                  count={analysis.redFlags.length}
                  open={openSections.redFlags}
                  onToggle={() => toggleSection("redFlags")}
                  accent="red"
                >
                  <div className="space-y-3">
                    {analysis.redFlags.map((flag, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.25 }}
                        className={cn(
                          "rounded-lg border p-3",
                          flag.severity === "high"
                            ? "bg-red-500/8 border-red-500/20"
                            : "bg-amber-500/8 border-amber-500/20"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Flag className={cn("h-3.5 w-3.5", flag.severity === "high" ? "text-red-500" : "text-amber-500")} />
                          <span className={cn("text-xs font-semibold uppercase tracking-wide", flag.severity === "high" ? "text-red-600" : "text-amber-600")}>
                            {flag.severity}
                          </span>
                          <span className="text-sm font-medium text-foreground">{flag.issue}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-5">{flag.detail}</p>
                      </motion.div>
                    ))}
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.41, duration: 0.35 }}
            >
              <Section
                title="Schedule B-I — Requirements"
                count={analysis.requirements.length}
                open={openSections.requirements}
                onToggle={() => toggleSection("requirements")}
                accent="blue"
              >
                <div className="space-y-2">
                  {analysis.requirements.map((req, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ItemRow item={req.item} description={req.description} flagged={req.flagged} />
                    </motion.div>
                  ))}
                  {analysis.requirements.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No requirements found.</p>
                  )}
                </div>
              </Section>
            </motion.div>

            {/* Exceptions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.49, duration: 0.35 }}
            >
              <Section
                title="Schedule B-II — Exceptions"
                count={analysis.exceptions.length}
                open={openSections.exceptions}
                onToggle={() => toggleSection("exceptions")}
                accent="blue"
              >
                <div className="space-y-2">
                  {analysis.exceptions.map((exc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ItemRow item={exc.item} description={exc.description} flagged={exc.flagged} />
                    </motion.div>
                  ))}
                  {analysis.exceptions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No exceptions found.</p>
                  )}
                </div>
              </Section>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        highlight && color === "red" && "bg-red-500/8 border-red-500/20",
        highlight && color === "amber" && "bg-amber-500/8 border-amber-500/20",
        !highlight && "bg-card border-border"
      )}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
        className={cn(
          "text-2xl font-bold",
          highlight && color === "red" ? "text-red-600" :
          highlight ? "text-amber-600" :
          "text-foreground"
        )}
      >
        {value}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              accent === "red" ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"
            )}
          >
            {count}
          </motion.span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ItemRow({ item, description, flagged }: { item: string; description: string; flagged: boolean }) {
  return (
    <div className={cn("flex gap-3 p-3 rounded-lg", flagged ? "bg-amber-500/8 border border-amber-500/20" : "bg-muted/40")}>
      <div className="shrink-0 mt-0.5">
        {flagged ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <CheckCircle className="h-4 w-4 text-muted-foreground/30" />
        )}
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold text-muted-foreground mr-2">{item}</span>
        <span className="text-sm text-foreground/80 leading-relaxed">{description}</span>
      </div>
    </div>
  )
}
