import Link from "next/link"

const MUTED = "rgba(237,238,240,0.45)"
const DIM = "rgba(237,238,240,0.2)"
const RULE = "rgba(237,238,240,0.07)"
const BLUE = "#533afd"

export default function LandingFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${RULE}`, backgroundColor: "#0d253d" }}>
      <style>{`
        @media (max-width: 768px) { .tw-lf-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px !important; } }
        @media (max-width: 480px) { .tw-lf-grid { grid-template-columns: 1fr !important; text-align: center; } .tw-lf-grid ul { list-style: none; padding: 0; display: flex; flex-direction: column; align-items: center; } .tw-lf-brand { justify-content: center !important; } }
      `}</style>
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "56px 32px 0" }}>
        <div className="tw-lf-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 48px" }}>

          {/* Brand */}
          <div style={{ paddingBottom: 40 }}>
            <div className="tw-lf-brand" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "auto" }}>
                <rect x="10" y="0" width="24" height="32" rx="4" fill="rgba(255,255,255,0.35)" />
                <rect x="2" y="8" width="24" height="32" rx="4" fill={BLUE} />
              </svg>
              <span style={{ fontFamily: "inherit", fontSize: "1rem", lineHeight: 1 }}>
                <span style={{ fontWeight: 700, color: "#EDEEF0", letterSpacing: "-0.01em" }}>TITLE</span>
                <span style={{ fontWeight: 300, color: "rgba(237,238,240,0.5)" }}>wise</span>
              </span>
            </div>
            <p style={{ marginTop: 16, fontSize: "0.875rem", fontWeight: 300, color: MUTED, lineHeight: 1.65, maxWidth: 280 }}>
              AI-powered closing platform for real estate attorneys. From intake to clear-to-close.
            </p>
            <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20,
              padding: "5px 10px 5px 8px",
              border: `1px solid rgba(237,238,240,0.10)`,
              borderRadius: 6, textDecoration: "none",
              backgroundColor: "rgba(237,238,240,0.03)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: BLUE, flexShrink: 0 }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 400, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em" }}>A Boxford Partners Company</span>
            </a>
            <p style={{ marginTop: 16 }}>
              <a href="mailto:hello@titlewise.app" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>
                hello@titlewise.app
              </a>
            </p>
          </div>

          {/* Product */}
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Product</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Pricing", "/pricing"], ["Demo", "/demo"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Log in", "/login"]].map(([label, href]) => (
                <li key={label}><Link href={href} style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Company</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>Boxford Partners</a></li>
              <li><a href="https://cal.com/boxfordpartners/titlewise-demo" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>Book a Demo</a></li>
              <li><a href="mailto:hello@titlewise.app" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>Contact</a></li>
              <li><a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>LinkedIn</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div style={{ paddingBottom: 40 }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, marginBottom: 16 }}>Legal</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li><Link href="/privacy" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>Privacy</Link></li>
              <li><Link href="/terms" style={{ fontSize: "0.875rem", fontWeight: 300, color: MUTED, textDecoration: "none" }}>Terms</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 20, paddingBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 300, color: DIM, margin: 0 }}>
            &copy; {new Date().getFullYear()} Boxford Partners LLC. All rights reserved. &nbsp;·&nbsp; 345 California St., Suite 600, San Francisco CA 94104
          </p>
          <a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" aria-label="Boxford Partners on LinkedIn" style={{ color: DIM }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
