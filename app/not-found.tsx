import Link from "next/link"
import type { Metadata } from "next"
import { Logo } from "@/components/logo"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Return to TITLEwise to explore AI tools for real estate closing attorneys.",
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--background)",
        fontFamily: "Inter, 'SF Pro Display', system-ui, -apple-system, sans-serif",
        fontFeatureSettings: '"ss01"',
      }}
    >
      <div style={{ marginBottom: 48 }}>
        <Logo size="default" />
      </div>

      <p
        style={{
          fontSize: "10px",
          fontWeight: 400,
          letterSpacing: "0.1px",
          textTransform: "uppercase",
          color: "var(--primary)",
          marginBottom: 16,
        }}
      >
        404
      </p>

      <h1
        style={{
          fontSize: "32px",
          fontWeight: 300,
          lineHeight: 1.1,
          letterSpacing: "-0.64px",
          color: "var(--foreground)",
          marginBottom: 12,
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: "15px",
          fontWeight: 300,
          lineHeight: 1.4,
          color: "var(--text-muted)",
          maxWidth: 400,
          marginBottom: 40,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/matters"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: "9999px",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "16px",
            fontWeight: 400,
            textDecoration: "none",
          }}
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: "9999px",
            backgroundColor: "transparent",
            color: "var(--foreground)",
            fontSize: "16px",
            fontWeight: 400,
            textDecoration: "none",
            border: "1px solid var(--border)",
          }}
        >
          Home
        </Link>
      </div>
    </div>
  )
}
