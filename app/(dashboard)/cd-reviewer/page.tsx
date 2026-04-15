"use client"

import { useState } from "react"
import { Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"

type Discrepancy = { field: string; cdValue: string; contractValue: string; severity: "high" | "medium" | "low"; recommendation: string }
type Warning = { issue: string; detail: string; severity: "high" | "medium" }
type Review = {
  property: { address: string | null; buyer: string | null; seller: string | null; lender: string | null }
  discrepancies: Discrepancy[]
  warnings: Warning[]
  verified: string[]
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

  const highCount = review ? review.discrepancies.filter((d) => d.severity === "high").length + review.warnings.filter((w) => w.severity === "high").length : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Closing Disclosure Reviewer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare a Closing Disclosure against contract terms to find discrepancies before closing.
        </p>
      </div>

      {!review ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="text-xs font-medium text-slate-600 block mb-2">Closing Disclosure</label>
              <textarea value={cd} onChange={(e) => setCd(e.target.value)} placeholder="Paste the full Closing Disclosure text..." rows={16} className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="text-xs font-medium text-slate-600 block mb-2">Contract Terms</label>
              <textarea value={contract} onChange={(e) => setContract(e.target.value)} placeholder={"Purchase Price: $425,000\nClosing Date: April 28, 2026\nSeller Credits: $5,000\nEarnest Money: $10,000\n..."} rows={16} className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleReview} disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing...</> : "Review Closing Disclosure"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">{review.property.address ?? "Address not found"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{[review.property.buyer, review.property.seller].filter(Boolean).join(" / ")}</p>
            </div>
            <div className="flex items-center gap-2">
              <PrintButton label="Export PDF" />
              <button onClick={() => { setReview(null); setCd(""); setContract("") }} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-md transition-colors">
                Review another
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={cn("rounded-xl border p-4", highCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
              <div className={cn("text-2xl font-bold", highCount > 0 ? "text-red-600" : "text-slate-700")}>{review.discrepancies.length}</div>
              <div className="text-xs text-slate-500">Discrepancies</div>
            </div>
            <div className={cn("rounded-xl border p-4", review.warnings.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
              <div className={cn("text-2xl font-bold", review.warnings.length > 0 ? "text-amber-600" : "text-slate-700")}>{review.warnings.length}</div>
              <div className="text-xs text-slate-500">Warnings</div>
            </div>
            <div className="rounded-xl border bg-green-50 border-green-200 p-4">
              <div className="text-2xl font-bold text-green-600">{review.verified.length}</div>
              <div className="text-xs text-slate-500">Verified</div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assessment</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{review.summary}</p>
          </div>

          {/* Discrepancies */}
          {review.discrepancies.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Discrepancies</h2>
              <div className="space-y-3">
                {review.discrepancies.map((d, i) => (
                  <div key={i} className={cn("rounded-lg border p-3", d.severity === "high" ? "bg-red-50 border-red-200" : d.severity === "medium" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200")}>
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className={cn("h-4 w-4", d.severity === "high" ? "text-red-500" : d.severity === "medium" ? "text-amber-500" : "text-slate-400")} />
                      <span className="text-sm font-semibold text-slate-800">{d.field}</span>
                      <span className={cn("text-[10px] font-medium uppercase px-1.5 py-0.5 rounded", d.severity === "high" ? "bg-red-100 text-red-700" : d.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>{d.severity}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2 mb-2 pl-6">
                      <div><span className="text-slate-500">CD:</span> <span className="font-medium text-slate-700">{d.cdValue}</span></div>
                      <div><span className="text-slate-500">Contract:</span> <span className="font-medium text-slate-700">{d.contractValue}</span></div>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{d.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {review.warnings.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Warnings</h2>
              <div className="space-y-2">
                {review.warnings.map((w, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-slate-800">{w.issue}</span>
                      <p className="text-xs text-slate-600 mt-0.5">{w.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setShowVerified(!showVerified)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-semibold text-slate-800">Verified Fields ({review.verified.length})</span>
              {showVerified ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showVerified && (
              <div className="px-5 pb-4 space-y-1">
                {review.verified.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
