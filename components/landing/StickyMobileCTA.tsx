"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="sticky-mobile-cta"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        padding: "12px 16px",
        backgroundColor: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid #e3e8ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <style>{`
        @media (min-width: 769px) {
          .sticky-mobile-cta { display: none !important; }
        }
      `}</style>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 400, color: "#0d253d", margin: 0 }}>
          Plans from $149/mo
        </p>
        <p style={{ fontSize: "0.6875rem", fontWeight: 300, color: "#64748d", margin: 0 }}>
          All 12 tools included
        </p>
      </div>
      <Link
        href="/pricing"
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#0066cc",
          color: "#fff",
          fontSize: "0.8125rem",
          fontWeight: 400,
          padding: "10px 20px",
          borderRadius: 9999,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Get started
      </Link>
    </div>
  )
}
