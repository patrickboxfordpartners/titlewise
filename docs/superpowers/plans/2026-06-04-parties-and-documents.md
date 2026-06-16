# Parties and Document Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured party contact management and document collection tracking to each matter, surfaced as two new panels on the matter detail page.

**Architecture:** Two new DB tables (`matter_parties`, `document_slots`) with RESTful API routes under `/api/matters/[matterId]/`. Before adding the new panels, fix three broken API calls in the existing matter detail page (items fetch, close matter, and item mutations all call non-existent sub-routes or send wrong payloads). New panels are self-contained components that each manage their own data-fetching and CRUD state.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Neon PostgreSQL, Clerk auth, Zod v4, Lucide React, Tailwind CSS 4.

---

## File Map

### New files
- `app/api/checklist/[matterId]/items/route.ts` — GET list items, POST add item (fixes 404 from matter detail page)
- `app/api/checklist/[matterId]/items/[itemId]/route.ts` — PATCH update item, DELETE item (fixes 404 from matter detail page)
- `app/api/matters/[matterId]/parties/route.ts` — GET list parties, POST create party
- `app/api/matters/[matterId]/parties/[partyId]/route.ts` — PATCH update party, DELETE party
- `app/api/matters/[matterId]/documents/route.ts` — GET list slots, POST create slot
- `app/api/matters/[matterId]/documents/[slotId]/route.ts` — PATCH update slot status/notes, DELETE slot
- `components/parties-panel.tsx` — self-contained parties CRUD panel
- `components/document-slots-panel.tsx` — self-contained document slots CRUD panel

### Modified files
- `lib/db/schema.ts` — add `matterParties` and `documentSlots` table definitions + exported types
- `app/(dashboard)/matters/[matterId]/page.tsx` — fix 3 broken API call patterns, add `<PartiesPanel>` and `<DocumentSlotsPanel>`

### Untouched
- All existing `/api/checklist/` routes — no changes to `route.ts` or `[matterId]/route.ts`
- All tool pages — no changes

---

## Task 1: Fix broken API calls in matter detail page

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

The page has three bugs introduced when it was written against non-existent sub-routes. The existing API at `PATCH /api/checklist/[matterId]` uses action-discriminator payloads.

**Bug 1:** `load()` fetches `/api/checklist/[matterId]/items` (404). The existing `GET /api/checklist/[matterId]` already returns `{ matter, items }`. Fix: use `mData.items` instead of a second fetch.

**Bug 2:** `closeMatter()` sends `{ status: "closed" }` but the API expects `{ action: "close" }`.

**Bug 3:** `toggleStatus()`, `addItem()`, `deleteItem()` call non-existent sub-routes. Fix: use the existing PATCH format with action discriminators.

- [ ] **Step 1: Read the file**

```bash
cat "/Users/patrickmitchell/titlewise/app/(dashboard)/matters/[matterId]/page.tsx"
```

- [ ] **Step 2: Fix the `load()` function**

Find the current `load()` function:
```tsx
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
```

Replace with:
```tsx
async function load() {
  const res = await fetch(`/api/checklist/${matterId}`)
  if (!res.ok) { router.push("/matters"); return }
  const data = await res.json()
  setMatter(data.matter)
  setItems(data.items ?? [])
  setLoading(false)
}
```

- [ ] **Step 3: Fix `toggleStatus()`**

Find:
```tsx
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
```

Replace with:
```tsx
async function toggleStatus(item: Item) {
  const idx = STATUS_CYCLE.indexOf(item.status as typeof STATUS_CYCLE[number])
  const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
  setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i))
  await fetch(`/api/checklist/${matterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId: item.id, status: next }),
  })
}
```

- [ ] **Step 4: Fix `addItem()`**

Find:
```tsx
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
```

Replace with:
```tsx
async function addItem() {
  if (!newTitle.trim()) return
  setAddingItem(true)
  const res = await fetch(`/api/checklist/${matterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add", title: newTitle.trim(), assignedTo: newAssigned || undefined }),
  })
  const data = await res.json()
  if (data.item) {
    setItems((prev) => [...prev, data.item])
    setNewTitle("")
    setNewAssigned("")
  }
  setAddingItem(false)
}
```

- [ ] **Step 5: Fix `deleteItem()`**

Find:
```tsx
async function deleteItem(itemId: string) {
  setItems((prev) => prev.filter((i) => i.id !== itemId))
  await fetch(`/api/checklist/${matterId}/items/${itemId}`, { method: "DELETE" })
}
```

Replace with:
```tsx
async function deleteItem(itemId: string) {
  setItems((prev) => prev.filter((i) => i.id !== itemId))
  await fetch(`/api/checklist/${matterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", itemId }),
  })
}
```

- [ ] **Step 6: Fix `closeMatter()`**

Find:
```tsx
body: JSON.stringify({ status: "closed" }),
```

Replace with:
```tsx
body: JSON.stringify({ action: "close" }),
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in the modified file.

