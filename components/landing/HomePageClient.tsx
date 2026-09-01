"use client"

import { useState } from "react"
import Link from "next/link"
import FAQSection from "@/components/landing/FAQSection"
import StickyMobileCTA from "@/components/landing/StickyMobileCTA"
import ThemeToggle from "@/components/ThemeToggle"
import HomepageDemo from "@/components/landing/HomepageDemo"
import { useThemeColors } from "@/lib/useThemeColors"

export default function HomePageClient() {
  const c = useThemeColors()
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)

  return (
    <div
      style={{
        backgroundColor: c.bg,
        minHeight: "100vh",
        color: c.ink,
        fontWeight: 300,
        fontFeatureSettings: '"ss01"',
        WebkitFontSmoothing: "antialiased",
      }}
    >

      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: c.navBg,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${c.hairline}`,
          width: "100%",
        }}
      >
        <div
          className="tw-nav-inner"
          style={{
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            height="28"
            viewBox="0 0 36 43"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "auto" }}
          >
            <rect x="10" y="0" width="24" height="32" rx="4" fill={c.isDark ? "rgba(255,255,255,0.25)" : "#93c5fd"} />
            <rect x="2" y="8" width="24" height="32" rx="4" fill={c.primary} />
          </svg>
          <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, color: c.ink, letterSpacing: "-0.01em" }}>TITLE</span>
            <span style={{ fontWeight: 300, color: c.muted }}>wise</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/pricing" className="tw-nav-link" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Pricing</Link>
          <Link href="/blog" className="tw-nav-link" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Blog</Link>
          <Link href="/demo" className="tw-nav-link" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Demo</Link>
          <Link href="/analyze" className="tw-nav-link" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Analyze</Link>
          <Link href="/login" className="tw-nav-link" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Log in</Link>
          <ThemeToggle />
          <Link
            href="/signup"
            style={{
              fontSize: "0.9375rem",
              fontWeight: 400,
              color: "#fff",
              backgroundColor: c.primary,
              borderRadius: 9999,
              padding: "8px 20px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Get started
          </Link>
        </div>
        </div>
      </nav>
      <style>{`
        @keyframes tw-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) { .tw-nav-link { display: none !important; } }

        /* Tablet */
        @media (max-width: 768px) {
          .tw-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .tw-features-grid { grid-template-columns: 1fr 1fr !important; }
          .tw-pricing-grid { grid-template-columns: 1fr 1fr !important; }
          .tw-how-grid { grid-template-columns: 1fr !important; }
          .tw-footer-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px !important; }
          .tw-hero-wrapper { padding: 100px 24px 80px !important; }
          .tw-hero-inner { max-width: 600px !important; }
          .tw-section-pad { padding-left: 24px !important; padding-right: 24px !important; }
          .tw-section-lg { padding-top: 72px !important; padding-bottom: 72px !important; }
          .tw-nav-inner { padding-left: 20px !important; padding-right: 20px !important; }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .tw-stats-grid { grid-template-columns: 1fr !important; }
          .tw-features-grid { grid-template-columns: 1fr !important; }
          .tw-pricing-grid { grid-template-columns: 1fr !important; }
          .tw-footer-grid { grid-template-columns: 1fr !important; text-align: center; }
          .tw-hero-wrapper { padding: 80px 20px 64px !important; }
          .tw-hero-inner { max-width: 100% !important; }
          .tw-hero-sub { font-size: 0.9375rem !important; max-width: 100% !important; }
          .tw-hero-buttons { flex-direction: column !important; align-items: center !important; }
          .tw-hero-buttons a { width: 100% !important; justify-content: center !important; }
          .tw-section-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .tw-section-lg { padding-top: 56px !important; padding-bottom: 56px !important; }
          .tw-nav-inner { padding-left: 16px !important; padding-right: 16px !important; }
          .tw-footer-bottom { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
          <video autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", opacity: c.isDark ? 0.04 : 0.09 }}>
            <source src="https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, overflow: "hidden" }}>
          {c.isDark ? (
            <div style={{ position: "absolute", top: "-10%", left: "-5%", right: "-5%", height: "70%", background: "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 55% 35%, rgba(59,130,246,0.08) 0%, transparent 50%)", filter: "blur(60px)", opacity: 0.6 }} />
          ) : (
            <div style={{ position: "absolute", top: "-10%", left: "-5%", right: "-5%", height: "70%", background: "radial-gradient(ellipse 80% 50% at 20% 40%, #bfdbfe 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 40% 30%, #60a5fa 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 55% 35%, #93c5fd 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 70% 30%, #0066cc 0%, transparent 50%), radial-gradient(ellipse 40% 40% at 85% 40%, #1e40af 0%, transparent 50%)", filter: "blur(60px)", opacity: 0.25 }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: c.isDark ? `linear-gradient(to bottom, rgba(15,18,25,0) 0%, rgba(15,18,25,0.6) 50%, ${c.bg} 100%)` : "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,1) 100%)" }} />
        </div>
        <div className="tw-hero-wrapper" style={{ maxWidth: 1200, margin: "0 auto", padding: "140px 32px 112px", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="tw-hero-inner" style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ fontSize: "10px", fontWeight: 400, color: c.primary, letterSpacing: "0.1px", textTransform: "uppercase", marginBottom: 24 }}>AI Closing Platform</p>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", fontWeight: 300, letterSpacing: "-1.4px", lineHeight: 1.05, color: c.ink, marginBottom: 24 }}>
              The average closing takes 47 days.<br /><span style={{ color: c.primary }}>Yours doesn't have to.</span>
            </h1>
            <p className="tw-hero-sub" style={{ fontSize: "1.0625rem", fontWeight: 300, color: c.muted, lineHeight: 1.6, maxWidth: 640, margin: "0 auto 40px" }}>
              AI closing coordinator for real estate attorneys. Title analysis in 30 seconds. TRID compliance checks automatic. Wire fraud caught before it happens.
            </p>
            <div className="tw-hero-buttons" style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
              <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", backgroundColor: c.primary, color: "#fff", fontSize: "1rem", fontWeight: 400, padding: "10px 24px", borderRadius: 9999, textDecoration: "none" }}>See pricing</Link>
              <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", backgroundColor: c.isDark ? "transparent" : "#fff", border: `1px solid ${c.hairline}`, color: c.ink, fontSize: "1rem", fontWeight: 400, padding: "10px 24px", borderRadius: 9999, textDecoration: "none" }}>Try the demo</Link>
            </div>
            <p style={{ fontSize: "13px", fontWeight: 400, color: c.muted, marginTop: 16, letterSpacing: "-0.39px" }}>Plans from $149/mo &middot; No setup fees &middot; Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="tw-section-pad tw-section-lg" style={{ borderTop: `1px solid ${c.hairline}`, padding: "72px 32px", backgroundColor: c.bg }}>
        <div className="tw-stats-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "48px 40px" }}>
          {[
            { stat: "$1.2B", label: "Lost to wire fraud in 2023", body: "The FBI reported $1.2 billion in real estate wire fraud losses. TITLEwise cross-references every wire instruction against institutional memory across all your closings.", source: "FBI Internet Crime Complaint Center, 2023 Annual Report" },
            { stat: "93%", label: "Faster title commitment review", body: "What takes 45 minutes by hand takes 30 seconds with TITLEwise. Exceptions flagged, requirements listed, red flags surfaced, structured and ready to act on.", source: "Based on average manual review time of 45 min vs. 30 sec AI analysis" },
            { stat: "$4,100", label: "Average TRID violation penalty", body: "Tolerance violations and fee misclassifications add up fast. TITLEwise automatically checks Bucket A/B/C classifications and cure amount calculations.", source: "CFPB enforcement actions, average per-loan TRID penalty" },
            { stat: "12", label: "AI tools in one platform", body: "Title analysis, CD review, wire verification, HOA review, fee estimates, tax proration, status updates, and more. Everything closing attorneys need.", source: "Title analysis, CD review, wire verification, HOA review, fee estimate, tax proration, status update, client portal, team invites, email integration, closing checklist, autonomous agent" },
          ].map((item, idx) => (
            <div
              key={item.stat}
              style={{ position: "relative", cursor: "default" }}
              onMouseEnter={() => setHoveredStat(idx)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <p style={{ fontSize: "2.5rem", fontWeight: 300, color: c.ink, letterSpacing: "-1.4px", lineHeight: 1, marginBottom: 8, fontFeatureSettings: '"tnum", "ss01"' }}>{item.stat}</p>
              <p style={{ fontSize: "13px", fontWeight: 400, color: c.primary, marginBottom: 12, letterSpacing: "-0.39px" }}>{item.label}</p>
              <p style={{ fontSize: "15px", fontWeight: 300, color: c.muted, lineHeight: 1.55 }}>{item.body}</p>
              {hoveredStat === idx && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: c.isDark ? "rgba(59,130,246,0.08)" : "#eff6ff", border: `1px solid ${c.isDark ? "rgba(59,130,246,0.2)" : "#bfdbfe"}`, animation: "tw-fade-in 0.15s ease" }}>
                  <p style={{ fontSize: "11px", fontWeight: 400, color: c.primary, margin: 0, lineHeight: 1.5 }}>{item.source}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="tw-section-pad tw-section-lg" style={{ backgroundColor: c.canvasSoft, padding: "96px 32px", borderTop: `1px solid ${c.hairline}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.64px", color: c.ink, marginBottom: 64 }}>Open a matter. Close the deal.</h2>
          <div className="tw-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "48px 56px" }}>
            {[
              { n: "01", title: "Create the matter", body: "Client name, property address, transaction type. TITLEwise generates a state-specific closing checklist and sets up the workspace in seconds.", detail: "Checklists are tailored to your state's requirements. NH, MA, CA, TX, FL, and 45 more. Each transaction type gets its own workflow." },
              { n: "02", title: "Let AI handle the analysis", body: "Upload title commitments, closing disclosures, HOA docs, or wire instructions. TITLEwise reads them, flags issues, and drafts status updates, ready to review.", detail: "AI reads the full document, not just keywords. It understands exception schedules, requirement sections, fee tables, and HOA transfer provisions." },
              { n: "03", title: "Close with confidence", body: "Wire verification cross-checks every instruction against prior closings. Compliance runs automatically. Your checklist tracks every step to clear-to-close.", detail: "Every wire instruction is compared against your historical closing data. Changed account numbers, new routing numbers, and last-minute changes are flagged instantly." },
            ].map((item) => (
              <div
                key={item.n}
                style={{ cursor: "default", transition: "transform 0.15s" }}
                onMouseEnter={() => setHoveredStep(item.n)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <p style={{ fontSize: "11px", fontWeight: 300, color: c.muted, marginBottom: 16 }}>{item.n}</p>
                <h3 style={{ fontSize: "20px", fontWeight: 300, color: c.ink, marginBottom: 12, lineHeight: 1.4, letterSpacing: "-0.2px" }}>{item.title}</h3>
                <p style={{ fontSize: "15px", fontWeight: 300, color: c.muted, lineHeight: 1.55 }}>{item.body}</p>
                <div style={{ maxHeight: hoveredStep === item.n ? 80 : 0, overflow: "hidden", transition: "max-height 0.25s ease, opacity 0.2s ease", opacity: hoveredStep === item.n ? 1 : 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: c.primary, lineHeight: 1.55, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${c.isDark ? "rgba(59,130,246,0.15)" : "#bfdbfe"}` }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live 3-column demo */}
      <HomepageDemo />

      {/* Features list */}
      <section className="tw-section-pad tw-section-lg" style={{ borderTop: `1px solid ${c.hairline}`, backgroundColor: c.canvasSoft, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.64px", color: c.ink, marginBottom: 16 }}>Everything built in.</h2>
          <p style={{ fontSize: "15px", fontWeight: 300, color: c.muted, marginBottom: 56, maxWidth: 480 }}>12 AI tools and an autonomous closing agent. Every plan includes every tool.</p>
          <div className="tw-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 48px" }}>
            {[
              ["Title Commitment Analysis", "Exceptions, requirements, and red flags in 30 seconds", "Upload a PDF or paste text. AI identifies Schedule B exceptions, flags actionable requirements, and highlights risks like open liens or unreleased mortgages."],
              ["Closing Disclosure Reviewer", "TRID compliance against federal tolerances, automatic", "Checks Bucket A/B/C fee classifications, calculates tolerance thresholds, and flags cure amounts before they become violations."],
              ["Wire Fraud Prevention", "Cross-matter verification catches fraudulent instructions", "Compares wire instructions against your historical closings. Flags changed account numbers, new routing numbers, domain spoofing, and last-minute changes."],
              ["HOA Document Review", "Fees, restrictions, and pending assessments surfaced instantly", "Reads HOA resale certificates, CC&Rs, and estoppel letters. Surfaces transfer fees, special assessments, rental restrictions, and pending litigation."],
              ["Status Update Generator", "AI drafts client updates from checklist state, one click to send", "Reads your matter's current state and drafts a professional status email with next steps. Review, edit, and send directly from TITLEwise."],
              ["Fee Estimate Tool", "County-specific closing cost breakdowns for any transaction type", "Generates buyer and seller fee estimates using county-specific recording fees, transfer taxes, and title insurance rates."],
              ["Tax Proration Calculator", "Per-diem buyer/seller calculations with settlement formatting", "Enter assessed value and tax dates. Get per-diem proration with buyer/seller credits formatted for the settlement statement."],
              ["Client Portal", "Shareable read-only checklist view for your clients", "Generate a secure link your clients can use to track closing progress. No login required. Updates in real time as you check items off."],
              ["Team Invites", "Role-based access for colleagues across matters", "Invite paralegals and associates with role-based permissions. Everyone sees the matters they need, nothing they don't."],
              ["Email Integration", "Postmark, Gmail, or custom SMTP, sends from your inbox", "Connect your email and send status updates, closing instructions, and follow-ups directly from TITLEwise. Logged to the matter automatically."],
              ["Closing Checklist", "State-specific checklists auto-generated per transaction", "Each new matter gets a checklist tailored to your state and transaction type. Purchase, sale, refinance, and cash purchase workflows built in."],
              ["Autonomous Closing Agent", "AI that monitors matters, updates checklists, surfaces blockers", "Neil monitors your matters continuously. Reads incoming emails, checks off completed items, flags overdue tasks, and drafts communications."],
            ].map(([title, sub, detail]) => (
              <div
                key={title}
                style={{ paddingTop: 20, paddingBottom: 20, borderTop: `1px solid ${c.hairline}`, cursor: "default" }}
                onMouseEnter={() => setHoveredFeature(title)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <p style={{ fontSize: "15px", fontWeight: 400, color: c.ink, marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: "13px", fontWeight: 300, color: c.muted, letterSpacing: "-0.39px" }}>{sub}</p>
                <div style={{ maxHeight: hoveredFeature === title ? 100 : 0, overflow: "hidden", transition: "max-height 0.25s ease, opacity 0.2s ease", opacity: hoveredFeature === title ? 1 : 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: c.isDark ? "rgba(237,238,240,0.6)" : "#475569", lineHeight: 1.55, marginTop: 8 }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof band */}
      <section className="tw-section-pad tw-section-lg" style={{ backgroundColor: c.sectionDark, padding: "96px 32px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 300, letterSpacing: "-0.96px", color: c.sectionDarkText, marginBottom: 20, lineHeight: 1.15 }}>Built for the attorneys who actually close.</h2>
          <p style={{ fontSize: "1.0625rem", fontWeight: 300, color: c.sectionDarkMuted, lineHeight: 1.6, marginBottom: 40 }}>Not a general legal tool. Not a CRM. TITLEwise is purpose-built for real estate closing attorneys. The only platform designed around the closing workflow from intake to clear-to-close.</p>
          <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", backgroundColor: c.primary, color: "#fff", fontSize: "1rem", fontWeight: 400, padding: "10px 24px", borderRadius: 9999, textDecoration: "none" }}>See pricing</Link>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="tw-section-pad tw-section-lg" style={{ borderTop: `1px solid ${c.hairline}`, padding: "96px 32px", backgroundColor: c.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.64px", color: c.ink, marginBottom: 12 }}>Simple pricing. No surprises.</h2>
            <p style={{ fontSize: "15px", fontWeight: 300, color: c.muted, maxWidth: 480 }}>One flat monthly rate. All 12 tools included. No per-file fees, no feature gating.</p>
          </div>
          <div className="tw-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { name: "Solo", price: "$149", note: "1 attorney &middot; 100 AI generations/mo", features: ["1 user seat", "100 AI generations/mo", "All 12 tools included", "Unlimited matters", "Email support"] },
              { name: "Small Firm", price: "$349", note: "Up to 5 seats &middot; Client portal", featured: true, features: ["Up to 5 user seats", "500 AI generations/mo", "Client portal access", "Team collaboration", "Priority email support"] },
              { name: "Pro", price: "$599", note: "Up to 10 seats &middot; Priority support", features: ["Up to 10 user seats", "1,000 AI generations/mo", "Client portal access", "API access", "Priority support with SLA"] },
              { name: "Enterprise", price: "$999", note: "25 seats &middot; Custom onboarding", features: ["Up to 25 user seats", "Unlimited AI generations", "Custom onboarding", "Dedicated account manager", "SSO and audit logs"] },
            ].map((plan) => {
              const isExpanded = expandedPlan === plan.name
              const fg = plan.featured ? c.sectionDarkText : c.ink
              const mutedFg = plan.featured ? "rgba(255,255,255,0.5)" : c.muted
              return (
                <div
                  key={plan.name}
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.name)}
                  style={{ backgroundColor: plan.featured ? c.sectionDark : c.cardBg, border: `1px solid ${plan.featured ? c.sectionDark : c.cardBorder}`, borderRadius: 12, padding: "28px 24px", cursor: "pointer", transition: "box-shadow 0.2s, transform 0.15s", transform: isExpanded ? "translateY(-2px)" : "none", boxShadow: isExpanded ? (c.isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(0,55,112,0.12)") : "none" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontSize: "13px", fontWeight: 400, color: mutedFg, marginBottom: 10, letterSpacing: "-0.39px" }}>{plan.name}</p>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.4, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginTop: 2 }}>
                      <path d="M2 4l4 4 4-4" stroke={fg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontSize: "2rem", fontWeight: 300, color: fg, letterSpacing: "-0.96px", lineHeight: 1, marginBottom: 12, fontFeatureSettings: '"tnum", "ss01"' }}>
                    {plan.price}<span style={{ fontSize: "0.875rem", fontWeight: 300, color: mutedFg }}>/mo</span>
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: mutedFg, lineHeight: 1.5, letterSpacing: "-0.39px" }} dangerouslySetInnerHTML={{ __html: plan.note }} />
                  <div style={{ maxHeight: isExpanded ? 200 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: 16, borderTop: `1px solid ${plan.featured ? "rgba(255,255,255,0.1)" : c.hairline}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span style={{ fontSize: "13px", fontWeight: 300, color: plan.featured ? "rgba(255,255,255,0.7)" : c.muted }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing" onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 16, fontSize: "13px", fontWeight: 400, color: c.primary, textDecoration: "none" }}>
                      Full details &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="tw-section-pad tw-section-lg" style={{ borderTop: `1px solid ${c.hairline}`, padding: "96px 32px", backgroundColor: c.canvasSoft }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 300, letterSpacing: "-0.96px", color: c.ink, marginBottom: 16, lineHeight: 1.15 }}>Start closing smarter.</h2>
          <p style={{ fontSize: "15px", fontWeight: 300, color: c.muted, marginBottom: 36, lineHeight: 1.55 }}>Every tool included from day one. Set up in under five minutes.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", backgroundColor: c.primary, color: "#fff", fontSize: "1rem", fontWeight: 400, padding: "10px 28px", borderRadius: 9999, textDecoration: "none" }}>See pricing</Link>
            <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", backgroundColor: c.isDark ? "transparent" : "#fff", border: `1px solid ${c.hairline}`, color: c.ink, fontSize: "1rem", fontWeight: 400, padding: "10px 28px", borderRadius: 9999, textDecoration: "none" }}>Try the demo</Link>
          </div>
        </div>
      </section>

      <FAQSection />
      <StickyMobileCTA />

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${c.hairline}`, backgroundColor: c.bg }}>
        <div className="tw-section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 32px 0" }}>
          <div className="tw-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 48px" }}>
            <div style={{ paddingBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "auto" }}>
                  <rect x="10" y="0" width="24" height="32" rx="4" fill={c.isDark ? "rgba(255,255,255,0.25)" : "#93c5fd"} />
                  <rect x="2" y="8" width="24" height="32" rx="4" fill={c.primary} />
                </svg>
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                  <span style={{ fontWeight: 700, color: c.ink, letterSpacing: "-0.01em" }}>TITLE</span>
                  <span style={{ fontWeight: 300, color: c.muted }}>wise</span>
                </span>
              </div>
              <p style={{ marginTop: 16, fontSize: "13px", fontWeight: 300, color: c.muted, lineHeight: 1.65, maxWidth: 280, letterSpacing: "-0.39px" }}>AI-powered closing platform for real estate attorneys. From intake to clear-to-close.</p>
              <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20, padding: "5px 10px 5px 8px", border: `1px solid ${c.hairline}`, borderRadius: 6, textDecoration: "none", backgroundColor: c.canvasSoft }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: c.primary, flexShrink: 0 }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 400, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>A Boxford Partners Company</span>
              </a>
            </div>
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: c.muted, marginBottom: 16 }}>Product</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Pricing", "/pricing"], ["Demo", "/demo"], ["Blog", "/blog"], ["Log in", "/login"], ["Sign up", "/signup"]].map(([label, href]) => (
                  <li key={label}><Link href={href} style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none", letterSpacing: "-0.39px" }}>{label}</Link></li>
                ))}
              </ul>
            </div>
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: c.muted, marginBottom: 16 }}>Company</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Boxford Partners</a></li>
                <li><a href="https://cal.com/boxfordpartners/titlewise-demo" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Book a Demo</a></li>
                <li><a href="mailto:hello@titlewise.app" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Contact</a></li>
                <li><a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>LinkedIn</a></li>
              </ul>
            </div>
            <div style={{ paddingBottom: 40 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 400, letterSpacing: "0.07em", textTransform: "uppercase", color: c.muted, marginBottom: 16 }}>Legal</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <li><Link href="/privacy" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Privacy</Link></li>
                <li><Link href="/terms" style={{ fontSize: "13px", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="tw-footer-bottom" style={{ borderTop: `1px solid ${c.hairline}`, paddingTop: 20, paddingBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
            <p style={{ fontSize: "11px", fontWeight: 300, color: c.muted, margin: 0 }}>&copy; 2026 Boxford Partners LLC DBA TITLEwise. All rights reserved. &nbsp;&middot;&nbsp; 345 California St., Suite 600, San Francisco CA 94104</p>
            <a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" aria-label="Boxford Partners on LinkedIn" style={{ color: c.muted }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
