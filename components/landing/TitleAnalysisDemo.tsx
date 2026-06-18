"use client"

import { useEffect, useState, useRef } from "react"

const TITLE_EXCEPTIONS = [
  { id: 1, type: "EXCEPTION", severity: "high", text: "Mortgage in favor of First National Bank dated March 12, 2019, recorded in Book 4821, Page 203." },
  { id: 2, type: "EXCEPTION", severity: "medium", text: "Easement for utility purposes over the northerly 15 feet of the premises." },
  { id: 3, type: "EXCEPTION", severity: "low", text: "Restrictions of record in Book 2244, Page 118. None of which currently apply." },
  { id: 4, type: "REQUIREMENT", severity: "high", text: "Payoff and discharge of mortgage to First National Bank must be obtained prior to closing." },
  { id: 5, type: "REQUIREMENT", severity: "medium", text: "Survey must be obtained confirming no encroachments on easement area." },
  { id: 6, type: "REQUIREMENT", severity: "low", text: "Provide evidence of payment of real estate taxes through closing date." },
]

const ANALYSIS_TEXT = `Analyzing title commitment for 18 Harbor View Drive...

→ 3 exceptions identified
→ 2 requirements flagged as actionable
→ 1 mortgage lien requires payoff at closing

KEY FINDING: Active mortgage lien (Book 4821) must be
discharged before title can transfer. Coordinate payoff
with First National Bank immediately.

Easement affects northerly 15ft — verify no structures
encroach. Survey recommended.

Restrictions in Book 2244 are historical — no current
impact on this transaction.`

export default function TitleAnalysisDemo() {
  const [phase, setPhase] = useState<"idle" | "uploading" | "analyzing" | "results">("idle")
  const [analysisText, setAnalysisText] = useState("")
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  function clear() {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  function run() {
    clear()
    setPhase("idle")
    setAnalysisText("")
    setVisibleItems([])
    setProgress(0)

    const t1 = setTimeout(() => {
      setPhase("uploading")
      let p = 0
      const tick = setInterval(() => {
        p += 8
        setProgress(Math.min(p, 100))
        if (p >= 100) {
          clearInterval(tick)
          const t2 = setTimeout(() => {
            setPhase("analyzing")
            let i = 0
            function typeChar() {
              if (i <= ANALYSIS_TEXT.length) {
                setAnalysisText(ANALYSIS_TEXT.slice(0, i))
                i++
                if (i <= ANALYSIS_TEXT.length) {
                  const t = setTimeout(typeChar, 14)
                  timeouts.current.push(t)
                } else {
                  const t3 = setTimeout(() => {
                    setPhase("results")
                    TITLE_EXCEPTIONS.forEach((item, idx) => {
                      const t = setTimeout(() => {
                        setVisibleItems(prev => [...prev, item.id])
                      }, idx * 120)
                      timeouts.current.push(t)
                    })
                  }, 400)
                  timeouts.current.push(t3)
                }
              }
            }
            typeChar()
          }, 300)
          timeouts.current.push(t2)
        }
      }, 60)
    }, 800)
    timeouts.current.push(t1)

    const loopDelay = 800 + 1200 + ANALYSIS_TEXT.length * 14 + 400 + TITLE_EXCEPTIONS.length * 120 + 4000
    const loopT = setTimeout(run, loopDelay)
    timeouts.current.push(loopT)
  }

  useEffect(() => { run(); return clear }, [])

  const BG = "#0f1219"
  const PANEL = "#141820"
  const BORDER = "rgba(237,238,240,0.08)"
  const TEXT = "#EDEEF0"
  const MUTED = "rgba(237,238,240,0.45)"
  const DIM = "rgba(237,238,240,0.2)"
  const BLUE = "#3b82f6"
  const RED = "#ef4444"
  const YELLOW = "#f59e0b"
  const GREEN = "#22c55e"

  const severityColor = (s: string) => s === "high" ? RED : s === "medium" ? YELLOW : GREEN

  return (
    <section style={{ borderTop: `1px solid rgba(237,238,240,0.07)`, padding: "80px 32px", background: BG }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: BLUE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Title Analysis
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, marginBottom: 12 }}>
            Upload a commitment. Get answers in seconds.
          </h2>
          <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 480 }}>
            TitleWise reads the title commitment, surfaces every exception and requirement, and flags what needs action before closing.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          {/* Left — upload + analysis stream */}
          <div style={{ background: PANEL, padding: "28px" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Document Input
            </p>

            {/* Upload area */}
            <div style={{
              border: `1px dashed ${phase === "uploading" ? BLUE : BORDER}`,
              borderRadius: 8, padding: "20px",
              textAlign: "center", marginBottom: 20,
              background: phase === "uploading" ? "rgba(59,130,246,0.05)" : "transparent",
              transition: "all 0.3s",
            }}>
              <p style={{ fontSize: "0.8125rem", color: phase === "uploading" ? BLUE : DIM, marginBottom: phase === "uploading" ? 8 : 0 }}>
                {phase === "idle" ? "title-commitment-18-harbor-view.pdf" : phase === "uploading" ? "Uploading..." : "✓ title-commitment-18-harbor-view.pdf"}
              </p>
              {phase === "uploading" && (
                <div style={{ background: BORDER, borderRadius: 99, height: 3, overflow: "hidden" }}>
                  <div style={{ background: BLUE, height: "100%", width: `${progress}%`, transition: "width 0.06s linear", borderRadius: 99 }} />
                </div>
              )}
            </div>

            {/* Analysis stream */}
            <div style={{
              background: "#0a0d12", borderRadius: 8, padding: "16px",
              minHeight: 240, fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "0.75rem", color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {analysisText}
              {(phase === "analyzing") && (
                <span style={{ display: "inline-block", width: 1.5, height: "0.9em", background: BLUE, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-blink 0.8s step-end infinite" }} />
              )}
            </div>
          </div>

          {/* Right — results */}
          <div style={{ background: "#0a0d12", padding: "28px", borderLeft: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Exceptions & Requirements
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TITLE_EXCEPTIONS.map((item) => (
                <div key={item.id} style={{
                  background: "rgba(237,238,240,0.03)", border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: "10px 12px",
                  opacity: visibleItems.includes(item.id) ? 1 : 0,
                  transform: visibleItems.includes(item.id) ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity 0.3s, transform 0.3s",
                  borderLeft: `3px solid ${severityColor(item.severity)}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: severityColor(item.severity), letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: "0.6rem", color: DIM }}>·</span>
                    <span style={{ fontSize: "0.6rem", color: severityColor(item.severity), textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {item.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: MUTED, lineHeight: 1.5, margin: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </section>
  )
}