- [ ] **Step 8: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/matters/[matterId]/page.tsx"
git commit -m "fix: correct matter detail API calls to match existing route contracts"
```

---

## Task 2: Add DB schema and run migration

**Files:**
- Modify: `lib/db/schema.ts`

Add two new tables and their exported types. The `matterParties` table stores party contacts per matter. The `documentSlots` table tracks which documents are needed and whether they've been received.

- [ ] **Step 1: Add imports if missing**

Open `lib/db/schema.ts`. The first line should already import `boolean` or confirm it does not — check the existing import:
```ts
import { pgTable, text, timestamp, integer, uuid, jsonb, index } from "drizzle-orm/pg-core"
```

No new imports needed — `text`, `timestamp`, `integer`, `uuid`, `index` are already present.

- [ ] **Step 2: Add `matterParties` table**

At the end of `lib/db/schema.ts`, before the final type exports block, add:

```ts
export const matterParties = pgTable("matter_parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // buyer | seller | buyers_agent | listing_agent | lender | other
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_matter_parties_matter_id").on(table.matterId),
])
```

- [ ] **Step 3: Add `documentSlots` table**

Directly after `matterParties`, add:

```ts
export const documentSlots = pgTable("document_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  category: text("category").notNull(), // contract | title | lender | hoa | misc
  status: text("status").default("pending").notNull(), // pending | received | waived
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_document_slots_matter_id").on(table.matterId),
])
```

- [ ] **Step 4: Add type exports**

After the new table definitions, add:

```ts
export type MatterParty = typeof matterParties.$inferSelect
export type NewMatterParty = typeof matterParties.$inferInsert
export type DocumentSlot = typeof documentSlots.$inferSelect
export type NewDocumentSlot = typeof documentSlots.$inferInsert
```

- [ ] **Step 5: Push schema to DB**

```bash
cd /Users/patrickmitchell/titlewise && npm run db:push 2>&1 | tail -20
```

Expected: confirms the two new tables are created. If it prompts for confirmation, type `y`.

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add lib/db/schema.ts
git commit -m "feat: add matter_parties and document_slots schema tables"
```

---

## Task 3: Parties API routes

**Files:**
- Create: `app/api/matters/[matterId]/parties/route.ts`
- Create: `app/api/matters/[matterId]/parties/[partyId]/route.ts`

Follow the exact same auth + ownership pattern as `app/api/checklist/[matterId]/route.ts`.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "/Users/patrickmitchell/titlewise/app/api/matters/[matterId]/parties/[partyId]"
```

- [ ] **Step 2: Create `app/api/matters/[matterId]/parties/route.ts`**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, matterParties } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const createPartySchema = z.object({
  role: z.enum(["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"]),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const parties = await db.select().from(matterParties)
    .where(eq(matterParties.matterId, matterId))
    .orderBy(asc(matterParties.createdAt))

  return NextResponse.json({ parties })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createPartySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const [party] = await db.insert(matterParties).values({
    matterId,
    role: parsed.data.role,
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    company: parsed.data.company ?? null,
  }).returning()

  return NextResponse.json({ party }, { status: 201 })
}
```

