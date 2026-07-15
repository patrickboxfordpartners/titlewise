"use client"

import { useState } from "react"
import { faqs } from "@/components/landing/FAQSection"

const BLUE = "#3b82f6"
const BODY_TEXT = "#1a1a2e"

export default function BlogFAQ() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section style={{
      backgroundColor: "#ffffff",
      borderTop: "1px solid #e5e7eb",
      borderBottom: "1px solid #e5e7eb",
      padding: "56px 32px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          color: BODY_TEXT,
          marginBottom: 32,
          marginTop: 0,
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {faqs.map((faq) => {
            const isOpen = open === faq.value
            return (
              <div
                key={faq.value}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : faq.value)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  aria-expanded={isOpen}
                >
                  <span style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: BODY_TEXT,
                    lineHeight: 1.5,
                  }}>
                    {faq.question}
                  </span>
                  <span style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: `2px solid ${BLUE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: BLUE,
                    fontSize: "1rem",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div style={{
                    paddingBottom: 16,
                    fontSize: "0.9375rem",
                    lineHeight: 1.75,
                    color: "#4a4a5a",
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
