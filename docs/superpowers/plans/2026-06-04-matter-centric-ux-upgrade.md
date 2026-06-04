# Matter-Centric UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure titlewise from a tool-drawer app into a matter-centric workspace modeled after stridetc, so attorneys work in the context of a matter rather than navigating between disconnected tools.

**Architecture:** The `matters` table already exists in the DB. The upgrade promotes matters to the top-level organizing concept: a dark sidebar lists open matters live (mirroring stridetc's transaction list), a new matter detail page hosts all tools as tabs, and all tool forms pre-fill from matter context. The existing standalone tool routes remain but receive a `?matterId=` prefill path so deep-links still work.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Drizzle ORM, Clerk auth, Framer Motion, Lucide React. No new dependencies required.

---

## File Map

### New files
- `app/(dashboard)/layout.tsx` — **replace** current layout with dark-sidebar + matter list shell (was: generic Clerk UserButton sidebar)
- `app/(dashboard)/matters/page.tsx` — matter list / new-matter entry point (replaces `/checklist`)
- `app/(dashboard)/matters/[matterId]/page.tsx` — matter detail with tool tabs (replaces `/checklist/[matterId]`)
- `components/sidebar.tsx` — dark sidebar component mirroring stridetc Sidebar.tsx pattern
- `components/matter-context.tsx` — React context that supplies current matter data to tool forms
- `app/globals.css` — add sidebar CSS token vars (sidebar-border, sidebar-active, sidebar-muted colors)

### Modified files
- `app/(dashboard)/dashboard/page.tsx` — replace tool-drawer dashboard with matter status board (closing this week, overdue, recent activity)
- `app/(dashboard)/status-update/page.tsx` — consume MatterContext for auto-fill; add "Back to matter" breadcrumb
- `app/(dashboard)/title-analysis/page.tsx` — same
- `app/(dashboard)/cd-reviewer/page.tsx` — same
- `app/(dashboard)/wire-verification/page.tsx` — same
- `app/(dashboard)/hoa-reviewer/page.tsx` — same
- `app/(dashboard)/fee-estimate/page.tsx` — same
- `app/(dashboard)/proration-calculator/page.tsx` — same
- `app/(dashboard)/checklist/page.tsx` — redirect to `/matters` (301)
- `app/(dashboard)/checklist/[matterId]/page.tsx` — redirect to `/matters/[matterId]` (301)

### Untouched
- All API routes (`app/api/`) — no changes, they already accept `matterId`
- `lib/db/schema.ts` — no changes needed, `matters` table is already correct
- `components/ui/` — no changes
- `lib/` utilities, auth, stripe — no changes

---

## Task 1: Add sidebar CSS tokens to globals.css

**Files:**
- Modify: `app/globals.css`

The titlewise `globals.css` has no sidebar variables. Add them so the new sidebar component can reference them, matching stridetc's color system exactly.

- [ ] **Step 1: Add sidebar CSS custom properties to `:root` block**

Open `app/globals.css`. The `:root` block currently ends before `--spacing-2xs`. Add these lines at the end of `:root`:

```css
  /* Sidebar — matches stridetc dark sidebar */
  --color-sidebar: #1C1C1E;
  --color-sidebar-text: rgba(255, 255, 255, 0.85);
  --color-sidebar-muted: rgba(255, 255, 255, 0.40);
  --color-sidebar-border: rgba(255, 255, 255, 0.08);
  --color-sidebar-active: rgba(255, 255, 255, 0.10);
  --color-sidebar-hover: rgba(255, 255, 255, 0.05);
  --color-canvas: #F7F7F5;
```

- [ ] **Step 2: Add sidebar utility classes after the `@keyframes accordion-up` block**

```css
/* ── Sidebar ─────────────────────────────────────────────────────────── */

.sidebar {
  background-color: var(--color-sidebar);
  width: 14rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-wordmark {
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-sidebar-border);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-sidebar-muted);
  transition: background-color 0.15s, color 0.15s;
  text-decoration: none;
}

.sidebar-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

.sidebar-nav-item.active {
  background-color: var(--color-sidebar-active);
  color: #FFFFFF;
}

.sidebar-matter-item {
  display: block;
  padding: 5px 10px 5px 36px;
  border-radius: 5px;
  font-size: 0.8rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color 0.1s, color 0.1s, border-color 0.1s;
  border-left: 2px solid transparent;
  cursor: pointer;
}

.sidebar-matter-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  border-left-color: rgba(255, 255, 255, 0.15);
}

.sidebar-matter-item.active {
  background-color: rgba(255, 255, 255, 0.10);
  color: #FFFFFF;
  border-left-color: rgba(255, 255, 255, 0.30);
}

.sidebar-matter-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 5px 10px 5px 36px;
  border-radius: 5px;
  font-size: 0.8rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.45);
  transition: background-color 0.1s, color 0.1s;
  cursor: pointer;
}

.sidebar-matter-all:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
}

.sidebar-matter-all.active {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.90);
}

.sidebar-new-matter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: var(--color-sidebar-active);
  color: #FFFFFF;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.15s;
}

.sidebar-new-matter:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.sidebar-new-matter-section {
  padding: 0.75rem;
  border-top: 1px solid var(--color-sidebar-border);
}

.sidebar-footer {
  border-top: 1px solid var(--color-sidebar-border);
  padding: 1rem;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add app/globals.css
git commit -m "feat: add sidebar CSS tokens and utility classes"
```

---

## Task 2: Build the Sidebar component

**Files:**
- Create: `components/sidebar.tsx`

This component mirrors stridetc's `Sidebar.tsx` exactly but uses matter terminology and Clerk's `useUser` hook (not Supabase auth). It fetches open matters from `/api/checklist` on mount.

- [ ] **Step 1: Create `components/sidebar.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `components/sidebar.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add dark sidebar component with live matter list"
```

---

## Task 3: Replace the dashboard layout with the dark-sidebar shell

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

The current layout uses Clerk's `<UserButton />` and a plain light sidebar. Replace it with the new `Sidebar` component inside the same dark/canvas two-column shell stridetc uses. The background shifts from `bg-secondary` (light gray) to `#F7F7F5` (stridetc canvas).

- [ ] **Step 1: Overwrite `app/(dashboard)/layout.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useEffect } from "react"
import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/layout.tsx"
git commit -m "feat: replace light sidebar layout with dark-sidebar shell"
```

---

## Task 4: Build the Matters list page (`/matters`)

**Files:**
- Create: `app/(dashboard)/matters/page.tsx`

This is the matter list — equivalent to stridetc's `/dashboard`. It shows open matters as cards with closing-date urgency, progress bars from checklist completion, and a "New matter" inline form triggered by `?new=1` in the URL. Reuses the existing `/api/checklist` GET/POST endpoints (no API changes needed).

- [ ] **Step 1: Create `app/(dashboard)/matters/page.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { Plus, CheckCircle, AlertCircle, Loader2, FolderOpen } from "lucide-react"
import { US_STATES } from "@/lib/checklist-templates"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
  totalItems: number
  completedItems: number
  updatedAt: string
}

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function MattersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(searchParams.get("new") === "1")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ clientName: "", propertyAddress: "", transactionType: "Purchase", closingDate: "", state: "" })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((d) => setMatters(d.matters ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.clientName.trim() || !form.propertyAddress.trim()) {
      setFormError("Client name and property address are required.")
      return
    }
    setCreating(true)
    setFormError("")
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.matter) {
      router.push(`/matters/${data.matter.id}`)
    } else {
      setFormError(data.error ?? "Failed to create matter.")
      setCreating(false)
    }
  }

  const active = matters.filter((m) => m.status === "active")
  const closed = matters.filter((m) => m.status === "closed")
  const closingThisWeek = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d >= 0 && d <= 7 }).length
  const overdueItems = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d < 0 }).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Matters</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} open
            {closingThisWeek > 0 && <span className="ml-2 text-amber-600 font-medium">· {closingThisWeek} closing this week</span>}
            {overdueItems > 0 && <span className="ml-2 text-red-600 font-medium">· {overdueItems} past closing date</span>}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New matter
        </button>
      </div>

      {/* New matter form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">New matter</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client Name *</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                placeholder="e.g. John and Jane Smith"
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Property Address *</label>
              <input
                type="text"
                value={form.propertyAddress}
                onChange={(e) => setForm((p) => ({ ...p, propertyAddress: e.target.value }))}
                placeholder="e.g. 42 Maple Street, Portsmouth, NH"
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
              <select
                value={form.transactionType}
                onChange={(e) => setForm((p) => ({ ...p, transactionType: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">State</label>
              <select
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => <option key={s.abbreviation} value={s.abbreviation}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Closing Date</label>
              <input
                type="date"
                value={form.closingDate}
                onChange={(e) => setForm((p) => ({ ...p, closingDate: e.target.value }))}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-500 mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Creating..." : "Create matter"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setFormError("") }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No open matters</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create a matter to start tracking a closing</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New matter
          </button>
        </div>
      )}

      {/* Active matters */}
      {!loading && active.length > 0 && (
        <div className="space-y-3 mb-8">
          {active.map((m) => {
            const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
            const days = daysUntil(m.closingDate)
            const isUrgent = days !== null && days >= 0 && days <= 7
            const isOverdue = days !== null && days < 0
            const borderColor = isOverdue ? "border-red-200" : isUrgent ? "border-amber-200" : "border-border"
            const progressColor = isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-primary"

            return (
              <Link key={m.id} href={`/matters/${m.id}`}>
                <motion.div
                  className={`bg-card rounded-xl border ${borderColor} p-5 hover:shadow-sm transition-all duration-200`}
                  whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.propertyAddress} · {m.transactionType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {m.closingDate && (
                        <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
                          {isOverdue ? "Closed " : ""}{formatDate(m.closingDate)}
                        </span>
                      )}
                      {isUrgent && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {m.completedItems}/{m.totalItems}
                    </div>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Closed matters */}
      {!loading && closed.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Closed</p>
          <div className="space-y-2">
            {closed.slice(0, 5).map((m) => (
              <Link key={m.id} href={`/matters/${m.id}`} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{m.clientName}</p>
                  <p className="text-xs text-muted-foreground/60 truncate">{m.propertyAddress}</p>
                </div>
                {m.closingDate && (
                  <span className="text-xs text-muted-foreground/60 shrink-0">{formatDate(m.closingDate)}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MattersPage() {
  return (
    <Suspense>
      <MattersContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `app/(dashboard)/matters/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/matters/"
git commit -m "feat: add /matters list page with new-matter form and urgency indicators"
```

---

## Task 5: Build the Matter detail page (`/matters/[matterId]`)

**Files:**
- Create: `app/(dashboard)/matters/[matterId]/page.tsx`

This is the centerpiece. The matter detail page shows matter metadata at the top and then provides quick-launch cards to each tool pre-filled with that matter's data. It also shows the checklist progress inline. This replaces `/checklist/[matterId]` as the primary workspace for a matter.

The checklist interaction code is preserved from the existing `app/(dashboard)/checklist/[matterId]/page.tsx` — we're extracting its data-fetching and item management logic and embedding it here alongside the tool launcher cards.

- [ ] **Step 1: Create directory**

```bash
mkdir -p "/Users/patrickmitchell/titlewise/app/(dashboard)/matters/[matterId]"
```

- [ ] **Step 2: Create `app/(dashboard)/matters/[matterId]/page.tsx`**

```tsx
"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, Plus, Trash2, ArrowLeft, CheckCircle, Circle,
  FileText, FileSearch, FileCheck, Shield, Building, DollarSign,
  Calculator, ClipboardList, ChevronDown, Share2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  state: string | null
  status: string
  portalToken: string | null
}