- [ ] **Step 3: Create `app/api/matters/[matterId]/parties/[partyId]/route.ts`**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, matterParties } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const updatePartySchema = z.object({
  role: z.enum(["buyer", "seller", "buyers_agent", "listing_agent", "lender", "other"]).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string; partyId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, partyId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = updatePartySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.role) updates.role = parsed.data.role
  if (parsed.data.name) updates.name = parsed.data.name
  if (parsed.data.email !== undefined) updates.email = parsed.data.email
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone
  if (parsed.data.company !== undefined) updates.company = parsed.data.company

  await db.update(matterParties).set(updates)
    .where(and(eq(matterParties.id, partyId), eq(matterParties.matterId, matterId)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matterId: string; partyId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, partyId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(matterParties)
    .where(and(eq(matterParties.id, partyId), eq(matterParties.matterId, matterId)))

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in new files.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/api/matters/"
git commit -m "feat: add parties API routes (GET, POST, PATCH, DELETE)"
```

---

## Task 4: Document slots API routes

**Files:**
- Create: `app/api/matters/[matterId]/documents/route.ts`
- Create: `app/api/matters/[matterId]/documents/[slotId]/route.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "/Users/patrickmitchell/titlewise/app/api/matters/[matterId]/documents/[slotId]"
```

- [ ] **Step 2: Create `app/api/matters/[matterId]/documents/route.ts`**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, documentSlots } from "@/lib/db/schema"
import { eq, and, asc, desc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const createSlotSchema = z.object({
  label: z.string().min(1),
  category: z.enum(["contract", "title", "lender", "hoa", "misc"]),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const slots = await db.select().from(documentSlots)
    .where(eq(documentSlots.matterId, matterId))
    .orderBy(asc(documentSlots.sortOrder), asc(documentSlots.createdAt))

  return NextResponse.json({ slots })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = createSlotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const existing = await db.select({ sortOrder: documentSlots.sortOrder })
    .from(documentSlots).where(eq(documentSlots.matterId, matterId))
    .orderBy(desc(documentSlots.sortOrder)).limit(1)
  const nextOrder = (existing[0]?.sortOrder ?? 0) + 100

  const [slot] = await db.insert(documentSlots).values({
    matterId,
    label: parsed.data.label,
    category: parsed.data.category,
    status: "pending",
    sortOrder: nextOrder,
  }).returning()

  return NextResponse.json({ slot }, { status: 201 })
}
```

- [ ] **Step 3: Create `app/api/matters/[matterId]/documents/[slotId]/route.ts`**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, documentSlots } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

const updateSlotSchema = z.object({
  status: z.enum(["pending", "received", "waived"]).optional(),
  notes: z.string().nullable().optional(),
})

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return matter ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matterId: string; slotId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, slotId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = updateSlotSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes

  await db.update(documentSlots).set(updates)
    .where(and(eq(documentSlots.id, slotId), eq(documentSlots.matterId, matterId)))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matterId: string; slotId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId, slotId } = await params
  const matter = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.delete(documentSlots)
    .where(and(eq(documentSlots.id, slotId), eq(documentSlots.matterId, matterId)))

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/api/matters/[matterId]/documents/"
git commit -m "feat: add document slots API routes (GET, POST, PATCH, DELETE)"
```

---

## Task 5: PartiesPanel component

**Files:**
- Create: `components/parties-panel.tsx`

Self-contained component: fetches its own data, manages add/delete state, no props except `matterId`.

- [ ] **Step 1: Create `components/parties-panel.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Users } from "lucide-react"

type Party = {
  id: string
  role: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
}

const ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "buyers_agent", label: "Buyer's Agent" },
  { value: "listing_agent", label: "Listing Agent" },
  { value: "lender", label: "Lender" },
  { value: "other", label: "Other" },
]

function roleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label ?? role
}

export default function PartiesPanel({ matterId }: { matterId: string }) {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ role: "buyer", name: "", email: "", phone: "", company: "" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/parties`)
      .then(r => r.json())
      .then(d => setParties(d.parties ?? []))
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/matters/${matterId}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
      }),
    })
    const data = await res.json()
    if (data.party) {
      setParties(prev => [...prev, data.party])
      setForm({ role: "buyer", name: "", email: "", phone: "", company: "" })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(partyId: string) {
    setParties(prev => prev.filter(p => p.id !== partyId))
    await fetch(`/api/matters/${matterId}/parties/${partyId}`, { method: "DELETE" })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Parties</span>
          {parties.length > 0 && (
            <span className="text-xs text-muted-foreground">({parties.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {showForm && (
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="Full name"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(603) 555-0100"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="Firm name"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {saving ? "Adding..." : "Add party"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="border-t border-border px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && parties.length === 0 && !showForm && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No parties added yet.</p>
        </div>
      )}

      {!loading && parties.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {parties.map(party => (
            <div
              key={party.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-primary uppercase">{party.role.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{party.name}</p>
                  <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wide shrink-0">
                    {roleLabel(party.role)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {party.email && (
                    <a href={`mailto:${party.email}`} className="text-[10px] text-primary hover:underline truncate">
                      {party.email}
                    </a>
                  )}
                  {party.phone && (
                    <span className="text-[10px] text-muted-foreground">{party.phone}</span>
                  )}
                  {party.company && (
                    <span className="text-[10px] text-muted-foreground/60 truncate">{party.company}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(party.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `components/parties-panel.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add components/parties-panel.tsx
git commit -m "feat: add PartiesPanel component"
```

---

## Task 6: DocumentSlotsPanel component

**Files:**
- Create: `components/document-slots-panel.tsx`

Status cycles: pending → received → waived → pending. Slots are grouped by category. The status button is clickable and cycles through states with visual color coding.

- [ ] **Step 1: Create `components/document-slots-panel.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type DocumentSlot = {
  id: string
  label: string
  category: string
  status: string
  notes: string | null
  sortOrder: number
}

const CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "title", label: "Title" },
  { value: "lender", label: "Lender" },
  { value: "hoa", label: "HOA" },
  { value: "misc", label: "Misc" },
]

