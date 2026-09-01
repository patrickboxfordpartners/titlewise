import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Return to TITLEwise to explore AI tools for real estate closing attorneys.",
}

export default function NotFound() {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <svg height="36" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="0" width="24" height="32" rx="4" fill="rgba(255,255,255,0.35)" />
          <rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB" />
        </svg>
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#3b82f6",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        404
      </p>

      <h1
        style={{
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "#EDEEF0",
          marginBottom: 16,
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "rgba(237,238,240,0.55)",
          lineHeight: 1.7,
          maxWidth: 440,
          marginBottom: 40,
        }}
      >
        The page you are looking for does not exist or has been moved.
        Here are some helpful links to get you back on track.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "#3b82f6",
            color: "#fff",
            fontSize: "0.9375rem",
            fontWeight: 600,
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
        <Link
          href="/pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "transparent",
            border: "1px solid rgba(237,238,240,0.07)",
            color: "rgba(237,238,240,0.5)",
            fontSize: "0.9375rem",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          View Pricing
        </Link>
        <Link
          href="/demo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "transparent",
            border: "1px solid rgba(237,238,240,0.07)",
            color: "rgba(237,238,240,0.5)",
            fontSize: "0.9375rem",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Try the Demo
        </Link>
      </div>

      <div style={{ marginTop: 48, display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          ["Blog", "/blog"],
          ["FAQ", "/faq"],
          ["Privacy Policy", "/privacy"],
          ["Terms of Service", "/terms"],
        ].map(([label, href]) => (
          <Link
            key={label}
            href={href}
            style={{
              fontSize: "0.8125rem",
              color: "rgba(237,238,240,0.35)",
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
