"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, AlertTriangle, CheckCircle, Flag, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"
import { ShimmerButton } from "@/components/ui/shimmer-button"

type Restriction = { category: string; detail: string; flagged: boolean }
type RedFlag = { severity: "high" | "medium"; issue: string; detail: string }
type Review = {
  association: { name: string | null; managementCompany: string | null; contact: string | null }
  financial: { monthlyDues: string | null; specialAssessments: string | null; reserves: string | null; transferFee: string | null; delinquencies: string | null }
  restrictions: Restriction[]
  litigation: { pending: boolean; details: string }
  insurance: { masterPolicy: string | null; gaps: string | null }
  redFlags: RedFlag[]
  summary: string
}

export default function HOAReviewerPage() {
  const [docs, setDocs] = useState("")
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError("")
    try {
      const formData = new FormData(); formData.append("file", file)
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const data = await res.json()
      setDocs(data.text)
    } catch (err) { setError(err instanceof Error ? err.message : "PDF upload failed") }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  async function handleAnalyze() {
    setError("")
    if (docs.trim().length < 100) { setError("Paste or upload HOA documents first."); return }
    setLoading(true); setReview(null)
    try {
      const res = await fetch("/api/review-hoa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoaDocuments: docs }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Review failed") }
      const data = await res.json()
      setReview(data.review)
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong") }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">HOA Document Reviewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Extract fees, restrictions, litigation, and red flags from HOA/condo documents.
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
            className="bg-card rounded-xl border border-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">HOA/Condo Documents</label>
              <div>
                <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> Upload PDF</>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={docs}
              onChange={(e) => setDocs(e.target.value)}
              placeholder="Paste HOA/condo documents here, or upload a PDF..."
              rows={18}
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono resize-none transition-all"
            />
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-red-500">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <ShimmerButton loading={loading} disabled={loading || uploading} onClick={handleAnalyze}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing...</> : "Review HOA Documents"}
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
              <p className="text-sm font-medium text-foreground">{review.association.name ?? "Unknown Association"}</p>
              <div className="flex items-center gap-2">
                <PrintButton label="Export PDF" />
                <button
                  onClick={() => { setReview(null); setDocs("") }}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
                >
                  Review another
                </button>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{review.summary}</p>
            </motion.div>

            {/* Financial */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Financial Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Monthly Dues", review.financial.monthlyDues],
                  ["Transfer Fee", review.financial.transferFee],
                  ["Special Assessments", review.financial.specialAssessments],
                  ["Reserves", review.financial.reserves],
                  ["Delinquencies", review.financial.delinquencies],
                ].map(([label, value]) => value && (
                  <motion.div
                    key={label as string}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="bg-muted/40 rounded-lg p-3 border border-border"
                  >
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-sm font-medium text-foreground mt-0.5">{value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Red flags */}
            {review.redFlags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Red Flags{" "}
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 ml-1"
                  >
                    {review.redFlags.length}
                  </motion.span>
                </h2>
                <div className="space-y-2">
                  {review.redFlags.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn("rounded-lg border p-3", f.severity === "high" ? "bg-red-500/8 border-red-500/20" : "bg-amber-500/8 border-amber-500/20")}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className={cn("h-3.5 w-3.5", f.severity === "high" ? "text-red-500" : "text-amber-500")} />
                        <span className="text-sm font-medium text-foreground">{f.issue}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">{f.detail}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Litigation */}
            {review.litigation.pending && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="bg-red-500/8 rounded-xl border border-red-500/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h2 className="text-sm font-semibold text-red-700">Pending Litigation</h2>
                </div>
                <p className="text-sm text-foreground/80">{review.litigation.details}</p>
              </motion.div>
            )}

            {/* Restrictions */}
            {review.restrictions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Restrictions</h2>
                <div className="space-y-2">
                  {review.restrictions.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn("flex gap-3 p-3 rounded-lg", r.flagged ? "bg-amber-500/8 border border-amber-500/20" : "bg-muted/40")}
                    >
                      {r.flagged ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground mr-2">{r.category}</span>
                        <span className="text-sm text-foreground/80">{r.detail}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Insurance */}
            {(review.insurance.masterPolicy || review.insurance.gaps) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Insurance</h2>
                {review.insurance.masterPolicy && (
                  <p className="text-sm text-foreground/80 mb-2">
                    <span className="font-medium">Master Policy:</span> {review.insurance.masterPolicy}
                  </p>
                )}
                {review.insurance.gaps && (
                  <p className="text-sm text-amber-600">
                    <span className="font-medium">Gaps:</span> {review.insurance.gaps}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
