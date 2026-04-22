"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"
import { ShimmerButton } from "@/components/ui/shimmer-button"

type Discrepancy = { field: string; cdValue: string; contractValue: string; severity: "high" | "medium" | "low"; recommendation: string }
type Warning = { issue: string; detail: string; severity: "high" | "medium" }
type Review = {
  property: { address: string | null; buyer: string | null; seller: string | null; lender: string | null }
  discrepancies: Discrepancy[]
  warnings: Warning[]
  verified: string[]
  trid?: {
    bucketA_violations?: Array<{ fee: string; le_amount?: string | null; cd_amount?: string | null; variance?: string | null; cure_required?: boolean }>
    bucketB_violations?: Array<{ fee: string; category_total_le?: string | null; category_total_cd?: string | null; over_10pct?: boolean }>
    bucketC_fees?: string[]
    cure_amount?: string | null
    trid_compliant?: boolean | null
    trid_notes?: string
  }
  summary: string
}

export default function CDReviewerPage() {
  const [cd, setCd] = useState("")
  const [contract, setContract] = useState("")
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showVerified, setShowVerified] = useState(false)

  async function handleReview() {
    setError("")
    if (cd.trim().length < 100) { setError("Paste the full Closing Disclosure."); return }
    if (contract.trim().length < 50) { setError("Enter the key contract terms."); return }
    setLoading(true)
    setReview(null)
    try {
      const res = await fetch("/api/review-cd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingDisclosure: cd, contractTerms: contract }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Review failed") }
      const data = await res.json()
      setReview(data.review)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const highCount = review
    ? review.discrepancies.filter((d) => d.severity === "high").length + review.warnings.filter((w) => w.severity === "high").length
    : 0

  const monoClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none transition-all"

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Closing Disclosure Reviewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare a Closing Disclosure against contract terms to find discrepancies before closing.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!review ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Closing Disclosure</label>
                <textarea
                  value={cd}
                  onChange={(e) => setCd(e.target.value)}
                  placeholder="Paste the full Closing Disclosure text..."
                  rows={16}
                  className={monoClass}
                />
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Contract Terms</label>
                <textarea
                  value={contract}
                  onChange={(e) => setContract(e.target.value)}
                  placeholder={"Purchase Price: $425,000\nClosing Date: April 28, 2026\nSeller Credits: $5,000\nEarnest Money: $10,000\n..."}
                  rows={16}
                  className={monoClass}
                />
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-red-500">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <ShimmerButton loading={loading} onClick={handleReview}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing...</> : "Review Closing Disclosure"}
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{review.property.address ?? "Address not found"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{[review.property.buyer, review.property.seller].filter(Boolean).join(" / ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <PrintButton label="Export PDF" />
                <button
                  onClick={() => { setReview(null); setCd(""); setContract("") }}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
                >
                  Review another
                </button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: review.discrepancies.length, label: "Discrepancies", highlight: highCount > 0, color: "red" as const },
                { value: review.warnings.length, label: "Warnings", highlight: review.warnings.length > 0, color: "amber" as const },
                { value: review.verified.length, label: "Verified", highlight: true, color: "green" as const },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  className={cn(
                    "rounded-xl border p-4",
                    stat.color === "green" && "bg-green-500/8 border-green-500/20",
                    stat.color === "red" && stat.highlight && "bg-red-500/8 border-red-500/20",
                    stat.color === "amber" && stat.highlight && "bg-amber-500/8 border-amber-500/20",
                    !stat.highlight && "bg-card border-border"
                  )}
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 + i * 0.08 }}
                    className={cn(
                      "text-2xl font-bold",
                      stat.color === "green" ? "text-green-600" :
                      stat.color === "red" && stat.highlight ? "text-red-600" :
                      stat.color === "amber" && stat.highlight ? "text-amber-600" :
                      "text-foreground"
                    )}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assessment</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{review.summary}</p>
            </motion.div>

            {/* Discrepancies */}
            {review.discrepancies.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Discrepancies</h2>
                <div className="space-y-3">
                  {review.discrepancies.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn(
                        "rounded-lg border p-3",
                        d.severity === "high" ? "bg-red-500/8 border-red-500/20" :
                        d.severity === "medium" ? "bg-amber-500/8 border-amber-500/20" :
                        "bg-muted/40 border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className={cn("h-4 w-4", d.severity === "high" ? "text-red-500" : d.severity === "medium" ? "text-amber-500" : "text-muted-foreground/40")} />
                        <span className="text-sm font-semibold text-foreground">{d.field}</span>
                        <span className={cn("text-[10px] font-medium uppercase px-1.5 py-0.5 rounded", d.severity === "high" ? "bg-red-500/10 text-red-600" : d.severity === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground")}>
                          {d.severity}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2 mb-2 pl-6">
                        <div><span className="text-muted-foreground">CD:</span> <span className="font-medium text-foreground">{d.cdValue}</span></div>
                        <div><span className="text-muted-foreground">Contract:</span> <span className="font-medium text-foreground">{d.contractValue}</span></div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{d.recommendation}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Warnings */}
            {review.warnings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.41 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Warnings</h2>
                <div className="space-y-2">
                  {review.warnings.map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{w.issue}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{w.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Verified */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49 }} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowVerified(!showVerified)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-semibold text-foreground">Verified Fields</span>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600"
                  >
                    {review.verified.length}
                  </motion.span>
                  <motion.div animate={{ rotate: showVerified ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {showVerified && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-1">
                      {review.verified.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {v}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* TRID Compliance */}
            {review.trid && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className={`rounded-xl border p-5 ${review.trid.trid_compliant === false ? "bg-red-500/10 border-red-500/30" : review.trid.trid_compliant === true ? "bg-green-500/10 border-green-500/20" : "bg-card border-border"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">TRID Compliance</h2>
                  {review.trid.trid_compliant === true && <span className="text-xs font-semibold text-green-600 bg-green-500/10 px-2 py-1 rounded-md">Compliant</span>}
                  {review.trid.trid_compliant === false && <span className="text-xs font-semibold text-red-600 bg-red-500/10 px-2 py-1 rounded-md">Violations Found</span>}
                  {review.trid.cure_amount && <span className="text-xs font-semibold text-red-600">Cure required: {review.trid.cure_amount}</span>}
                </div>
                {review.trid.trid_notes && <p className="text-sm text-foreground/80 mb-3">{review.trid.trid_notes}</p>}
                {(review.trid.bucketA_violations?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Bucket A Violations (Zero Tolerance)</p>
                    {review.trid.bucketA_violations!.map((v, i) => (
                      <div key={i} className="text-sm text-foreground/80 mb-1">
                        <span className="font-medium">{v.fee}</span>: LE {v.le_amount} → CD {v.cd_amount}
                        {v.variance && <span className="text-red-500 ml-2">+{v.variance} over tolerance</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(review.trid.bucketB_violations?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Bucket B Violations (10% Tolerance)</p>
                    {review.trid.bucketB_violations!.map((v, i) => (
                      <div key={i} className="text-sm text-foreground/80 mb-1">
                        <span className="font-medium">{v.fee}</span>: LE total {v.category_total_le} → CD total {v.category_total_cd}
                        {v.over_10pct && <span className="text-amber-500 ml-2">Exceeds 10% tolerance</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
