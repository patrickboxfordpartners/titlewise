"use client"

import { useState, useRef } from "react"
import { Loader2, AlertTriangle, CheckCircle, Flag, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrintButton } from "@/components/print-button"

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">HOA Document Reviewer</h1>
        <p className="text-sm text-slate-500 mt-1">Extract fees, restrictions, litigation, and red flags from HOA/condo documents.</p>
      </div>

      {!review ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">HOA/Condo Documents</label>
            <div>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-blue-400">
                {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting...</> : <><Upload className="h-3.5 w-3.5" /> Upload PDF</>}
              </button>
            </div>
          </div>
          <textarea value={docs} onChange={(e) => setDocs(e.target.value)} placeholder="Paste HOA/condo documents here, or upload a PDF..." rows={18} className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleAnalyze} disabled={loading || uploading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reviewing...</> : "Review HOA Documents"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">{review.association.name ?? "Unknown Association"}</p>
            <div className="flex items-center gap-2">
              <PrintButton label="Export PDF" />
              <button onClick={() => { setReview(null); setDocs("") }} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-md">Review another</button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{review.summary}</p>
          </div>

          {/* Financial */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Financial Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Monthly Dues", review.financial.monthlyDues],
                ["Transfer Fee", review.financial.transferFee],
                ["Special Assessments", review.financial.specialAssessments],
                ["Reserves", review.financial.reserves],
                ["Delinquencies", review.financial.delinquencies],
              ].map(([label, value]) => value && (
                <div key={label as string} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-sm font-medium text-slate-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Red flags */}
          {review.redFlags.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Red Flags ({review.redFlags.length})</h2>
              <div className="space-y-2">
                {review.redFlags.map((f, i) => (
                  <div key={i} className={cn("rounded-lg border p-3", f.severity === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className={cn("h-3.5 w-3.5", f.severity === "high" ? "text-red-500" : "text-amber-500")} />
                      <span className="text-sm font-medium text-slate-800">{f.issue}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Litigation */}
          {review.litigation.pending && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-semibold text-red-800">Pending Litigation</h2>
              </div>
              <p className="text-sm text-slate-700">{review.litigation.details}</p>
            </div>
          )}

          {/* Restrictions */}
          {review.restrictions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Restrictions</h2>
              <div className="space-y-2">
                {review.restrictions.map((r, i) => (
                  <div key={i} className={cn("flex gap-3 p-3 rounded-lg", r.flagged ? "bg-amber-50 border border-amber-200" : "bg-slate-50")}>
                    {r.flagged ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 mr-2">{r.category}</span>
                      <span className="text-sm text-slate-700">{r.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance */}
          {(review.insurance.masterPolicy || review.insurance.gaps) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Insurance</h2>
              {review.insurance.masterPolicy && <p className="text-sm text-slate-700 mb-2"><span className="font-medium">Master Policy:</span> {review.insurance.masterPolicy}</p>}
              {review.insurance.gaps && <p className="text-sm text-amber-700"><span className="font-medium">Gaps:</span> {review.insurance.gaps}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
