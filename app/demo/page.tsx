"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Copy, Check, RotateCcw, FileText, FileSearch, FileCheck,
  Shield, Building, DollarSign, Calculator, ClipboardList,
  X, ChevronRight, Play, Loader2,
} from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter"

const MOCK_MATTER = {
  clientName: "Robert and Susan Hartley",
  propertyAddress: "18 Birchwood Lane, Portsmouth, NH 03801",
  transactionType: "Purchase",
  closingStage: "Clear to Close",
  completedItems: "Title search completed, title insurance commitment issued, survey received, HOA docs reviewed, wire instructions verified",
  outstandingItems: "Final walkthrough pending, lender final approval email outstanding, closing date confirmation needed from buyer",
  upcomingDeadlines: "Closing scheduled for May 28 at 10:00 AM, Loan commitment expires May 31",
  attorneyName: "Sarah Mitchell",
  tone: "professional",
}

const MOCK_OUTPUT = `Subject: Closing Update — 18 Birchwood Lane, Portsmouth, NH 03801

Dear Robert and Susan,

I wanted to reach out with a quick status update on your purchase of 18 Birchwood Lane.

Great news — we've received our Clear to Close from the lender and we're on track for your scheduled closing on May 28 at 10:00 AM. The title search has been completed, title insurance commitment has been issued, and we've reviewed and cleared the HOA documentation.

A few items remaining before closing:

• We're waiting on the lender's final approval email — this is standard and expected within the next 24-48 hours.
• Please confirm your final walkthrough is complete and there are no outstanding concerns with the property.
• Note that your loan commitment expires May 31, so we're prioritizing a smooth close on the 28th.

Wire instructions have been verified on our end. Once we receive the final lender confirmation, I'll send over the exact figures for your cashier's check or wire transfer.

Please don't hesitate to reach out with any questions. We're in the final stretch — everything is on schedule.

Best regards,
Sarah Mitchell
TitleWise Law Office`

const TOOLS = [
  { icon: FileText, label: "Status Updates", desc: "Client emails drafted. Seconds, not minutes.", color: "blue" },
  { icon: FileSearch, label: "Title Analyzer", desc: "Schedule B requirements in plain English.", color: "blue" },
  { icon: FileCheck, label: "CD Reviewer", desc: "Compare CD against contract. Discrepancies flagged.", color: "purple" },
  { icon: Shield, label: "Wire Fraud Prevention", desc: "Fraud indicators detected automatically.", color: "red" },
  { icon: Building, label: "HOA Reviewer", desc: "Dues, assessments, restrictions extracted.", color: "purple" },
  { icon: DollarSign, label: "Fee Estimator", desc: "Professional estimate letters auto-generated.", color: "green" },
  { icon: Calculator, label: "Tax Proration", desc: "Buyer/seller prorations calculated instantly.", color: "green" },
  { icon: ClipboardList, label: "Closing Checklist", desc: "State-specific checklists for 7 states.", color: "blue" },
]

const colorMap: Record<string, string> = {
  blue: "text-blue-600 bg-blue-500/10 border-blue-500/30",
  purple: "text-purple-600 bg-purple-500/10 border-purple-500/30",
  red: "text-red-600 bg-red-500/10 border-red-500/30",
  green: "text-green-600 bg-green-500/10 border-green-500/30",
}

function typewriterEffect(
  text: string,
  setter: (fn: (prev: string) => string) => void,
  onDone: () => void
) {
  let i = 0
  const interval = setInterval(() => {
    if (i >= text.length) {
      clearInterval(interval)
      onDone()
      return
    }
    const chunkSize = Math.floor(Math.random() * 8) + 3
    setter((prev) => prev + text.slice(i, i + chunkSize))
    i += chunkSize
  }, 25)
  return interval
}

