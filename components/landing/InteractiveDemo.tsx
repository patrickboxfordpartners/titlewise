"use client"

import { useState } from "react"

const PRIMARY = "#0066cc"
const INK = "#0d253d"
const MUTED = "#64748d"
const HAIRLINE = "#e3e8ee"

const TABS = [
  {
    key: "title",
    label: "Title Analysis",
    badge: "0.8s",
    badgeColor: "#22c55e",
    content: (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
          <span style={{ fontSize: "13px", fontWeight: 400, color: INK, letterSpacing: "-0.39px" }}>
            Analysis Complete
          </span>
          <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 300, color: MUTED }}>
            0.8s
          </span>
        </div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: MUTED,
            textTransform: "uppercase",
            letterSpacing: "0.1px",
            marginBottom: 12,
          }}
        >
          Schedule B Exceptions
        </p>
        {[
          { severity: "high", text: "Mortgage lien, First National Bank, $342,000" },
          { severity: "medium", text: "Easement, Duke Energy utility access, 15ft" },
          { severity: "low", text: "CC&Rs, Oakwood HOA, recorded 2019" },
          { severity: "low", text: "Property tax lien, Mecklenburg Co., current" },
        ].map((ex, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < 3 ? `1px solid ${HAIRLINE}` : "none",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                marginTop: 6,
                flexShrink: 0,
                backgroundColor:
                  ex.severity === "high" ? "#ea2261" : ex.severity === "medium" ? "#f59e0b" : "#22c55e",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 300,
                color: INK,
                lineHeight: 1.4,
                letterSpacing: "-0.42px",
                fontFeatureSettings: '"tnum", "ss01"',
              }}
            >
              {ex.text}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          {["4 Exceptions", "2 Requirements", "1 Red Flag"].map((tag, i) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                backgroundColor: i === 2 ? "#fde2ec" : "#e3f2fd",
                color: i === 2 ? "#ea2261" : PRIMARY,
                fontSize: "10px",
                fontWeight: 400,
                padding: "4px 8px",
                borderRadius: 9999,
                textTransform: "uppercase",
                letterSpacing: "0.1px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </>
    ),
  },
  {
    key: "wire",
    label: "Wire Verification",
    badge: "Alert",
    badgeColor: "#ea2261",
    content: (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ea2261" }} />
          <span style={{ fontSize: "13px", fontWeight: 400, color: "#ea2261", letterSpacing: "-0.39px" }}>
            Wire Alert
          </span>
        </div>
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: 400, color: "#991b1b", marginBottom: 8, letterSpacing: "-0.42px" }}>
            Routing number mismatch detected
          </p>
          <p style={{ fontSize: "13px", fontWeight: 300, color: "#b91c1c", lineHeight: 1.5, letterSpacing: "-0.39px" }}>
            This routing number (021000089) does not match the verified routing number for First National Title across 23 prior closings.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <span style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}>
            Prior verified wires
          </span>
          <span style={{ fontSize: "14px", fontWeight: 300, color: INK, fontFeatureSettings: '"tnum", "ss01"', letterSpacing: "-0.42px" }}>
            23
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${HAIRLINE}` }}>
          <span style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}>
            Confidence score
          </span>
          <span style={{ fontSize: "14px", fontWeight: 400, color: "#ea2261", fontFeatureSettings: '"tnum", "ss01"', letterSpacing: "-0.42px" }}>
            12% match
          </span>
        </div>
      </>
    ),
  },
  {
    key: "cd",
    label: "CD Review",
    badge: "2 Issues",
    badgeColor: "#f59e0b",
    content: (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
          <span style={{ fontSize: "13px", fontWeight: 400, color: INK, letterSpacing: "-0.39px" }}>
            TRID Compliance Check
          </span>
          <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 300, color: MUTED }}>
            1.2s
          </span>
        </div>
        {[
          { status: "fail", label: "Bucket A tolerance", detail: "Origination charge exceeds LE by $127 (0% tolerance)" },
          { status: "warn", label: "Bucket B tolerance", detail: "Title insurance $48 over LE. Within 10% but approaching limit." },
          { status: "pass", label: "Bucket C fees", detail: "All Bucket C items within expected ranges" },
          { status: "pass", label: "Closing date accuracy", detail: "Settlement date matches loan documents" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < 3 ? `1px solid ${HAIRLINE}` : "none",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                marginTop: 6,
                flexShrink: 0,
                backgroundColor: item.status === "fail" ? "#ea2261" : item.status === "warn" ? "#f59e0b" : "#22c55e",
              }}
            />
            <div>
              <span style={{ fontSize: "13px", fontWeight: 400, color: INK, letterSpacing: "-0.39px", display: "block", marginBottom: 2 }}>
                {item.label}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 300, color: MUTED, lineHeight: 1.4, letterSpacing: "-0.36px" }}>
                {item.detail}
              </span>
            </div>
          </div>
        ))}
      </>
    ),
  },
  {
    key: "status",
    label: "Status Update",
    badge: "Draft",
    badgeColor: PRIMARY,
    content: (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: PRIMARY }} />
          <span style={{ fontSize: "13px", fontWeight: 400, color: INK, letterSpacing: "-0.39px" }}>
            AI-Generated Draft
          </span>
          <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 300, color: MUTED }}>
            Ready to send
          </span>
        </div>
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 400, color: MUTED, marginBottom: 8 }}>
            To: sarah.chen@email.com
          </p>
          <p style={{ fontSize: "13px", fontWeight: 400, color: INK, marginBottom: 12, letterSpacing: "-0.39px" }}>
            Re: 742 Elm Street Closing Update
          </p>
          <p style={{ fontSize: "13px", fontWeight: 300, color: INK, lineHeight: 1.6, letterSpacing: "-0.39px" }}>
            Hi Sarah, here is a quick update on your closing. Title commitment review is complete with no issues. We are waiting on the lender for final CD approval, expected by Thursday. All other items on our checklist are cleared. We will send wire instructions once the CD is approved.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#e3f2fd",
                color: PRIMARY,
                fontSize: "10px",
                fontWeight: 400,
                padding: "4px 8px",
                borderRadius: 9999,
                textTransform: "uppercase",
                letterSpacing: "0.1px",
              }}
            >
              5 of 8 items complete
            </span>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#e3f2fd",
                color: PRIMARY,
                fontSize: "10px",
                fontWeight: 400,
                padding: "4px 8px",
                borderRadius: 9999,
                textTransform: "uppercase",
                letterSpacing: "0.1px",
              }}
            >
              Closing: Sept 12
            </span>
          </div>
        </div>
      </>
    ),
  },
]

export default function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState("title")

  const active = TABS.find((t) => t.key === activeTab) || TABS[0]

  return (
    <section
      style={{
        padding: "96px 32px",
        borderTop: `1px solid ${HAIRLINE}`,
        backgroundColor: "#fff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 400,
              color: PRIMARY,
              letterSpacing: "0.1px",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            See It In Action
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "-0.64px",
              color: INK,
              marginBottom: 12,
            }}
          >
            Every tool, one click away.
          </h2>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 300,
              color: MUTED,
              maxWidth: 520,
            }}
          >
            Upload a document, verify a wire, or generate a status update. Each tool returns structured, actionable output in seconds.
          </p>
        </div>

        <div
          className="tw-demo-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    backgroundColor: activeTab === tab.key ? "#f8fafc" : "transparent",
                    border: "none",
                    borderLeft: `2px solid ${activeTab === tab.key ? PRIMARY : "transparent"}`,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: activeTab === tab.key ? 400 : 300,
                      color: activeTab === tab.key ? INK : MUTED,
                      letterSpacing: "-0.45px",
                    }}
                  >
                    {tab.label}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 400,
                      color: tab.badgeColor,
                      backgroundColor:
                        tab.badgeColor === "#ea2261"
                          ? "#fde2ec"
                          : tab.badgeColor === "#f59e0b"
                            ? "#fef3c7"
                            : "#e3f2fd",
                      padding: "3px 8px",
                      borderRadius: 9999,
                      textTransform: "uppercase",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              {[
                "Title analysis, CD review, wire verification",
                "HOA review, fee estimates, tax proration",
                "Status updates, client portal, team invites",
                "Closing checklists, email integration",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: PRIMARY,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 300, color: MUTED, letterSpacing: "-0.39px" }}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: "rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px",
              minHeight: 380,
            }}
          >
            {active.content}
          </div>
        </div>
      </div>
    </section>
  )
}
