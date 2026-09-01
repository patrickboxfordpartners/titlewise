"use client"

import { useEffect, useState, useRef } from "react"

const CURRENT = {
  bank: "First National Bank",
  account: "****4821",
  routing: "021000021",
  amount: "$487,250.00",
  memo: "18 Harbor View Drive closing proceeds",
}

const CHECKS = [
  { id: 1, label: "Account number matches prior closing", status: "pass", detail: "Matches #4821 from 2024-11-03 closing" },
  { id: 2, label: "Routing number verified", status: "pass", detail: "021000021 — JPMorgan Chase, confirmed" },
  { id: 3, label: "Beneficiary name cross-reference", status: "pass", detail: "First National Bank — consistent across 3 prior files" },
  { id: 4, label: "Wire amount within expected range", status: "pass", detail: "$487,250 — within 2% of estimated payoff" },
  { id: 5, label: "Last-minute change detection", status: "warn", detail: "Instructions received 18 hrs before closing — flag for verbal confirmation" },
  { id: 6, label: "Email domain spoofing check", status: "pass", detail: "Sender domain fnb.com verified — no lookalike detected" },
]

export default function WireVerificationDemo() {
  const [visibleChecks, setVisibleChecks] = useState<number[]>([])
  const [verdict, setVerdict] = useState<"" | "reviewing" | "done">("")
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  function clear() { timeouts.current.forEach(clearTimeout); timeouts.current = [] }

  function run() {
    clear()
    setVisibleChecks([])
    setVerdict("")

    const t1 = setTimeout(() => {
      setVerdict("reviewing")
      CHECKS.forEach((check, idx) => {
        const t = setTimeout(() => {
          setVisibleChecks(prev => [...prev, check.id])
        }, idx * 350)
        timeouts.current.push(t)
      })
      const doneT = setTimeout(() => setVerdict("done"), CHECKS.length * 350 + 400)
      timeouts.current.push(doneT)
    }, 600)
    timeouts.current.push(t1)

    const loopDelay = 600 + CHECKS.length * 350 + 400 + 4000
    const loopT = setTimeout(run, loopDelay)
    timeouts.current.push(loopT)
  }

  useEffect(() => {
    if (window.innerWidth < 640) {
      setVisibleChecks(CHECKS.map(c => c.id))
      setVerdict("done")
      return
    }
    run()
    return clear
  }, [])

  const BG = "#0f1219"
  const PANEL = "#141820"
  const BORDER = "rgba(237,238,240,0.08)"
  const TEXT = "#EDEEF0"
  const MUTED = "rgba(237,238,240,0.45)"
  const DIM = "rgba(237,238,240,0.2)"
  const BLUE = "#3b82f6"
  const GREEN = "#22c55e"
  const YELLOW = "#f59e0b"

  return (
    <section style={{ borderTop: `1px solid rgba(237,238,240,0.07)`, padding: "80px 32px", background: BG }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: BLUE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Wire Fraud Protection
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, marginBottom: 12 }}>
            Every wire verified before it moves.
          </h2>
          <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 480 }}>
            TITLEwise cross-checks wire instructions against prior closings, flags last-minute changes, and catches spoofed emails before funds leave the account.
          </p>
        </div>

        <div className="tw-demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          {/* Left — wire details */}
          <div className="tw-demo-left" style={{ background: PANEL, padding: "28px" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Wire Instructions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries({ "Bank": CURRENT.bank, "Account": CURRENT.account, "Routing": CURRENT.routing, "Amount": CURRENT.amount, "Memo": CURRENT.memo }).map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize: "0.6875rem", color: DIM, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: "0.875rem", color: TEXT, fontFamily: label === "Account" || label === "Routing" ? "'SF Mono', monospace" : "inherit" }}>{val}</p>
                </div>
              ))}
            </div>

            {verdict && (
              <div style={{
                marginTop: 28, padding: "12px 16px", borderRadius: 8,
                background: verdict === "done" ? "rgba(34,197,94,0.08)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${verdict === "done" ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.2)"}`,
                display: "flex", alignItems: "center", gap: 10,
                transition: "all 0.3s",
              }}>
                {verdict === "reviewing" ? (
                  <>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: BLUE, animation: "tw-pulse 1s ease-in-out infinite" }} />
                    <span style={{ fontSize: "0.8125rem", color: BLUE, fontWeight: 600 }}>Verifying wire instructions...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "0.875rem" }}>✓</span>
                    <span style={{ fontSize: "0.8125rem", color: GREEN, fontWeight: 600 }}>Verified — proceed with caution flag on #5</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right — checks */}
          <div style={{ background: "#0a0d12", padding: "28px", borderLeft: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Verification Checks
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CHECKS.map((check) => {
                const visible = visibleChecks.includes(check.id)
                return (
                  <div key={check.id} style={{
                    background: "rgba(237,238,240,0.03)", border: `1px solid ${BORDER}`,
                    borderRadius: 8, padding: "10px 12px",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(6px)",
                    transition: "opacity 0.25s, transform 0.25s",
                    borderLeft: `3px solid ${check.status === "pass" ? GREEN : YELLOW}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: "0.8125rem", color: TEXT, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>{check.label}</p>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: check.status === "pass" ? GREEN : YELLOW, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
                        {check.status === "pass" ? "Pass" : "Flag"}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: DIM, margin: "4px 0 0", lineHeight: 1.4 }}>{check.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes tw-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@media (max-width: 640px) {
  .tw-demo-grid { grid-template-columns: 1fr !important; }
  .tw-demo-left { display: none !important; }
}`}</style>
    </section>
  )
}
