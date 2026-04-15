"use client"

import { useState } from "react"
import { Loader2, Shield, AlertTriangle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

type RedFlag = { severity: "critical" | "high" | "medium"; issue: string; detail: string }
type Change = { field: string; previous: string; current: string; risk: "high" | "medium" }
type Result = {
  extracted: { bankName: string | null; routingNumber: string | null; accountNumber: string | null; beneficiary: string | null; reference: string | null }
  redFlags: RedFlag[]
  changes: Change[]
  verificationEmail: string
  riskLevel: "low" | "medium" | "high" | "critical"
  summary: string
}

const riskColors = { low: "bg-green-50 border-green-200 text-green-700", medium: "bg-amber-50 border-amber-200 text-amber-700", high: "bg-red-50 border-red-200 text-red-700", critical: "bg-red-100 border-red-300 text-red-800" }

export default function WireVerificationPage() {
  const [wire, setWire] = useState("")
  const [previous, setPrevious] = useState("")
  const [context, setContext] = useState("")
  const [expected, setExpected] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showPrevious, setShowPrevious] = useState(false)

  async function handleAnalyze() {
    setError("")
    if (wire.trim().length < 20) { setError("Paste the wire instructions."); return }
    setLoading(true); setResult(null)
    try {
      const res = await fetch("/api/verify-wire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wireInstructions: wire, previousInstructions: previous, transactionContext: context, recipientExpected: expected }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Analysis failed") }
      const data = await res.json()
      setResult(data.result)
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong") }
    finally { setLoading(false) }
  }

  async function copyEmail() {
    if (!result) return
    await navigator.clipboard.writeText(result.verificationEmail)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Wire Fraud Prevention</h1>
        <p className="text-sm text-slate-500 mt-1">Analyze wire instructions for fraud indicators and generate a verification communication.</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Wire Instructions *</label>
              <textarea value={wire} onChange={(e) => setWire(e.target.value)} placeholder="Paste the wire instructions received..." rows={8} className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
            </div>

            <button onClick={() => setShowPrevious(!showPrevious)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              {showPrevious ? "Hide" : "Compare with"} previous instructions
            </button>

            {showPrevious && (
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Previous Wire Instructions</label>
                <textarea value={previous} onChange={(e) => setPrevious(e.target.value)} placeholder="Paste previous instructions to compare for changes..." rows={6} className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Expected Recipient</label>
                <input type="text" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="e.g. ABC Title Company" className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Transaction Context</label>
                <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. 42 Maple St closing, April 28" className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={handleAnalyze} disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Shield className="h-4 w-4" /> Analyze Wire Instructions</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className={cn("inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border", riskColors[result.riskLevel])}>
              <Shield className="h-4 w-4" />
              Risk Level: {result.riskLevel.toUpperCase()}
            </div>
            <button onClick={() => { setResult(null); setWire(""); setPrevious("") }} className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-md">Analyze another</button>
          </div>

          {/* Extracted details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Extracted Details</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(result.extracted).map(([k, v]) => v && (
                <div key={k}><span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, " $1")}:</span> <span className="font-medium text-slate-800">{v}</span></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assessment</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Red Flags ({result.redFlags.length})</h2>
              <div className="space-y-2">
                {result.redFlags.map((f, i) => (
                  <div key={i} className={cn("rounded-lg border p-3", f.severity === "critical" ? "bg-red-100 border-red-300" : f.severity === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={cn("h-3.5 w-3.5", f.severity === "critical" || f.severity === "high" ? "text-red-500" : "text-amber-500")} />
                      <span className="text-xs font-semibold uppercase">{f.severity}</span>
                      <span className="text-sm font-medium text-slate-800">{f.issue}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changes */}
          {result.changes.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <h2 className="text-sm font-semibold text-red-800 mb-3">Changes Detected</h2>
              <div className="space-y-2">
                {result.changes.map((c, i) => (
                  <div key={i} className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <div className="text-sm font-medium text-slate-800 mb-1">{c.field}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Previous:</span> <span className="font-medium">{c.previous}</span></div>
                      <div><span className="text-slate-500">Current:</span> <span className="font-medium text-red-700">{c.current}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification email */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Verification Email (Ready to Send)</h2>
              <button onClick={copyEmail} className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors", copied ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">{result.verificationEmail}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
