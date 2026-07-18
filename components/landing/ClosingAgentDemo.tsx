"use client"

import { useEffect, useState, useRef } from "react"

const CHECKLIST_BEFORE = [
  { id: 1, label: "Signed purchase/sale agreement received", done: true },
  { id: 2, label: "Title search ordered", done: true },
  { id: 3, label: "Title commitment received and reviewed", done: false },
  { id: 4, label: "Title exceptions cleared", done: false },
  { id: 5, label: "Survey reviewed", done: false },
  { id: 6, label: "Wire instructions verified", done: false },
  { id: 7, label: "Closing date confirmed with all parties", done: false },
  { id: 8, label: "Settlement statement prepared", done: false },
]

const AGENT_STEPS = [
  { delay: 600, text: "Analyzing matter: 18 Harbor View Drive..." },
  { delay: 1400, text: "Reading email thread for updates..." },
  { delay: 2200, text: "Title commitment found in inbox (Jun 14)" },
  { delay: 2900, text: "Marking: Title commitment received ✓" },
  { delay: 3500, text: "Drafting status update email..." },
  { delay: 4200, text: "Surfacing blocker: wire instructions not yet received" },
  { delay: 4900, text: "Done. 1 item updated, 1 blocker flagged." },
]

const AUTO_COMPLETE = [3] // item IDs that get auto-completed

export default function ClosingAgentDemo() {
  const [log, setLog] = useState<string[]>([])
  const [completed, setCompleted] = useState<number[]>([1, 2])
  const [blocker, setBlocker] = useState(false)
  const [emailDraft, setEmailDraft] = useState("")
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const EMAIL_DRAFT = `Subject: Status Update — 18 Harbor View Drive

Dear Sarah and David,

Quick update: we have received and reviewed the title commitment for your property. We are now working through the title exceptions.

Next step: we are still awaiting wire instructions from the lender. I will follow up with them today.

— Patrick Mitchell`

  function clear() { timeouts.current.forEach(clearTimeout); timeouts.current = [] }

  function run() {
    clear()
    setLog([])
    setCompleted([1, 2])
    setBlocker(false)
    setEmailDraft("")

    AGENT_STEPS.forEach(({ delay, text }) => {
      const t = setTimeout(() => {
        setLog(prev => [...prev, text])
        if (text.includes("Title commitment received")) {
          setTimeout(() => setCompleted(prev => [...prev, 3]), 200)
        }
        if (text.includes("Drafting status update")) {
          let i = 0
          function type() {
            if (i <= EMAIL_DRAFT.length) {
              setEmailDraft(EMAIL_DRAFT.slice(0, i))
              i++
              if (i <= EMAIL_DRAFT.length) {
                const t2 = setTimeout(type, 15)
                timeouts.current.push(t2)
              }
            }
          }
          type()
        }
        if (text.includes("blocker")) {
          setTimeout(() => setBlocker(true), 200)
        }
      }, delay)
      timeouts.current.push(t)
    })

    const loopDelay = 4900 + EMAIL_DRAFT.length * 15 + 4000
    const loopT = setTimeout(run, loopDelay)
    timeouts.current.push(loopT)
  }

  useEffect(() => {
    if (window.innerWidth < 640) {
      setLog(AGENT_STEPS.map(s => s.text))
      setCompleted([1, 2, 3])
      setBlocker(true)
      setEmailDraft(EMAIL_DRAFT)
      return
    }
    run()
    return clear
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const BG = "#0f1219"
  const PANEL = "#141820"
  const BORDER = "rgba(237,238,240,0.08)"
  const TEXT = "#EDEEF0"
  const MUTED = "rgba(237,238,240,0.45)"
  const DIM = "rgba(237,238,240,0.2)"
  const BLUE = "#3b82f6"
  const GREEN = "#22c55e"
  const RED = "#ef4444"

  return (
    <section style={{ borderTop: `1px solid rgba(237,238,240,0.07)`, padding: "80px 32px", background: BG }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: BLUE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Closing Agent
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, marginBottom: 12 }}>
            Your AI closing coordinator.
          </h2>
          <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 480 }}>
            The Closing Agent reads your matter, updates the checklist from emails and documents, drafts the status update, and surfaces blockers — without being asked.
          </p>
        </div>

        <div className="tw-demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          {/* Left — checklist + agent log */}
          <div className="tw-demo-left" style={{ background: PANEL, padding: "28px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Checklist */}
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Closing Checklist
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {CHECKLIST_BEFORE.map((item) => {
                  const done = completed.includes(item.id)
                  const justDone = AUTO_COMPLETE.includes(item.id) && done
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `1.5px solid ${done ? GREEN : BORDER}`,
                        background: done ? GREEN : "transparent",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s",
                        boxShadow: justDone ? `0 0 8px rgba(34,197,94,0.5)` : "none",
                      }}>
                        {done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{
                        fontSize: "0.8rem", color: done ? MUTED : "rgba(237,238,240,0.3)",
                        textDecoration: done ? "line-through" : "none",
                        transition: "all 0.3s",
                      }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Blocker */}
            {blocker && (
              <div style={{
                padding: "10px 12px", borderRadius: 8,
                background: "rgba(239,68,68,0.08)",
                border: `1px solid rgba(239,68,68,0.25)`,
                borderLeft: `3px solid ${RED}`,
                animation: "tw-fade-in 0.3s ease",
              }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: RED, marginBottom: 3 }}>BLOCKER</p>
                <p style={{ fontSize: "0.8rem", color: MUTED, margin: 0 }}>Wire instructions not yet received from lender</p>
              </div>
            )}

            {/* Agent log */}
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Agent Activity
              </p>
              <div ref={logRef} style={{ background: "#0a0d12", borderRadius: 8, padding: "12px", maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {log.map((line, i) => (
                  <p key={i} style={{ fontSize: "0.75rem", color: i === log.length - 1 ? MUTED : DIM, margin: 0, fontFamily: "'SF Mono', monospace", lineHeight: 1.5 }}>
                    <span style={{ color: "rgba(59,130,246,0.5)", marginRight: 6 }}>›</span>{line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Right — drafted email */}
          <div style={{ background: "#0a0d12", padding: "28px", borderLeft: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Drafted Status Update
            </p>
            <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "0.775rem", color: MUTED, lineHeight: 1.8, whiteSpace: "pre-wrap", minHeight: 280 }}>
              {emailDraft}
              {emailDraft.length > 0 && emailDraft.length < EMAIL_DRAFT.length && (
                <span style={{ display: "inline-block", width: 1.5, height: "0.9em", background: BLUE, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-blink 0.8s step-end infinite" }} />
              )}
            </div>
            {emailDraft.length === EMAIL_DRAFT.length && emailDraft.length > 0 && (
              <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                <div style={{ padding: "7px 14px", borderRadius: 6, background: BLUE, fontSize: "0.8125rem", fontWeight: 600, color: "#fff", cursor: "default" }}>
                  Send email
                </div>
                <div style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${BORDER}`, fontSize: "0.8125rem", color: DIM, cursor: "default" }}>
                  Edit
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes tw-fade-in { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 640px) {
          .tw-demo-grid { grid-template-columns: 1fr !important; }
          .tw-demo-left { display: none !important; }
        }
      `}</style>
    </section>
  )
}
