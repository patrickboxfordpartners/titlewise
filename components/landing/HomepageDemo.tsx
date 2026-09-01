"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useThemeColors } from "@/lib/useThemeColors"

const MATTER = {
  client: "Sarah and David Thompson",
  address: "18 Harbor View Drive, Portsmouth, NH",
  type: "Purchase",
  stage: "Title Search Ordered",
  closingDate: "Sep 15, 2026",
  fileNumber: "2026-NH-41892",
}

const CHECKLIST = [
  { id: 1, label: "Signed purchase/sale agreement received", initial: true },
  { id: 2, label: "Title search ordered", initial: true },
  { id: 3, label: "Title commitment received and reviewed", initial: false },
  { id: 4, label: "Title exceptions cleared", initial: false },
  { id: 5, label: "Survey reviewed", initial: false },
  { id: 6, label: "Wire instructions verified", initial: false },
  { id: 7, label: "Closing date confirmed with all parties", initial: false },
  { id: 8, label: "Settlement statement prepared", initial: false },
]

const WIRE = { bank: "First National Bank", account: "****4821", routing: "021000021", amount: "$487,250.00" }

const WIRE_CHECKS = [
  { id: 1, label: "Account matches prior closing", status: "pass" },
  { id: 2, label: "Routing number verified", status: "pass" },
  { id: 3, label: "Beneficiary cross-reference", status: "pass" },
  { id: 4, label: "Amount within expected range", status: "pass" },
  { id: 5, label: "Last-minute change detection", status: "warn" },
  { id: 6, label: "Email domain spoofing check", status: "pass" },
]

const ANALYSIS_LINES = [
  "Analyzing title commitment for 18 Harbor View Drive...",
  "",
  "3 exceptions identified",
  "2 requirements flagged as actionable",
  "1 mortgage lien requires payoff at closing",
  "",
  "KEY FINDING: Active mortgage lien (Book 4821) must be",
  "discharged before title can transfer.",
  "",
  "Easement affects northerly 15ft. Survey recommended.",
]

const AGENT_STEPS = [
  "Analyzing matter: 18 Harbor View Drive...",
  "Reading email thread for updates...",
  "Title commitment found in inbox (Sep 2)",
  "Marking: Title commitment received",
  "Running wire fraud verification...",
  "6 checks complete. 1 caution flag.",
  "Drafting status update email...",
  "Surfacing blocker: wire instructions received late",
  "Done. 1 item updated, 1 blocker flagged.",
]

const EMAIL_DRAFT = `Subject: Status Update | 18 Harbor View Drive

Dear Sarah and David,

Quick update: we have received and reviewed the title commitment for your property. We are now working through the title exceptions.

Next step: we are still awaiting wire instructions from the lender. I will follow up with them today.

Best regards,
Patrick Mitchell`

const FORM_FIELDS = [
  { key: "client", label: "Client Name", value: MATTER.client },
  { key: "address", label: "Property Address", value: MATTER.address },
  { key: "type", label: "Transaction Type", value: MATTER.type },
  { key: "stage", label: "Current Stage", value: MATTER.stage },
]