const STATUS_CYCLE = ["pending", "received", "waived"] as const

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  received: "bg-green-50 text-green-700 border-green-200",
  waived: "bg-muted text-muted-foreground border-border",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  received: "Received",
  waived: "Waived",
}

export default function DocumentSlotsPanel({ matterId }: { matterId: string }) {
  const [slots, setSlots] = useState<DocumentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: "", category: "contract" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/documents`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleAdd() {
    if (!form.label.trim()) return
    setSaving(true)
    const res = await fetch(`/api/matters/${matterId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: form.label.trim(), category: form.category }),
    })
    const data = await res.json()
    if (data.slot) {
      setSlots(prev => [...prev, data.slot])
      setForm({ label: "", category: "contract" })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function cycleStatus(slot: DocumentSlot) {
    const idx = STATUS_CYCLE.indexOf(slot.status as typeof STATUS_CYCLE[number])
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: next } : s))
    await fetch(`/api/matters/${matterId}/documents/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  async function handleDelete(slotId: string) {
    setSlots(prev => prev.filter(s => s.id !== slotId))
    await fetch(`/api/matters/${matterId}/documents/${slotId}`, { method: "DELETE" })
  }

  const receivedCount = slots.filter(s => s.status === "received").length

  const grouped = CATEGORIES.reduce<Record<string, DocumentSlot[]>>((acc, cat) => {
    const items = slots.filter(s => s.category === cat.value)
    if (items.length > 0) acc[cat.value] = items
    return acc
  }, {})

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Documents</span>
          {slots.length > 0 && (
            <span className="text-xs text-muted-foreground">({receivedCount}/{slots.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {showForm && (
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Document Name *</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Purchase & Sale Agreement"
                autoFocus
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.label.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {saving ? "Adding..." : "Add document"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="border-t border-border px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && slots.length === 0 && !showForm && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No documents tracked yet.</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="border-t border-border">
          {CATEGORIES.filter(c => grouped[c.value]).map(cat => (
            <div key={cat.value}>
              <div className="px-5 py-2 bg-muted/20 border-b border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {cat.label}
                </p>
              </div>
              {grouped[cat.value].map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors group"
                >
                  <button
                    onClick={() => cycleStatus(slot)}
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wide transition-colors",
                      STATUS_STYLES[slot.status] ?? STATUS_STYLES.pending
                    )}
                  >
                    {STATUS_LABELS[slot.status] ?? slot.status}
                  </button>
                  <span className="flex-1 text-xs text-foreground truncate">{slot.label}</span>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `components/document-slots-panel.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add components/document-slots-panel.tsx
git commit -m "feat: add DocumentSlotsPanel component"
```

---

## Task 7: Wire panels into matter detail page

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

Add the two new panels between the Tools grid and the Checklist. Both panels only need `matterId` as a prop — they handle their own data fetching.

- [ ] **Step 1: Add imports**

Open `app/(dashboard)/matters/[matterId]/page.tsx`. At the top, after the existing imports, add:

```tsx
import PartiesPanel from "@/components/parties-panel"
import DocumentSlotsPanel from "@/components/document-slots-panel"
```

- [ ] **Step 2: Add panels between Tools and Checklist**

In the JSX return, find the comment `{/* Checklist */}` (or the checklist `<div className="bg-card border border-border rounded-xl overflow-hidden">`). Directly before it, add:

```tsx
{/* Parties */}
<div className="mb-6">
  <PartiesPanel matterId={matterId} />
</div>

{/* Document Slots */}
<div className="mb-6">
  <DocumentSlotsPanel matterId={matterId} />
</div>
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Build check**

```bash
cd /Users/patrickmitchell/titlewise && npm run build 2>&1 | tail -20
```

Expected: clean build with no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/matters/[matterId]/page.tsx"
git commit -m "feat: add parties and document slots panels to matter detail page"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Fix broken checklist API calls in matter detail page | Task 1 |
| `matter_parties` DB table | Task 2 |
| `document_slots` DB table | Task 2 |
| Parties CRUD API | Task 3 |
| Document slots CRUD API | Task 4 |
| PartiesPanel UI component | Task 5 |
| DocumentSlotsPanel UI component | Task 6 |
| Panels wired into matter detail page | Task 7 |

**Notes:**
- Tasks 3 and 4 can run in parallel (independent files, no shared state).
- Tasks 5 and 6 can run in parallel.
- Task 7 depends on Tasks 5 and 6 completing first.
- `npm run db:push` in Task 2 requires `DATABASE_URL` in `.env.local` — it will be present since the app already uses Neon.
- The `zod/v4` import path is the correct one for this project (not `zod`).
- `getOwnedMatter` is duplicated across the 4 new API route files by design — DRY would require a shared helper but these files are small and the duplication is intentional to keep each route self-contained and independently readable.