export default function DemoPage() {
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleGenerate() {
    if (loading) return
    setOutput("")
    setLoading(true)
    setHasGenerated(true)

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = typewriterEffect(
      MOCK_OUTPUT,
      setOutput,
      () => setLoading(false)
    )
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setOutput("")
    setLoading(false)
    setHasGenerated(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Top nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, height: 60, backgroundColor: "#111827", borderBottom: "1px solid rgba(237,238,240,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "auto" }}>
            <rect x="10" y="0" width="24" height="32" rx="4" fill="rgba(255,255,255,0.35)" />
            <rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB" />
          </svg>
          <span style={{ fontFamily: "inherit", fontSize: "1rem", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, color: "#EDEEF0", letterSpacing: "-0.01em" }}>TITLE</span>
            <span style={{ fontWeight: 300, color: "rgba(237,238,240,0.5)" }}>wise</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" style={{ fontSize: "0.875rem", color: "rgba(237,238,240,0.5)", textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/sign-up" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", backgroundColor: "#2563EB", borderRadius: 8, padding: "7px 14px", textDecoration: "none" }}>
            Get started
          </Link>
        </div>
      </header>

      {/* Demo banner */}
      {!dismissed && (
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm mx-auto">
            <span className="font-bold">Demo Mode</span>
            <span className="text-white/70">—</span>
            <span className="text-white/80">Pre-filled with a sample matter. Click Generate to see it in action.</span>
            <Link href="/sign-up" className="font-bold underline hover:no-underline ml-1">
              Start free →
            </Link>
          </div>
          <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-2">Status Update Generator — Demo</p>
          <h1 className="text-3xl font-black text-foreground tracking-tight">See TitleWise in Action</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            A real closing matter, pre-filled. Hit Generate to watch the AI draft a client email in seconds.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form (read-only prefilled) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="bg-card rounded-2xl border border-blue-500/30 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Matter Details</h2>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase tracking-wide">
                  Sample Matter
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Client Name", value: MOCK_MATTER.clientName },
                  { label: "Property Address", value: MOCK_MATTER.propertyAddress },
                  { label: "Transaction Type", value: MOCK_MATTER.transactionType },
                  { label: "Closing Stage", value: MOCK_MATTER.closingStage },
                  { label: "Attorney Name", value: MOCK_MATTER.attorneyName },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{field.label}</label>
                    <p className="mt-1 text-sm font-medium text-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border">
                      {field.value}
                    </p>
                  </div>
                ))}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Completed Items</label>
                  <p className="mt-1 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border leading-relaxed">
                    {MOCK_MATTER.completedItems}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Outstanding Items</label>
                  <p className="mt-1 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border leading-relaxed">
                    {MOCK_MATTER.outstandingItems}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Upcoming Deadlines</label>
                  <p className="mt-1 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border leading-relaxed">
                    {MOCK_MATTER.upcomingDeadlines}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black text-sm py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Play className="h-4 w-4" fill="currentColor" /> Generate Status Update</>
                  )}
                </button>
                {hasGenerated && !loading && (
                  <button
                    onClick={handleReset}
                    className="px-3 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Output */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-card rounded-2xl border border-blue-500/30 p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Generated Email</h2>
                {output && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              {!hasGenerated && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Ready to generate</p>
                    <p className="text-xs mt-1">Click Generate to watch the AI draft a client email from the matter details.</p>
                  </div>
                </div>
              )}

              {(output || loading) && (
                <div className="flex-1 text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap overflow-y-auto">
                  {output}
                  {loading && (
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* All tools section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-1">8 Tools. One Platform.</p>
          <h2 className="text-xl font-black text-foreground tracking-tight mb-6">Everything a closing attorney needs, built-in</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {TOOLS.map(({ icon: Icon, label, desc, color }) => {
              const cls = colorMap[color] ?? colorMap.blue
              const [iconCls, bgCls, borderCls] = cls.split(" ")
              return (
                <div
                  key={label}
                  className={`bg-card rounded-2xl border-2 ${borderCls} p-4`}
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  <div className={`w-9 h-9 rounded-xl ${bgCls} border ${borderCls} flex items-center justify-center mb-3`}>
                    <Icon className={`h-4.5 w-4.5 ${iconCls}`} strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-black text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-blue-500/20 p-8 text-center"
        >
          <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">
            30 minutes back. Every file.
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto font-medium">
            TitleWise handles the repetitive work so you can focus on the closing. Try it free — no credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              Get started
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              View pricing →
            </Link>
          </div>
        </motion.div>
      </div>
      <LandingFooter />
    </div>
  )
}