export default function HomepageDemo() {
  const c = useThemeColors()
  const GREEN = "#22c55e"
  const RED = "#ef4444"
  const YELLOW = "#f59e0b"

  const panelBg = c.isDark ? "#141820" : "#ffffff"
  const centerBg = c.isDark ? "#0a0d12" : "#f8fafc"
  const codeBg = c.isDark ? "#0a0d12" : "#f1f5f9"
  const inputBg = c.isDark ? "rgba(255,255,255,0.04)" : "#ffffff"
  const dimText = c.isDark ? "rgba(237,238,240,0.2)" : "#94a3b8"
  const border = c.isDark ? "rgba(237,238,240,0.08)" : "#e2e8f0"
  const textColor = c.isDark ? "#EDEEF0" : "#0d253d"
  const mutedColor = c.isDark ? "rgba(237,238,240,0.45)" : "#64748b"

  const [phase, setPhase] = useState<"idle" | "uploading" | "filling" | "analyzing" | "agents" | "done">("idle")
  const [uploadPct, setUploadPct] = useState(0)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [activeField, setActiveField] = useState<string | null>(null)
  const [analysisText, setAnalysisText] = useState("")
  const [completed, setCompleted] = useState<number[]>([1, 2])
  const [agentLog, setAgentLog] = useState<string[]>([])
  const [wireVisible, setWireVisible] = useState(false)
  const [wireChecks, setWireChecks] = useState<number[]>([])
  const [blocker, setBlocker] = useState(false)
  const [emailDraft, setEmailDraft] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<"entry" | "file" | "agent">("file")
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  function clear() { timeouts.current.forEach(clearTimeout); timeouts.current = [] }
  function sched(fn: () => void, ms: number) { const t = setTimeout(fn, ms); timeouts.current.push(t); return t }

  function typeText(text: string, setter: (s: string) => void, speed: number) {
    let i = 0
    function next() {
      if (i <= text.length) { setter(text.slice(0, i)); i++; if (i <= text.length) sched(next, speed) }
    }
    next()
  }

  function run() {
    clear()
    setPhase("idle"); setUploadPct(0); setFields({}); setActiveField(null)
    setAnalysisText(""); setCompleted([1, 2]); setAgentLog([]); setWireVisible(false)
    setWireChecks([]); setBlocker(false); setEmailDraft("")

    let t = 500
    sched(() => { setPhase("uploading"); let p = 0; const tick = setInterval(() => { p += 6; setUploadPct(Math.min(p, 100)); if (p >= 100) clearInterval(tick) }, 50) }, t)
    t += 1200
    sched(() => setPhase("filling"), t)
    FORM_FIELDS.forEach(({ key, value }, idx) => {
      sched(() => { setActiveField(key); let i = 0; function type() { if (i <= value.length) { const ci = i; setFields(prev => ({ ...prev, [key]: value.slice(0, ci) })); i++; if (i <= value.length) sched(type, 20); else setActiveField(null) } } type() }, t + idx * 700)
    })
    t += FORM_FIELDS.length * 700 + 400
    sched(() => { setPhase("analyzing"); typeText(ANALYSIS_LINES.join("\n"), setAnalysisText, 12) }, t)
    t += ANALYSIS_LINES.join("\n").length * 12 + 600
    sched(() => setPhase("agents"), t)
    AGENT_STEPS.forEach((step, idx) => {
      sched(() => {
        setAgentLog(prev => [...prev, step])
        if (step.includes("Title commitment")) sched(() => setCompleted(prev => [...prev, 3]), 200)
        if (step.includes("wire fraud")) setWireVisible(true)
        if (step.includes("6 checks")) { WIRE_CHECKS.forEach((wc, ci) => sched(() => setWireChecks(prev => [...prev, wc.id]), ci * 180)) }
        if (step.includes("Surfacing blocker")) sched(() => setBlocker(true), 200)
        if (step.includes("Drafting")) typeText(EMAIL_DRAFT, setEmailDraft, 12)
      }, t + idx * 800)
    })
    t += AGENT_STEPS.length * 800 + EMAIL_DRAFT.length * 12 + 800
    sched(() => setPhase("done"), t)
    sched(run, t + 4000)
  }

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setIsMobile(true)
      setPhase("done")
      setFields(Object.fromEntries(FORM_FIELDS.map(f => [f.key, f.value])))
      setAnalysisText(ANALYSIS_LINES.join("\n"))
      setCompleted([1, 2, 3]); setAgentLog(AGENT_STEPS)
      setWireVisible(true); setWireChecks(WIRE_CHECKS.map(wc => wc.id))
      setBlocker(true); setEmailDraft(EMAIL_DRAFT)
      return
    }
    run()
    return clear
  }, [])

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [agentLog])

  return (
    <section style={{ borderTop: `1px solid ${border}`, padding: "96px 24px", backgroundColor: c.isDark ? c.bg : "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "10px", fontWeight: 400, color: c.primary, letterSpacing: "0.1px", textTransform: "uppercase", marginBottom: 16 }}>Live Demo</p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.64px", color: textColor, marginBottom: 12 }}>Watch TITLEwise work a real closing</h2>
          <p className="tw-hp-demo-desc" style={{ fontSize: "15px", fontWeight: 300, color: mutedColor, maxWidth: 520 }}>Document entry on the left. File details in the center. AI agents working live on the right.</p>
        </div>

        {/* Status pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, background: c.isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", border: `1px solid ${c.isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: phase === "done" ? GREEN : c.primary, animation: phase !== "idle" && phase !== "done" ? "tw-hp-pulse 1.5s ease-in-out infinite" : "none" }} />
            <span style={{ fontSize: 12, fontWeight: 300, color: textColor }}>
              {phase === "idle" && "Starting demo..."}
              {phase === "uploading" && "Uploading title commitment..."}
              {phase === "filling" && "Populating matter details..."}
              {phase === "analyzing" && "Analyzing title commitment..."}
              {phase === "agents" && "Agent analyzing, verifying wire, drafting email..."}
              {phase === "done" && "Complete. Restarting..."}
            </span>
          </div>
        </div>

        {/* Mobile tabs */}
        {isMobile && (
          <div style={{ display: "flex", gap: 4, marginBottom: 12, background: c.isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", borderRadius: 8, padding: 3 }}>
            {([["entry", "Documents"], ["file", "File Info"], ["agent", "AI Agent"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 12,
                  fontWeight: activeTab === key ? 500 : 300,
                  color: activeTab === key ? textColor : mutedColor,
                  background: activeTab === key ? panelBg : "transparent",
                  border: activeTab === key ? `1px solid ${border}` : "1px solid transparent",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 3-column grid */}
        <div className="tw-hp-demo-3col" style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, borderRadius: 12, overflow: "hidden", border: `1px solid ${border}`, boxShadow: c.isDark ? "0 24px 64px rgba(0,0,0,0.4)" : "0 24px 64px rgba(0,55,112,0.08)" }}>

          {/* LEFT: Document Entry */}
          <div className="tw-hp-demo-left" style={{ background: panelBg, padding: 24, display: isMobile && activeTab !== "entry" ? "none" : "block" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: dimText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Document Entry</p>
            <div style={{ border: `1px dashed ${phase === "uploading" ? c.primary : border}`, borderRadius: 8, padding: 16, textAlign: "center", marginBottom: 20, background: phase === "uploading" ? (c.isDark ? "rgba(59,130,246,0.05)" : "#eff6ff") : "transparent", transition: "all 0.3s" }}>
              <p style={{ fontSize: 12, color: phase === "uploading" ? c.primary : dimText, marginBottom: phase === "uploading" ? 8 : 0 }}>
                {phase === "idle" ? "title-commitment-18-harbor-view.pdf" : phase === "uploading" ? "Uploading..." : "title-commitment-18-harbor-view.pdf"}
              </p>
              {phase === "uploading" && (
                <div style={{ background: border, borderRadius: 99, height: 3, overflow: "hidden" }}>
                  <div style={{ background: c.primary, height: "100%", width: `${uploadPct}%`, transition: "width 0.05s linear", borderRadius: 99 }} />
                </div>
              )}
            </div>
            {FORM_FIELDS.map(({ key, label }) => {
              const isActive = activeField === key
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: dimText, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
                  <div style={{ background: inputBg, border: `1px solid ${isActive ? (c.isDark ? "rgba(59,130,246,0.5)" : "#93c5fd") : border}`, borderRadius: 6, padding: "6px 10px", minHeight: 26, transition: "border-color 0.2s", boxShadow: isActive ? `0 0 0 2px ${c.isDark ? "rgba(59,130,246,0.12)" : "rgba(0,102,204,0.08)"}` : "none" }}>
                    <span style={{ fontSize: 13, color: textColor }}>
                      {fields[key] || ""}
                      {isActive && <span style={{ display: "inline-block", width: 1.5, height: "0.85em", background: c.primary, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-hp-blink 0.8s step-end infinite" }} />}
                    </span>
                  </div>
                </div>
              )
            })}
            {analysisText && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: dimText, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>Analysis</p>
                <div style={{ background: codeBg, borderRadius: 8, padding: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11, color: mutedColor, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}>
                  {analysisText}
                  {phase === "analyzing" && analysisText.length < ANALYSIS_LINES.join("\n").length && (
                    <span style={{ display: "inline-block", width: 1.5, height: "0.85em", background: c.primary, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-hp-blink 0.8s step-end infinite" }} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CENTER: File Information */}
          <div className="tw-hp-demo-center" style={{ background: centerBg, padding: 24, borderLeft: isMobile ? "none" : `1px solid ${border}`, borderRight: isMobile ? "none" : `1px solid ${border}`, display: isMobile && activeTab !== "file" ? "none" : "block" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: dimText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>File Information</p>
            <div style={{ background: panelBg, borderRadius: 8, border: `1px solid ${border}`, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 400, color: textColor, marginBottom: 2 }}>{fields.client || "..."}</p>
              <p style={{ fontSize: 12, color: mutedColor }}>{fields.address || ""}</p>
              {fields.type && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 9999, background: c.isDark ? "rgba(59,130,246,0.12)" : "#eff6ff", color: c.primary }}>{fields.type}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 9999, background: c.isDark ? "rgba(245,158,11,0.12)" : "#fef3c7", color: YELLOW }}>{fields.stage || ""}</span>
                </div>
              )}
              <p style={{ fontSize: 10, color: dimText, marginTop: 8 }}>{MATTER.fileNumber} &middot; Closing {MATTER.closingDate}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: dimText, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Closing Checklist</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {CHECKLIST.map((item) => {
                  const done = completed.includes(item.id)
                  const justDone = !item.initial && done
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${done ? GREEN : border}`, background: done ? GREEN : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", boxShadow: justDone ? "0 0 8px rgba(34,197,94,0.5)" : "none" }}>
                        {done && <svg width="7" height="7" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 12, color: done ? mutedColor : (c.isDark ? "rgba(237,238,240,0.25)" : "#cbd5e1"), textDecoration: done ? "line-through" : "none", transition: "all 0.3s" }}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {wireVisible && (
              <div style={{ animation: "tw-hp-fade-in 0.3s ease" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: dimText, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Wire Verification</p>
                <div style={{ background: panelBg, borderRadius: 8, border: `1px solid ${border}`, padding: 12, marginBottom: 10 }}>
                  {Object.entries({ Bank: WIRE.bank, Account: WIRE.account, Routing: WIRE.routing, Amount: WIRE.amount }).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: dimText }}>{k}</span>
                      <span style={{ fontSize: 11, color: textColor, fontFamily: k === "Account" || k === "Routing" ? "'SF Mono', monospace" : "inherit" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {WIRE_CHECKS.map((wc) => {
                    const vis = wireChecks.includes(wc.id)
                    return (
                      <div key={wc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 8px", borderRadius: 4, opacity: vis ? 1 : 0.2, transition: "all 0.25s", borderLeft: vis ? `2px solid ${wc.status === "pass" ? GREEN : YELLOW}` : "2px solid transparent" }}>
                        <span style={{ fontSize: 11, color: vis ? textColor : dimText }}>{wc.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: wc.status === "pass" ? GREEN : YELLOW }}>{vis ? (wc.status === "pass" ? "PASS" : "FLAG") : ""}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Agent Activity */}
          <div className="tw-hp-demo-right" style={{ background: panelBg, padding: 24, display: isMobile && activeTab !== "agent" ? "none" : "block" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: dimText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Agent Activity</p>
            <div ref={logRef} style={{ background: codeBg, borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 100, maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {agentLog.length === 0 && <p style={{ fontSize: 11, fontFamily: "'SF Mono', monospace", color: dimText }}>Waiting for document...</p>}
              {agentLog.map((line, i) => (
                <p key={i} style={{ fontSize: 11, fontFamily: "'SF Mono', monospace", color: i === agentLog.length - 1 ? mutedColor : dimText, margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: c.isDark ? "rgba(59,130,246,0.5)" : "#93c5fd", marginRight: 6 }}>&#8250;</span>{line}
                </p>
              ))}
              {phase === "agents" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: c.primary, animation: "tw-hp-pulse 1s ease-in-out infinite", marginTop: 4 }} />}
            </div>
            {blocker && (
              <div style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 16, background: c.isDark ? "rgba(239,68,68,0.08)" : "#fef2f2", border: `1px solid ${c.isDark ? "rgba(239,68,68,0.25)" : "#fecaca"}`, borderLeft: `3px solid ${RED}`, animation: "tw-hp-fade-in 0.3s ease" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: RED, marginBottom: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}>Blocker</p>
                <p style={{ fontSize: 12, color: mutedColor, margin: 0 }}>Wire instructions received late. Flag for verbal confirmation.</p>
              </div>
            )}
            {emailDraft && (
              <div style={{ animation: "tw-hp-fade-in 0.3s ease" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: dimText, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Drafted Status Email</p>
                <div style={{ background: codeBg, borderRadius: 8, padding: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11, color: mutedColor, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 240, overflowY: "auto" }}>
                  {emailDraft}
                  {emailDraft.length > 0 && emailDraft.length < EMAIL_DRAFT.length && (
                    <span style={{ display: "inline-block", width: 1.5, height: "0.85em", background: c.primary, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-hp-blink 0.8s step-end infinite" }} />
                  )}
                </div>
                {emailDraft.length === EMAIL_DRAFT.length && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <div style={{ padding: "6px 14px", borderRadius: 6, background: c.primary, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "default" }}>Send email</div>
                    <div style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${border}`, fontSize: 12, color: dimText, cursor: "default" }}>Edit</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA below demo */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ fontSize: 14, fontWeight: 300, color: mutedColor, marginBottom: 20 }}>30 minutes back. Every file.</p>
          <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", color: c.primary, fontSize: 14, fontWeight: 400, textDecoration: "none", gap: 4 }}>
            View full demo &rarr;
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes tw-hp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes tw-hp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tw-hp-fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 1024px) {
          .tw-hp-demo-3col { grid-template-columns: 1fr 1fr !important; }
          .tw-hp-demo-right { grid-column: 1 / -1 !important; }
        }
        @media (max-width: 640px) {
          .tw-hp-demo-3col { grid-template-columns: 1fr !important; }
          .tw-hp-demo-left, .tw-hp-demo-center, .tw-hp-demo-right { border-left: none !important; border-right: none !important; }
          .tw-hp-demo-desc { display: none !important; }
        }
      `}</style>
    </section>
  )
}
