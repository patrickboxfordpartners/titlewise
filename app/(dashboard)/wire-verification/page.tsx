"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Shield, AlertTriangle, Copy, Check, Mail, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { PrintButton } from "@/components/print-button"
import { trackEvent, EVENTS } from "@/lib/analytics"

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

const riskConfig = {
  low: { bg: "bg-green-500/8 border-green-500/20 text-green-700", label: "LOW RISK" },
  medium: { bg: "bg-amber-500/8 border-amber-500/20 text-amber-700", label: "MEDIUM RISK" },
  high: { bg: "bg-red-500/8 border-red-500/20 text-red-700", label: "HIGH RISK" },
  critical: { bg: "bg-red-500/15 border-red-500/30 text-red-800", label: "CRITICAL RISK" },
}

export default function WireVerificationPage() {
  const [wire, setWire] = useState("")
  const [previous, setPrevious] = useState("")
  const [context, setContext] = useState("")
  const [expected, setExpected] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [institutionalDeviations, setInstitutionalDeviations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [showPrevious, setShowPrevious] = useState(false)
  const [emailConnected, setEmailConnected] = useState(false)
  const [sendTo, setSendTo] = useState("")
  const [sendMode, setSendMode] = useState<"idle" | "compose" | "sending" | "sent">("idle")
  const [sendError, setSendError] = useState("")

  useEffect(() => {
    fetch("/api/email/status")
      .then((r) => r.json())
      .then((data: { google: boolean; outlook: boolean }) => setEmailConnected(data.google || data.outlook))
      .catch(() => {})
  }, [])

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
      setInstitutionalDeviations(data.institutionalDeviations ?? [])
      trackEvent(EVENTS.WIRE_VERIFIED, { riskLevel: data.result?.riskLevel, hasDeviations: (data.institutionalDeviations?.length ?? 0) > 0 })
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong") }
    finally { setLoading(false) }
  }

  async function copyEmail() {
    if (!result) return
    await navigator.clipboard.writeText(result.verificationEmail)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleSend() {
    if (!result || !sendTo.trim()) return
    setSendMode("sending")
    setSendError("")
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: sendTo,
          subject: "Wire Instruction Verification Request",
          body: result.verificationEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Send failed")
      setSendMode("sent")
      setTimeout(() => { setSendMode("idle"); setSendTo("") }, 3000)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed")
      setSendMode("compose")
    }
  }

  function openInEmail() {
    if (!result) return
    const subject = encodeURIComponent("Wire Instruction Verification Request")
    const body = encodeURIComponent(result.verificationEmail)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const monoClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2.5 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none transition-all"
  const inputClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Wire Fraud Prevention</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze wire instructions for fraud indicators and generate a verification communication.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Wire Instructions *</label>
                <textarea value={wire} onChange={(e) => setWire(e.target.value)} placeholder="Paste the wire instructions received..." rows={8} className={monoClass} />
              </div>

              <button
                onClick={() => setShowPrevious(!showPrevious)}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {showPrevious ? "Hide" : "Compare with"} previous instructions
              </button>

              <AnimatePresence>
                {showPrevious && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Previous Wire Instructions</label>
                    <textarea value={previous} onChange={(e) => setPrevious(e.target.value)} placeholder="Paste previous instructions to compare for changes..." rows={6} className={monoClass} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Expected Recipient</label>
                  <input type="text" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="e.g. ABC Title Company" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Context</label>
                  <input type="text" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. 42 Maple St closing, April 28" className={inputClass} />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-red-500">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <ShimmerButton loading={loading} onClick={handleAnalyze}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Shield className="h-4 w-4" /> Analyze Wire Instructions</>
                )}
              </ShimmerButton>
            </div>
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
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn("inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border", riskConfig[result.riskLevel].bg)}
              >
                <Shield className="h-4 w-4" />
                Risk Level: {riskConfig[result.riskLevel].label}
              </motion.div>
              <div className="flex items-center gap-2">
                <PrintButton label="Export PDF" />
                <button
                  onClick={() => { setResult(null); setWire(""); setPrevious("") }}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md transition-colors"
                >
                  Analyze another
                </button>
              </div>
            </motion.div>

            {/* Institutional memory deviations */}
            {institutionalDeviations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Institutional Memory Alert
                </h2>
                <ul className="space-y-1.5">
                  {institutionalDeviations.map((d, i) => (
                    <li key={i} className="text-sm text-red-700 dark:text-red-400 flex gap-2">
                      <span className="shrink-0">•</span>{d}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-600/70 mt-2">This routing number has been used in previous verifications with different details. Verify directly with the lender before wiring funds.</p>
              </motion.div>
            )}

            {/* Extracted details */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extracted Details</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(result.extracted).map(([k, v]) => v && (
                  <div key={k}>
                    <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>{" "}
                    <span className="font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assessment</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.summary}</p>
            </motion.div>

            {/* Red flags */}
            {result.redFlags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Red Flags{" "}
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 ml-1"
                  >
                    {result.redFlags.length}
                  </motion.span>
                </h2>
                <div className="space-y-2">
                  {result.redFlags.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn(
                        "rounded-lg border p-3",
                        f.severity === "critical" ? "bg-red-500/15 border-red-500/30" :
                        f.severity === "high" ? "bg-red-500/8 border-red-500/20" :
                        "bg-amber-500/8 border-amber-500/20"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={cn("h-3.5 w-3.5", f.severity === "critical" || f.severity === "high" ? "text-red-500" : "text-amber-500")} />
                        <span className={cn("text-xs font-semibold uppercase", f.severity === "critical" || f.severity === "high" ? "text-red-600" : "text-amber-600")}>{f.severity}</span>
                        <span className="text-sm font-medium text-foreground">{f.issue}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">{f.detail}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Changes */}
            {result.changes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} className="bg-card rounded-xl border border-red-500/20 p-5">
                <h2 className="text-sm font-semibold text-red-700 mb-3">Changes Detected</h2>
                <div className="space-y-2">
                  {result.changes.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-lg bg-red-500/8 border border-red-500/20 p-3"
                    >
                      <div className="text-sm font-medium text-foreground mb-1">{c.field}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Previous:</span> <span className="font-medium">{c.previous}</span></div>
                        <div><span className="text-muted-foreground">Current:</span> <span className="font-medium text-red-600">{c.current}</span></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Verification email */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Verification Email</h2>
                <div className="flex gap-2">
                  <button
                    onClick={openInEmail}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-muted text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> Open in Email
                  </button>
                  {emailConnected && sendMode !== "sent" && (
                    <button
                      onClick={() => setSendMode(sendMode === "compose" ? "idle" : "compose")}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  )}
                  {sendMode === "sent" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 text-green-600">
                      <Check className="h-3.5 w-3.5" /> Sent
                    </span>
                  )}
                  <button
                    onClick={copyEmail}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                      copied ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Inline send compose */}
              <AnimatePresence>
                {(sendMode === "compose" || sendMode === "sending") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="flex gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <input
                        type="email"
                        value={sendTo}
                        onChange={(e) => setSendTo(e.target.value)}
                        placeholder="Recipient email address"
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="flex-1 text-sm text-foreground bg-card border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sendMode === "sending" || !sendTo.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {sendMode === "sending" ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5" /> Send</>
                        )}
                      </button>
                    </div>
                    {sendError && <p className="text-xs text-red-500 mt-1 px-1">{sendError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 max-h-64 overflow-y-auto border border-border">
                {result.verificationEmail}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
