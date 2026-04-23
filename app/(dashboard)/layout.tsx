"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  FileText, LayoutDashboard, FileSearch, Clock, Settings, Menu, X,
  Calculator, DollarSign, FileCheck, Shield, Building, ClipboardList,
  Bot, Users, Scale, Brain, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"

const coreNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/status-update", label: "Status Update", icon: FileText },
  { href: "/title-analysis", label: "Title Analysis", icon: FileSearch },
  { href: "/cd-reviewer", label: "CD Reviewer", icon: FileCheck },
  { href: "/wire-verification", label: "Wire Verification", icon: Shield },
  { href: "/hoa-reviewer", label: "HOA Reviewer", icon: Building },
  { href: "/fee-estimate", label: "Fee Estimate", icon: DollarSign },
  { href: "/proration-calculator", label: "Tax Proration", icon: Calculator },
  { href: "/checklist", label: "Checklists", icon: ClipboardList },
]

const premiumNav = [
  { href: "/checklist", label: "Closing Agent", icon: Bot, requiredPlans: ["pro", "enterprise"], badge: "Pro" },
  { href: "/checklist", label: "Client Portal", icon: Users, requiredPlans: ["small_firm", "pro", "enterprise"], badge: "SF+" },
  { href: "/cd-reviewer", label: "TRID Engine", icon: Scale, requiredPlans: ["pro", "enterprise"], badge: "Pro" },
  { href: "/wire-verification", label: "Wire Memory", icon: Brain, requiredPlans: ["small_firm", "pro", "enterprise"], badge: "SF+" },
]

const bottomNav = [
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ pathname, tier, onNavigate }: { pathname: string; tier: string | null; onNavigate?: () => void }) {
  return (
    <>
      <div className="h-14 px-4 flex items-center border-b border-border shrink-0">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {coreNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}

        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Advanced</p>
        </div>

        {premiumNav.map(({ href, label, icon: Icon, requiredPlans, badge }) => {
          const unlocked = tier ? requiredPlans.includes(tier) : false

          if (unlocked) {
            return (
              <Link
                key={label}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="text-[9px] font-semibold text-primary/60 uppercase">{badge}</span>
              </Link>
            )
          }

          return (
            <Link
              key={label}
              href="/pricing"
              onClick={onNavigate}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{label}</span>
              <span className="text-[9px] font-semibold uppercase">{badge}</span>
            </Link>
          )
        })}

        <div className="pt-3" />

        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border flex items-center gap-2 shrink-0">
        <UserButton />
        <span className="text-xs text-muted-foreground truncate">My Account</span>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tier, setTier] = useState<string | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setTier(data.subscriptionTier))
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-card border-r border-border flex-col shrink-0">
        <SidebarContent pathname={pathname} tier={tier} />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <Logo href="/dashboard" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5 text-muted-foreground" /> : <Menu className="h-5 w-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 w-64 h-full bg-card z-50 flex flex-col shadow-xl">
            <SidebarContent pathname={pathname} tier={tier} onNavigate={() => setMobileOpen(false)} />
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
