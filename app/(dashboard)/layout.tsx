"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === "/welcome") return

    // Skip onboarding check in dev mode
    if (process.env.NODE_ENV === "development") return

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const status = d.user?.subscriptionStatus
        if (status !== "active" && status !== "trialing") {
          router.push("/pricing")
        } else if (!d.user?.onboardingCompletedAt) {
          router.push("/welcome")
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ width: "14rem" }}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-10 h-12 flex items-center px-4 gap-3 border-b"
        style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ color: "var(--foreground)", fontSize: "1rem", fontWeight: 300, letterSpacing: "-0.02em" }}>
          TITLEwise
        </span>
      </header>

      {/* Main content */}
      <main className="lg:pl-56 min-h-screen pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
