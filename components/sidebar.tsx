"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { useState, useEffect } from "react"

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
  const { user } = useUser()
  const { signOut } = useClerk()
  const [mattersOpen, setMattersOpen] = useState(true)
  const [matters, setMatters] = useState<MatterItem[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [trialStatus, setTrialStatus] = useState<{ isTrial: boolean; daysRemaining: number } | null>(null)

  const isMatterSection = pathname === "/matters" || pathname.startsWith("/matters/")
  const isHistory = pathname === "/history"
  const isSettings = pathname === "/settings"

  const displayName = user?.firstName
    ? user.firstName + (user.lastName ? " " + user.lastName : "")
    : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Account"

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : (user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "?")

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

  return (
    <div className="sidebar">
      {/* Wordmark */}
      <div className="sidebar-wordmark">
        <Link href="/matters" className="block">
          <span style={{ color: "rgba(237,237,235,0.9)", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            titlewise
          </span>
        </Link>
      </div>

      {/* Trial banner */}
      {trialStatus?.isTrial && (
        <div style={{
          margin: "0.75rem",
          padding: "0.75rem",
          borderRadius: 8,
          backgroundColor: "rgba(232,168,74,0.12)",
          border: "1px solid rgba(232,168,74,0.25)",
        }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#e8a84a", marginBottom: 4 }}>
            FREE TRIAL
          </p>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            {trialStatus.daysRemaining > 0
              ? `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? "" : "s"} remaining`
              : "Trial ends today"}
          </p>
          <Link
            href="/pricing"
            style={{
              display: "block",
              textAlign: "center",
              padding: "5px 0",
              borderRadius: 6,
              backgroundColor: "#e8a84a",
              color: "#0a0700",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>

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
                <span style={{ fontSize: "0.65rem", backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "1px 6px", fontWeight: 600 }}>
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
              <p style={{ padding: "4px 10px 4px 36px", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
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
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
            {displayName}
          </p>
        </button>

        {showUserMenu && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setShowUserMenu(false)} />
            <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 8, right: 8, backgroundColor: "#2C2C2E", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 1000, padding: 4 }}>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "rgba(255,255,255,0.75)", fontSize: "0.875rem", textAlign: "left", cursor: "pointer", borderRadius: 6, transition: "background-color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}
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
