# Matter Workspace Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the four disconnected or missing matter-workspace features: portal token generation, matter reopen, checklist auto-populate in Status Update, and dashboard redirect.

**Architecture:** Four independent changes — no new tables, no new dependencies. Each task modifies 1–2 files. The checklist auto-populate adds a `useEffect` to the matter detail page that fetches items when the Status Update tool card is clicked, encoding them as search params. The portal button becomes a toggle (generate if none, copy if exists). The PATCH route gets a `reopen` action. The dashboard page becomes a redirect.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Zod v4, Drizzle ORM.

---

## File Map

### Modified files
- `app/api/checklist/[matterId]/route.ts` — add `action: "reopen"` discriminator to PATCH handler
- `app/(dashboard)/matters/[matterId]/page.tsx` — (1) replace portal copy-only button with generate+copy toggle, (2) add reopen button for closed matters, (3) encode checklist items into Status Update URL
- `app/(dashboard)/dashboard/page.tsx` — replace with redirect to `/matters`

### Untouched
- All other API routes
- All components
- `lib/db/schema.ts`

---

## Task 1: Add reopen action to checklist PATCH route

**Files:**
- Modify: `app/api/checklist/[matterId]/route.ts`

The PATCH route already handles `action: "close"`. Add `action: "reopen"` the same way, setting `status: "active"`.

- [ ] **Step 1: Read the file**

```bash
cat /Users/patrickmitchell/titlewise/app/api/checklist/\[matterId\]/route.ts
```

Note that:
- `closeMatterSchema` is defined as `z.object({ action: z.literal("close") })`
- The close handler sets `status: "closed"` and `updatedAt: new Date()`
- The close block is checked before the `updateItemSchema` fallback

- [ ] **Step 2: Add reopenMatterSchema**

After the `closeMatterSchema` definition (after `const closeMatterSchema = z.object({ action: z.literal("close") })`), add:

```ts
const reopenMatterSchema = z.object({
  action: z.literal("reopen"),
})
```

- [ ] **Step 3: Add reopen handler in the PATCH body**

After the close matter block (after `return NextResponse.json({ ok: true })` for the close case), add:

```ts
  // Reopen matter
  const reopenParsed = reopenMatterSchema.safeParse(body)
  if (reopenParsed.success) {
    await db.update(matters).set({ status: "active", updatedAt: new Date() }).where(eq(matters.id, matterId))
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
git add "app/api/checklist/[matterId]/route.ts"
git commit -m "feat: add reopen action to matter PATCH route"
```

---

## Task 2: Portal generation + reopen button on matter detail page

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

Three changes to this file:
1. The portal button currently shows only when `matter.portalToken` exists (copy-only). Change it: when no token, show a "Share" button that calls `POST /api/checklist/portal?matterId=` to generate one, then copies the URL. When a token exists, show the copy button as before.
2. Add a "Reopen" button that appears when `matter.status === "closed"` (mirroring the existing "Close matter" button logic).
3. Update the Status Update tool card URL to encode checklist items.

**Change 1 and 2 are in the same JSX block (the matter header actions). Change 3 is in `matterQueryParams`.**

- [ ] **Step 1: Read the current state/handler declarations**

```bash
sed -n '65,155p' "/Users/patrickmitchell/titlewise/app/(dashboard)/matters/[matterId]/page.tsx"
```

Identify: `useState` declarations, `closeMatter()`, `copyPortalUrl()`, and where the action buttons are rendered.

- [ ] **Step 2: Add state and handler for portal generation**

Find the existing state declarations (the `useState` block near the top of the component). After `const [closingMatter, setClosingMatter] = useState(false)`, add:

```tsx
const [generatingPortal, setGeneratingPortal] = useState(false)
```

After the existing `copyPortalUrl()` function, add a new `generatePortal()` function:

```tsx
async function generatePortal() {
  setGeneratingPortal(true)
  const res = await fetch(`/api/checklist/portal?matterId=${matterId}`, { method: "POST" })
  const data = await res.json()
  if (data.url) {
    setMatter((prev) => prev ? { ...prev, portalToken: data.token } : prev)
    navigator.clipboard.writeText(data.url)
    setPortalCopied(true)
    setTimeout(() => setPortalCopied(false), 2000)
  }
  setGeneratingPortal(false)
}
```

- [ ] **Step 3: Add state and handler for reopen**

After `const [closingMatter, setClosingMatter] = useState(false)`, also add:

```tsx
const [reopeningMatter, setReopeningMatter] = useState(false)
```

After the existing `closeMatter()` function, add:

