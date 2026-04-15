"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { FileText, LayoutDashboard, FileSearch, Clock, Settings, Menu, X, Calculator, DollarSign, FileCheck, Shield, Building, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/status-update", label: "Status Update", icon: FileText },
  { href: "/title-analysis", label: "Title Analysis", icon: FileSearch },
  { href: "/cd-reviewer", label: "CD Reviewer", icon: FileCheck },
  { href: "/wire-verification", label: "Wire Verification", icon: Shield },
  { href: "/hoa-reviewer", label: "HOA Reviewer", icon: Building },
  { href: "/fee-estimate", label: "Fee Estimate", icon: DollarSign },
  { href: "/proration-calculator", label: "Tax Proration", icon: Calculator },
  { href: "/checklist", label: "Checklists", icon: ClipboardList },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="h-14 px-4 flex items-center border-b border-slate-200 shrink-0">
        <img src="/logo.svg" alt="TitleWise" className="h-9 w-auto" />
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 flex items-center gap-2 shrink-0">
        <UserButton />
        <span className="text-xs text-slate-500 truncate">My Account</span>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col shrink-0">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <img src="/logo.svg" alt="TitleWise" className="h-9 w-auto" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 w-64 h-full bg-white z-50 flex flex-col shadow-xl">
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
