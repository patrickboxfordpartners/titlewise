"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (roughly 400px)
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
        backgroundColor: "rgba(17,24,39,0.97)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(237,238,240,0.07)",
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
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#EDEEF0", margin: 0 }}>
          Start free trial
        </p>
        <p style={{ fontSize: "0.6875rem", color: "rgba(237,238,240,0.45)", margin: 0 }}>
          No credit card required
        </p>
      </div>
      <Link
        href="/pricing"
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#3b82f6",
          color: "#fff",
          fontSize: "0.8125rem",
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: 8,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Get Started
      </Link>
    </div>
  )
}