type Item = {
  id: string
  title: string
  assignedTo: string | null
  status: string
  dueDate: string | null
  sortOrder: number
}

const PARTIES = ["attorney", "buyer", "seller", "lender", "title_company", "agent"]
const STATUS_CYCLE = ["pending", "in_progress", "complete"] as const

const TOOLS = [
  { href: "/status-update", icon: FileText, title: "Status Update", description: "Draft a client update email" },
  { href: "/title-analysis", icon: FileSearch, title: "Title Analysis", description: "Analyze title commitment" },
  { href: "/cd-reviewer", icon: FileCheck, title: "CD Reviewer", description: "Review closing disclosure" },
  { href: "/wire-verification", icon: Shield, title: "Wire Verification", description: "Verify wire instructions" },
  { href: "/hoa-reviewer", icon: Building, title: "HOA Reviewer", description: "Review HOA documents" },
  { href: "/fee-estimate", icon: DollarSign, title: "Fee Estimate", description: "Generate fee estimate letter" },
  { href: "/proration-calculator", icon: Calculator, title: "Tax Proration", description: "Calculate prorations" },
]

function matterQueryParams(matter: Matter): string {
  const params = new URLSearchParams({
    matterId: matter.id,
    clientName: matter.clientName,
    propertyAddress: matter.propertyAddress,
    transactionType: matter.transactionType,
  })
  if (matter.closingDate) params.set("closingDate", matter.closingDate.split("T")[0])
  return params.toString()
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function MatterDetailPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = use(params)
  const router = useRouter()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [newAssigned, setNewAssigned] = useState("")
  const [addingItem, setAddingItem] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [portalCopied, setPortalCopied] = useState(false)
  const [closingMatter, setClosingMatter] = useState(false)

  useEffect(() => {
    async function load() {
      const [mRes, iRes] = await Promise.all([
        fetch(`/api/checklist/${matterId}`),
        fetch(`/api/checklist/${matterId}/items`),
      ])
      if (!mRes.ok) { router.push("/matters"); return }
      const mData = await mRes.json()
      const iData = await iRes.json()
      setMatter(mData.matter)
      setItems(iData.items ?? [])
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [matterId, router])

  async function toggleStatus(item: Item) {
    const idx = STATUS_CYCLE.indexOf(item.status as typeof STATUS_CYCLE[number])
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i))
    await fetch(`/api/checklist/${matterId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  async function addItem() {
    if (!newTitle.trim()) return
    setAddingItem(true)
    const res = await fetch(`/api/checklist/${matterId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), assignedTo: newAssigned || null }),
    })
    const data = await res.json()
    if (data.item) {
      setItems((prev) => [...prev, data.item])
      setNewTitle("")
      setNewAssigned("")
    }
    setAddingItem(false)
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    await fetch(`/api/checklist/${matterId}/items/${itemId}`, { method: "DELETE" })
  }

  async function closeMatter() {
    if (!confirm("Mark this matter as closed?")) return
    setClosingMatter(true)
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    })
    router.push("/matters")
  }

  function copyPortalUrl() {
    if (!matter?.portalToken) return
    const url = `${window.location.origin}/matter-portal/${matter.portalToken}`
    navigator.clipboard.writeText(url)
    setPortalCopied(true)
    setTimeout(() => setPortalCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!matter) return null

  const completed = items.filter((i) => i.status === "complete").length
  const total = items.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const days = daysUntil(matter.closingDate)
  const isUrgent = days !== null && days >= 0 && days <= 7
  const isOverdue = days !== null && days < 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Back */}
      <Link href="/matters" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        All matters
      </Link>

      {/* Matter header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{matter.clientName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{matter.propertyAddress}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">{matter.transactionType}</span>
              {matter.state && <span className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">{matter.state}</span>}
              {matter.closingDate && (
                <span className={cn("text-xs font-medium", isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground")}>
                  Closing {new Date(matter.closingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {isUrgent && !isOverdue && ` · ${days}d`}
                  {isOverdue && " · Past due"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {matter.portalToken && (
              <button
                onClick={copyPortalUrl}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {portalCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
                {portalCopied ? "Copied" : "Portal"}
              </button>
            )}
            {matter.status === "active" && (
              <button
                onClick={closeMatter}
                disabled={closingMatter}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                {closingMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Close matter"}
              </button>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{completed}/{total} complete</span>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tools</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TOOLS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={`${href}?${matterQueryParams(matter)}`}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all duration-150"
            >
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setChecklistOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Closing Checklist</span>
            <span className="text-xs text-muted-foreground">({completed}/{total})</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", checklistOpen ? "rotate-180" : "")} />
        </button>

        <AnimatePresence>
          {checklistOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                {items.length === 0 && (
                  <p className="px-5 py-4 text-sm text-muted-foreground">No checklist items yet.</p>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    <button onClick={() => toggleStatus(item)} className="shrink-0">
                      {item.status === "complete"
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : item.status === "in_progress"
                        ? <Circle className="h-4 w-4 text-amber-500" />
                        : <Circle className="h-4 w-4 text-muted-foreground/40" />
                      }
                    </button>
                    <span className={cn("flex-1 text-sm", item.status === "complete" ? "line-through text-muted-foreground" : "text-foreground")}>
                      {item.title}
                    </span>
                    {item.assignedTo && (
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 capitalize">{item.assignedTo.replace("_", " ")}</span>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}

                {/* Add item */}
                <div className="px-5 py-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                      placeholder="Add checklist item..."
                      className="flex-1 text-sm bg-muted/40 border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
                    />
                    <select
                      value={newAssigned}
                      onChange={(e) => setNewAssigned(e.target.value)}
                      className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-muted-foreground"
                    >
                      <option value="">Assign to</option>
                      {PARTIES.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
                    </select>
                    <button
                      onClick={addItem}
                      disabled={addingItem || !newTitle.trim()}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                      {addingItem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/matters/"
git commit -m "feat: add matter detail page with tool launcher and inline checklist"
```

---

## Task 6: Add matter context pre-fill to all tool pages

**Files:**
- Modify: `app/(dashboard)/status-update/page.tsx`
- Modify: `app/(dashboard)/title-analysis/page.tsx`
- Modify: `app/(dashboard)/cd-reviewer/page.tsx`
- Modify: `app/(dashboard)/wire-verification/page.tsx`
- Modify: `app/(dashboard)/hoa-reviewer/page.tsx`
- Modify: `app/(dashboard)/fee-estimate/page.tsx`
- Modify: `app/(dashboard)/proration-calculator/page.tsx`

Each tool already reads `?matterId` from search params. The upgrade adds reading `clientName`, `propertyAddress`, `transactionType`, and `closingDate` from search params on mount so they pre-fill when launched from a matter. It also changes the breadcrumb link to `/matters/[matterId]` instead of `/checklist/[matterId]`.

**Status Update page already does this correctly** (reads `clientName`, `propertyAddress`, `transactionType`, `closingStage` from search params, has `← Back to matter` link). Only needs the breadcrumb URL updated from `/checklist/` to `/matters/`.

The other tool pages need the search param pre-fill added.

- [ ] **Step 1: Fix breadcrumb in status-update page**

In `app/(dashboard)/status-update/page.tsx`, find:

```tsx
<Link href={`/checklist/${matterId}`} className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
  ← Back to matter
</Link>
```

Replace with:

```tsx
<Link href={`/matters/${matterId}`} className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
  ← Back to matter
</Link>
```

- [ ] **Step 2: Add matter pre-fill to title-analysis page**

In `app/(dashboard)/title-analysis/page.tsx`, find the component that reads `searchParams`. After reading `matterId`, add reads for `clientName`, `propertyAddress`, and populate `propertyAddress` as the form's initial value if it exists. Also add the "Back to matter" breadcrumb. The exact pattern to follow:

Find the `useEffect` that reads search params (or `useState` initialization) — the `propertyAddress` field — and update the initial value to read from `searchParams.get("propertyAddress") ?? ""`. Then add the breadcrumb next to the heading.

Locate the heading section (the `<h1>` or title element). Directly after the heading, add:

```tsx
{matterId && (
  <Link href={`/matters/${matterId}`} className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
    ← Back to matter
  </Link>
)}
```

And update the initial state for `propertyAddress`:

Find the form state initialization (typically `useState({ propertyAddress: "", ... })`). Change to:

```tsx
const searchParams = useSearchParams()
// at the top of the component, after the hook
const prefillAddress = searchParams.get("propertyAddress") ?? ""
const prefillMatterId = searchParams.get("matterId") ?? undefined
```

Then use `prefillAddress` and `prefillMatterId` as initial values in `useState`. The `matterId` variable used for the breadcrumb and form submission should be `prefillMatterId`.

- [ ] **Step 3: Apply the same pattern to cd-reviewer, wire-verification, hoa-reviewer, fee-estimate, proration-calculator**

For each page, the change is identical in structure:
1. Read `matterId`, `clientName`, `propertyAddress`, `transactionType` from `useSearchParams()`
2. Use these as initial form values
3. Add the breadcrumb link to `/matters/[matterId]` near the page heading

The exact field names vary per tool. Use `clientName` for fee-estimate and status-update. Use `propertyAddress` for title-analysis, cd-reviewer, wire-verification, hoa-reviewer. The proration-calculator doesn't have client/property fields so only add the breadcrumb.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/status-update/page.tsx" "app/(dashboard)/title-analysis/page.tsx" "app/(dashboard)/cd-reviewer/page.tsx" "app/(dashboard)/wire-verification/page.tsx" "app/(dashboard)/hoa-reviewer/page.tsx" "app/(dashboard)/fee-estimate/page.tsx" "app/(dashboard)/proration-calculator/page.tsx"
git commit -m "feat: add matter context pre-fill and back-to-matter breadcrumb to all tool pages"
```

---

## Task 7: Redirect legacy checklist routes to matters

**Files:**
- Modify: `app/(dashboard)/checklist/page.tsx`
- Modify: `app/(dashboard)/checklist/[matterId]/page.tsx`

Any existing links or bookmarks to `/checklist` and `/checklist/[matterId]` should forward to the new routes. Use Next.js `redirect()` from `next/navigation`.

- [ ] **Step 1: Replace `app/(dashboard)/checklist/page.tsx`**

```tsx
import { redirect } from "next/navigation"

export default function ChecklistRedirect() {
  redirect("/matters")
}
```

- [ ] **Step 2: Replace `app/(dashboard)/checklist/[matterId]/page.tsx`**

```tsx
import { redirect } from "next/navigation"

export default function MatterRedirect({ params }: { params: { matterId: string } }) {
  redirect(`/matters/${params.matterId}`)
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/checklist/page.tsx" "app/(dashboard)/checklist/[matterId]/page.tsx"
git commit -m "feat: redirect /checklist routes to /matters"
```

---

## Task 8: Replace the dashboard with a matter status board

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

The current dashboard is a tool-drawer with magnetic Framer Motion cards and no real state. Replace it with a status board modeled after stridetc's `TransactionSearch` component: closing this week, overdue, all open matters, quick stats. The tool cards move to the sidebar (accessible via `/matters/[id]`) — the dashboard becomes a command center.

- [ ] **Step 1: Overwrite `app/(dashboard)/dashboard/page.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, FolderOpen, Plus, Clock } from "lucide-react"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
  totalItems: number
  completedItems: number
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function DashboardPage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/checklist").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([mattData, settData]) => {
      setMatters(mattData.matters ?? [])
      setUserName(settData.name ?? null)
    }).finally(() => setLoading(false))
  }, [])

  const active = matters.filter((m) => m.status === "active")
  const closingThisWeek = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d >= 0 && d <= 7 })
  const overdue = active.filter((m) => { const d = daysUntil(m.closingDate); return d !== null && d < 0 })
  const other = active.filter((m) => {
    const d = daysUntil(m.closingDate)
    return d === null || d > 7
  })

  function MatterCard({ m }: { m: Matter }) {
    const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
    const days = daysUntil(m.closingDate)
    const isUrgent = days !== null && days >= 0 && days <= 7
    const isOverdue = days !== null && days < 0
    return (
      <Link href={`/matters/${m.id}`}>
        <motion.div
          className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all duration-200"
          whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{m.clientName}</p>
              <p className="text-xs text-muted-foreground truncate">{m.propertyAddress.split(",")[0]}</p>
            </div>
            {m.closingDate && (
              <span className={`text-xs font-medium shrink-0 ml-2 ${isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-muted-foreground"}`}>
                {formatDate(m.closingDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{m.completedItems}/{m.totalItems}</span>
          </div>
        </motion.div>
      </Link>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {userName ? `Good morning, ${userName.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {active.length} open matter{active.length !== 1 ? "s" : ""}
          {closingThisWeek.length > 0 && <span className="text-amber-600 font-medium"> · {closingThisWeek.length} closing this week</span>}
          {overdue.length > 0 && <span className="text-red-600 font-medium"> · {overdue.length} past closing date</span>}
        </p>
      </div>

      {!loading && active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No open matters</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first matter to start tracking a closing</p>
          <Link
            href="/matters?new=1"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New matter
          </Link>
        </div>
      )}

      {closingThisWeek.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Closing This Week</p>
          </div>
          <div className="space-y-2">
            {closingThisWeek.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {overdue.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Past Closing Date</p>
          </div>
          <div className="space-y-2">
            {overdue.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open</p>
          </div>
          <div className="space-y-2">
            {other.map((m) => <MatterCard key={m.id} m={m} />)}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/patrickmitchell/titlewise
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: replace tool-drawer dashboard with matter status board"
```

---

## Task 9: Smoke test all routes

**Goal:** Verify the app builds and all critical routes are reachable.

- [ ] **Step 1: Run production build**

```bash
cd /Users/patrickmitchell/titlewise
npm run build 2>&1 | tail -30
```

Expected: `Route (app)` table with no errors. All new routes should appear:
- `/(dashboard)/matters`
- `/(dashboard)/matters/[matterId]`
- `/(dashboard)/dashboard`
- Redirects for `/(dashboard)/checklist` and `/(dashboard)/checklist/[matterId]`

- [ ] **Step 2: Start dev server and spot-check in browser**

```bash
npm run dev -- --port 3001
```

Then manually verify:
- `/matters` loads (matter list or empty state)
- `/matters?new=1` shows the new matter form open
- `/dashboard` shows the status board (not tool cards)
- `/checklist` redirects to `/matters`
- `/status-update` still works standalone
- Sidebar shows dark background with "Matters" accordion

- [ ] **Step 3: Commit final state tag**

```bash
git tag v-matter-centric-ux
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Dark sidebar with live matter list | Tasks 1, 2, 3 |
| Matter-first navigation architecture | Tasks 2, 3 |
| `/matters` list page with urgency indicators | Task 4 |
| Matter detail page with tool launcher | Task 5 |
| Tools pre-fill from matter context | Task 6 |
| Back-to-matter breadcrumb on all tools | Task 6 |
| Dashboard becomes status board | Task 8 |
| Legacy `/checklist` routes redirect | Task 7 |
| Build verification | Task 9 |

**Gaps/notes:**

- The Clerk `useUser` + `useClerk` hooks in `Sidebar` (`components/sidebar.tsx`) work in Clerk v5+. The project uses `@clerk/nextjs ^7.2.0` which supports both. If sign-out fails, swap `signOut({ redirectUrl: "/" })` for `signOut()`.
- Task 6 Step 3 is intentionally written as guidance rather than showing full diffs for all 5 remaining pages — each page is 12-20KB and the pattern is mechanical. A subagent implementing this task should read each page first and apply the pattern precisely.
- The `matters/[matterId]/page.tsx` calls `/api/checklist/${matterId}` and `/api/checklist/${matterId}/items` — these routes already exist from the existing checklist feature.
- No DB migration needed — the `matters` table already has all required columns.