```tsx
async function reopenMatter() {
  setReopeningMatter(true)
  await fetch(`/api/checklist/${matterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reopen" }),
  })
  setMatter((prev) => prev ? { ...prev, status: "active" } : prev)
  setReopeningMatter(false)
}
```

- [ ] **Step 4: Update the portal button in the JSX**

Find the current portal button block:

```tsx
{matter.portalToken && (
  <button
    onClick={copyPortalUrl}
    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
  >
    {portalCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
    {portalCopied ? "Copied" : "Portal"}
  </button>
)}
```

Replace with:

```tsx
{matter.portalToken ? (
  <button
    onClick={copyPortalUrl}
    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
  >
    {portalCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
    {portalCopied ? "Copied" : "Portal"}
  </button>
) : (
  <button
    onClick={generatePortal}
    disabled={generatingPortal}
    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-60"
  >
    {generatingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
    {generatingPortal ? "Generating..." : "Share portal"}
  </button>
)}
```

- [ ] **Step 5: Update the close/reopen button in the JSX**

Find the current close button:

```tsx
{matter.status === "active" && (
  <button
    onClick={closeMatter}
    disabled={closingMatter}
    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
  >
    {closingMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Close matter"}
  </button>
)}
```

Replace with:

```tsx
{matter.status === "active" ? (
  <button
    onClick={closeMatter}
    disabled={closingMatter}
    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
  >
    {closingMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Close matter"}
  </button>
) : (
  <button
    onClick={reopenMatter}
    disabled={reopeningMatter}
    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
  >
    {reopeningMatter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reopen"}
  </button>
)}
```

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If `setMatter` is not typed to accept a function updater (i.e. `Matter | null` not `(prev: Matter | null) => Matter | null`), the updater pattern will fail — in that case use `setMatter({ ...matter, portalToken: data.token })` and `setMatter({ ...matter, status: "active" })` instead (matter is guaranteed non-null at this point in the render).

- [ ] **Step 7: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/matters/[matterId]/page.tsx"
git commit -m "feat: add portal generation and matter reopen to matter detail page"
```

---

## Task 3: Auto-populate Status Update from checklist items

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

When the Status Update tool card is clicked from the matter detail page, `matterQueryParams` builds the URL. Currently it passes `matterId`, `clientName`, `propertyAddress`, `transactionType`, `closingDate` — but NOT `completedItems` or `outstandingItems`. The status update page reads those from search params if present.

The fix: derive `completedItems` and `outstandingItems` from the already-loaded `items` state (the checklist items) and include them in the Status Update URL only. Other tools don't need them.

- [ ] **Step 1: Read the matterQueryParams function and TOOLS array**

```bash
sed -n '37,63p' "/Users/patrickmitchell/titlewise/app/(dashboard)/matters/[matterId]/page.tsx"
```

Confirm the current `matterQueryParams` signature and that the TOOLS array uses it for all 7 tools.

- [ ] **Step 2: Update matterQueryParams to accept optional checklist items**

Find the current function:

```tsx
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
```

Replace with:

```tsx
function matterQueryParams(matter: Matter, checklistItems?: Item[]): string {
  const params = new URLSearchParams({
    matterId: matter.id,
    clientName: matter.clientName,
    propertyAddress: matter.propertyAddress,
    transactionType: matter.transactionType,
  })
  if (matter.closingDate) params.set("closingDate", matter.closingDate.split("T")[0])
  if (checklistItems) {
    const completed = checklistItems
      .filter(i => i.status === "complete")
      .map(i => i.title)
      .join("\n")
    const outstanding = checklistItems
      .filter(i => i.status !== "complete")
      .map(i => i.title)
      .join("\n")
    if (completed) params.set("completedItems", completed)
    if (outstanding) params.set("outstandingItems", outstanding)
  }
  return params.toString()
}
```

- [ ] **Step 3: Pass items to Status Update tool card only**

Find the Tools grid render in the JSX. It currently calls `matterQueryParams(matter)` for every tool:

```tsx
href={`${href}?${matterQueryParams(matter)}`}
```

Change this to pass `items` only when the tool is Status Update:

```tsx
href={`${href}?${matterQueryParams(matter, href === "/status-update" ? items : undefined)}`}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/matters/[matterId]/page.tsx"
git commit -m "feat: auto-populate Status Update with checklist items when launched from matter"
```

---

## Task 4: Redirect /dashboard to /matters

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

The dashboard and the matters list are near-identical status boards. Having both creates confusion. Replace the dashboard page with a server-side redirect to `/matters`. The dashboard link in the sidebar can be removed or kept as an alias — keeping it is fine since the redirect is instant.

- [ ] **Step 1: Overwrite `app/(dashboard)/dashboard/page.tsx`**

Replace the entire file with:

```tsx
import { redirect } from "next/navigation"

export default function DashboardPage() {
  redirect("/matters")
}
```

- [ ] **Step 2: Remove the Dashboard link from the sidebar**

Open `components/sidebar.tsx`. Find the Dashboard nav item (added in a previous session):

```tsx
{/* Dashboard */}
<Link
  href="/dashboard"
  onClick={onClose}
  className={`sidebar-nav-item${isDashboard ? " active" : ""}`}
>
  ...
  Dashboard
</Link>
```

Remove this entire block. Also remove the `isDashboard` variable declaration:

```tsx
const isDashboard = pathname === "/dashboard"
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

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/dashboard/page.tsx" components/sidebar.tsx
git commit -m "feat: redirect /dashboard to /matters, remove duplicate dashboard nav"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Portal token generation button | Task 2 |
| Reopen closed matter (API) | Task 1 |
| Reopen closed matter (UI) | Task 2 |
| Checklist auto-populate in Status Update | Task 3 |
| Dashboard redirect to /matters | Task 4 |

**Notes:**
- Task 1 and Task 2 are sequential (Task 2 calls the `action: "reopen"` endpoint added in Task 1).
- Task 3 is independent of Tasks 1 and 2.
- Task 4 is fully independent.
- The `generatePortal` handler uses `setMatter((prev) => ...)` updater — if the `Matter` type used by `useState` doesn't support the updater form, the note in Task 2 Step 6 provides the fallback.
- The `closingStage` field in the Status Update form is NOT derived from checklist — it's a separate dropdown. The auto-populate only fills `completedItems` and `outstandingItems` which are freeform text areas, mapped from checklist item titles.
- Task 4 removes the Dashboard sidebar link entirely since `/dashboard` now redirects — there's no reason to keep both "Matters" and "Dashboard" pointing to the same page.
