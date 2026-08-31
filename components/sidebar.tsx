"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import Image from "next/image"

type MatterItem = {
  id: string
  clientName: string
  propertyAddress: string
  status: string | null
}

function shortAddress(addr: string) {
  return addr.split(",")[0].trim()
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mattersOpen, setMattersOpen] = useState(true)
  const [matters, setMatters] = useState<MatterItem[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [trialStatus, setTrialStatus] = useState<{ isTrial: boolean; daysRemaining: number } | null>(null)
  const [customLogo, setCustomLogo] = useState<string | null>(null)

  const isMatterSection = pathname === "/matters" || pathname.startsWith("/matters/")
  const isHistory = pathname === "/history"
  const isSettings = pathname === "/settings"

  const displayName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Account"

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : (session?.user?.email?.[0]?.toUpperCase() ?? "?")

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.matters ?? []).filter((m: MatterItem & { status: string }) => m.status === "active")
        setMatters(active.slice(0, 12))
      })
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    fetch("/api/user/trial-status")
      .then((r) => r.json())
      .then((d) => setTrialStatus(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setCustomLogo(d.user?.customLogoUrl || null))
      .catch(() => {})
  }, [])

  return (
    <div className="h-full flex flex-col bg-white border-r" style={{ borderColor: "#e3e8ee" }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: "#e3e8ee" }}>
        <Link href="/matters" className="block">
          {customLogo ? (
            <Image
              src={customLogo}
              alt="Company Logo"
              width={140}
              height={32}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <Logo size="sm" />
          )}
        </Link>
      </div>

      {/* Trial banner */}
      {trialStatus?.isTrial && (
        <div style={{
          margin: "0.75rem",
          padding: "0.75rem",
          borderRadius: 8,
          backgroundColor: "#fff8e6",
          border: "1px solid #ffd666",
        }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 400, color: "#d48806", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Free Trial
          </p>
          <p style={{ fontSize: "0.75rem", fontWeight: 300, color: "#64748d", marginBottom: 8 }}>
            {trialStatus.daysRemaining > 0
              ? `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? "" : "s"} remaining`
              : "Trial ends today"}
          </p>
          <Link
            href="/pricing"
            style={{
              display: "block",
              textAlign: "center",
              padding: "6px 12px",
              borderRadius: 9999,
              backgroundColor: "#0066cc",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 400,
              textDecoration: "none",
            }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>

        {/* Matters accordion */}
        <button
          onClick={() => setMattersOpen((o) => !o)}
          className={`sidebar-nav-item${isMatterSection ? " active" : ""}`}
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ opacity: isMatterSection ? 1 : 0.5 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            Matters
          </div>
          <svg
            width="12" height="12" fill="none" viewBox="0 0 12 12"
            style={{ opacity: 0.4, transform: mattersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {mattersOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 4 }}>
            <Link
              href="/matters"
              onClick={onClose}
              className={`sidebar-matter-all${pathname === "/matters" ? " active" : ""}`}
            >
              All matters
              {matters.length > 0 && (
                <span style={{ fontSize: "0.65rem", backgroundColor: "#f0f9ff", color: "#0066cc", borderRadius: 10, padding: "1px 6px", fontWeight: 400 }}>
                  {matters.length}
                </span>
              )}
            </Link>

            {matters.map((m) => {
              const isActive = pathname === `/matters/${m.id}` || pathname.startsWith(`/matters/${m.id}/`)
              return (
                <Link
                  key={m.id}
                  href={`/matters/${m.id}`}
                  onClick={onClose}
                  className={`sidebar-matter-item${isActive ? " active" : ""}`}
                  title={m.propertyAddress}
                >
                  {shortAddress(m.propertyAddress)}
                </Link>
              )
            })}

            {matters.length === 0 && (
              <p style={{ padding: "4px 10px 4px 36px", fontSize: "0.75rem", fontWeight: 300, color: "#cbd5e1" }}>
                No active matters
              </p>
            )}
          </div>
        )}

        {/* History */}
        <Link
          href="/history"
          onClick={onClose}
          className={`sidebar-nav-item${isHistory ? " active" : ""}`}
        >
          <span style={{ opacity: isHistory ? 1 : 0.5 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path d="M8 3v5l3 3M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          History
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          onClick={onClose}
          className={`sidebar-nav-item${isSettings ? " active" : ""}`}
        >
          <span style={{ opacity: isSettings ? 1 : 0.5 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.25" />
              <path d="M13.3 8c0-.28-.02-.55-.07-.82l1.2-.94a.4.4 0 00.1-.5l-1.14-1.97a.4.4 0 00-.49-.18l-1.41.57a5.9 5.9 0 00-1.43-.83l-.21-1.5A.4.4 0 009.47 1.5H7.27a.4.4 0 00-.4.34l-.21 1.5a5.9 5.9 0 00-1.43.83L3.82 3.6a.4.4 0 00-.49.18L2.2 5.74a.4.4 0 00.1.5l1.2.94A5.6 5.6 0 003.43 8c0 .28.02.55.07.82l-1.2.94a.4.4 0 00-.1.5l1.14 1.97c.1.17.3.23.49.18l1.41-.57c.44.32.92.59 1.43.83l.21 1.5c.05.2.22.33.4.33h2.2c.19 0 .35-.14.4-.34l.21-1.5a5.9 5.9 0 001.43-.83l1.41.57c.2.08.4.01.49-.18l1.14-1.97a.4.4 0 00-.1-.5l-1.2-.94c.05-.27.07-.54.07-.82z" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </span>
          Settings
        </Link>
      </nav>

      {/* New matter CTA */}
      <div className="sidebar-new-matter-section">
        <Link href="/matters?new=1" onClick={onClose} className="sidebar-new-matter">
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New matter
        </Link>
      </div>

      {/* User footer */}
      <div className="sidebar-footer" style={{ position: "relative" }}>
        <button
          onClick={() => setShowUserMenu((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: "0.5rem", transition: "background-color 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#0066cc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 400, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <p style={{ color: "#64748d", fontSize: "0.8rem", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
            {displayName}
          </p>
        </button>

        {showUserMenu && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setShowUserMenu(false)} />
            <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8, backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #e3e8ee", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 1000, padding: 4 }}>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#64748d", fontSize: "0.875rem", fontWeight: 300, textAlign: "left", cursor: "pointer", borderRadius: 6, transition: "background-color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
