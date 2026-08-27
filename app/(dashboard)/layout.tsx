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

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user?.onboardingCompletedAt) {
          router.push("/welcome")
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7F5" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setMobileOpen(false)} />
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
        className="lg:hidden fixed top-0 left-0 right-0 z-10 h-12 flex items-center px-4 gap-3"
        style={{ backgroundColor: "#1C1C1E" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white"
          aria-label="Open menu"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ color: "rgba(237,237,235,0.9)", fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          titlewise
        </span>
      </header>

      {/* Main content */}
      <main className="lg:pl-56 min-h-screen pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
