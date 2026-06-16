# Email Threading Per Matter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each matter a dedicated email inbox (`matter-{shortId}@titlewise.app`) so all correspondence is threaded on the matter detail page, with the ability to reply without leaving titlewise.

**Architecture:** Each matter's inbox address is derived deterministically from its ID (`matter-{id.slice(0,8)}@titlewise.app`) — no extra column needed. Postmark inbound webhook fires on every email to `*@titlewise.app`; the handler parses the `To` address, resolves the matter, and stores the email in a new `email_threads` table. Outbound replies use Postmark directly (`hello@titlewise.app` as From, matter address as Reply-To). A self-contained `EmailThreadsPanel` component handles display and compose on the matter detail page.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Neon PostgreSQL, Postmark (server SDK + inbound webhook), Clerk auth, Zod v4, Lucide React, Tailwind CSS 4.

---

## File Map

### New files
- `lib/db/schema.ts` — add `emailThreads` table and exported types (modify)
- `app/api/postmark/inbound/route.ts` — Postmark inbound webhook handler (no auth, verifies token from header)
- `app/api/matters/[matterId]/emails/route.ts` — GET thread list, POST send reply
- `components/email-threads-panel.tsx` — self-contained panel for matter detail page
- `scripts/update-postmark-webhook.ts` — one-shot script to point Postmark inbound webhook at the new URL

### Modified files
- `lib/db/schema.ts` — add `emailThreads` table
- `app/(dashboard)/matters/[matterId]/page.tsx` — add `<EmailThreadsPanel>` between Documents and Checklist
- `.env.local` — add `POSTMARK_INBOUND_WEBHOOK_SECRET` (already has placeholder)

### Untouched
- `lib/postmark.ts` — no changes, use as-is
- All other API routes — no changes

---

## Task 1: Add email_threads schema and migrate

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Read the end of the schema file**

```bash
tail -30 /Users/patrickmitchell/titlewise/lib/db/schema.ts
```

Confirm the last table before the type exports block is `documentSlots`.

- [ ] **Step 2: Add `emailThreads` table**

In `lib/db/schema.ts`, immediately after the `documentSlots` table definition and before the type exports block, add:

```ts
export const emailThreads = pgTable("email_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  matterId: uuid("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // "inbound" | "outbound"
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  messageId: text("message_id").unique(), // Postmark message ID for dedup
  inReplyTo: text("in_reply_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_threads_matter_id").on(table.matterId),
  index("idx_email_threads_created").on(table.createdAt),
])
```

- [ ] **Step 3: Add type exports**

After the `emailThreads` table, add:

```ts
export type EmailThread = typeof emailThreads.$inferSelect
export type NewEmailThread = typeof emailThreads.$inferInsert
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Push schema**

```bash
cd /Users/patrickmitchell/titlewise && npm run db:push 2>&1 | tail -20
```

Type `y` if prompted. Expected: confirms `email_threads` table created.

- [ ] **Step 6: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add lib/db/schema.ts
git commit -m "feat: add email_threads schema table"
```

---

## Task 2: Postmark inbound webhook handler

**Files:**
- Create: `app/api/postmark/inbound/route.ts`

This endpoint receives POST requests from Postmark whenever an email arrives at `*@titlewise.app`. It:
1. Optionally verifies `X-Postmark-Signature` header against `POSTMARK_INBOUND_WEBHOOK_SECRET` (skip if secret is empty for now)
2. Parses the `ToFull[0].Email` field to extract the matter short ID from `matter-{shortId}@titlewise.app`
3. Looks up the matter by `id LIKE '{shortId}%'` — the first 8 chars of the UUID
4. Finds the matter's owner userId
5. Stores the email in `email_threads` with `direction: "inbound"`
6. Returns 200 immediately (Postmark retries on non-2xx)

**Important:** The `To` address may be `matter-abc12345@titlewise.app`. The `matterId` short prefix is the first 8 characters of the UUID. Use `LIKE '{prefix}%'` to find it.

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/patrickmitchell/titlewise/app/api/postmark/inbound
```

- [ ] **Step 2: Create `app/api/postmark/inbound/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { matters, emailThreads } from "@/lib/db/schema"
import { eq, like } from "drizzle-orm"

// Postmark inbound payload shape (partial — only fields we use)
type PostmarkInbound = {
  From: string
  FromFull: { Email: string; Name: string }
  ToFull: { Email: string; Name: string }[]
  Subject: string
  TextBody: string | null
  HtmlBody: string | null
  MessageID: string
  ReplyTo: string | null
  InReplyTo: string | null
  Headers: { Name: string; Value: string }[]
}

function extractShortId(toEmail: string): string | null {
  // Matches matter-{8chars}@titlewise.app
  const match = toEmail.match(/^matter-([a-f0-9-]{8,}?)@/i)
  return match ? match[1].slice(0, 8) : null
}

export async function POST(req: NextRequest) {
  // Verify secret if configured
  const secret = process.env.POSTMARK_INBOUND_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get("x-postmark-signature")
    if (sig !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  let payload: PostmarkInbound
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const toEmail = payload.ToFull?.[0]?.Email ?? ""
  const shortId = extractShortId(toEmail)

  if (!shortId) {
    // Not a matter address — ignore
    return NextResponse.json({ ok: true })
  }

  // Find matter by first 8 chars of UUID
  const [matter] = await db.select()
    .from(matters)
    .where(like(matters.id, `${shortId}%`))
    .limit(1)

  if (!matter) {
    // No matching matter — accept and discard (don't let Postmark retry)
    return NextResponse.json({ ok: true })
  }

  // Dedup by messageId
  if (payload.MessageID) {
    const existing = await db.select({ id: emailThreads.id })
      .from(emailThreads)
      .where(eq(emailThreads.messageId, payload.MessageID))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ ok: true })
    }
  }

  await db.insert(emailThreads).values({
    matterId: matter.id,
    userId: matter.userId,
    direction: "inbound",
    fromAddress: payload.From,
    toAddress: toEmail,
    subject: payload.Subject ?? "(no subject)",
    bodyText: payload.TextBody ?? null,
    bodyHtml: payload.HtmlBody ?? null,
    messageId: payload.MessageID ?? null,
    inReplyTo: payload.InReplyTo ?? null,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add app/api/postmark/
git commit -m "feat: add Postmark inbound webhook handler"
```

---

## Task 3: Emails API route for matter

**Files:**
- Create: `app/api/matters/[matterId]/emails/route.ts`

GET returns the thread for the matter. POST sends an outbound reply via Postmark and stores the sent email.

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/patrickmitchell/titlewise/app/api/matters/[matterId]/emails
```

- [ ] **Step 2: Create `app/api/matters/[matterId]/emails/route.ts`**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { db } from "@/lib/db"
import { matters, emailThreads } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

function matterInboxAddress(matterId: string): string {
  return `matter-${matterId.slice(0, 8)}@titlewise.app`
}

async function getOwnedMatter(matterId: string, userId: string) {
  const user = await getOrCreateUser(userId)
  const [matter] = await db.select().from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.userId, user.id)))
    .limit(1)
  return { matter: matter ?? null, user }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const { matter } = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const emails = await db.select().from(emailThreads)
    .where(eq(emailThreads.matterId, matterId))
    .orderBy(asc(emailThreads.createdAt))

  const inboxAddress = matterInboxAddress(matterId)
  return NextResponse.json({ emails, inboxAddress })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matterId } = await params
  const { matter, user } = await getOwnedMatter(matterId, userId)
  if (!matter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const inboxAddress = matterInboxAddress(matterId)
  const fromName = user.name ? `${user.name} via TitleWise` : "TitleWise"

  const result = await postmark.sendEmail({
    From: `${fromName} <${POSTMARK_FROM_EMAIL}>`,
    To: parsed.data.to,
    ReplyTo: inboxAddress,
    Subject: parsed.data.subject,
    TextBody: parsed.data.body,
    MessageStream: "outbound",
  })

  await db.insert(emailThreads).values({
    matterId,
    userId: user.id,
    direction: "outbound",
    fromAddress: POSTMARK_FROM_EMAIL,
    toAddress: parsed.data.to,
    subject: parsed.data.subject,
    bodyText: parsed.data.body,
    bodyHtml: null,
    messageId: result.MessageID ?? null,
    inReplyTo: null,
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/api/matters/[matterId]/emails/"
git commit -m "feat: add matter emails API (GET thread, POST send)"
```

---

## Task 4: EmailThreadsPanel component

**Files:**
- Create: `components/email-threads-panel.tsx`

Self-contained component. Fetches thread from `GET /api/matters/[matterId]/emails`. Shows emails in chronological order with direction indicators. Has a compose/reply button that opens an inline compose form and POSTs to `POST /api/matters/[matterId]/emails`.

- [ ] **Step 1: Create `components/email-threads-panel.tsx`**

```tsx
"use client"

import { useState, useEffect } from "react"
import { Mail, Send, Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type EmailItem = {
  id: string
  direction: string
  fromAddress: string
  toAddress: string
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  createdAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function EmailRow({ email }: { email: EmailItem }) {
  const [expanded, setExpanded] = useState(false)
  const isInbound = email.direction === "inbound"

  return (
    <div className={cn("border-b border-border/50 last:border-0", isInbound ? "bg-card" : "bg-primary/3")}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/10 transition-colors text-left"
      >
        <div className={cn("mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          isInbound ? "bg-blue-100" : "bg-primary/10"
        )}>
          <Mail className={cn("h-2.5 w-2.5", isInbound ? "text-blue-600" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {isInbound ? email.fromAddress : `To: ${email.toAddress}`}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground">{formatDate(email.createdAt)}</span>
              {expanded
                ? <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
                : <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
              }
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.subject}</p>
          {!expanded && email.bodyText && (
            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{email.bodyText.slice(0, 100)}</p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-1">
          <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
            {email.bodyHtml ? (
              <div
                className="text-xs text-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{email.bodyText}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmailThreadsPanel({ matterId }: { matterId: string }) {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [inboxAddress, setInboxAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ to: "", subject: "", body: "" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/emails`)
      .then(r => r.json())
      .then(d => {
        setEmails(d.emails ?? [])
        setInboxAddress(d.inboxAddress ?? "")
      })
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleSend() {
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) return
    setSending(true)
    setSendError("")
    const res = await fetch(`/api/matters/${matterId}/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: form.to.trim(), subject: form.subject.trim(), body: form.body.trim() }),
    })
    const data = await res.json()
    if (data.ok) {
      setEmails(prev => [...prev, {
        id: crypto.randomUUID(),
        direction: "outbound",
        fromAddress: "hello@titlewise.app",
        toAddress: form.to.trim(),
        subject: form.subject.trim(),
        bodyText: form.body.trim(),
        bodyHtml: null,
        createdAt: new Date().toISOString(),
      }])
      setForm({ to: "", subject: "", body: "" })
      setShowCompose(false)
    } else {
      setSendError(data.error ?? "Send failed")
    }
    setSending(false)
  }

  function copyInbox() {
    navigator.clipboard.writeText(inboxAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Email Thread</span>
          {emails.length > 0 && (
            <span className="text-xs text-muted-foreground">({emails.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inboxAddress && (
            <button
              onClick={copyInbox}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              title={inboxAddress}
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? "Copied" : inboxAddress.split("@")[0]}</span>
            </button>
          )}
          <button
            onClick={() => setShowCompose(v => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <div className="space-y-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">To *</label>
              <input
                type="email"
                value={form.to}
                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                placeholder="recipient@example.com"
                autoFocus
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Re: Closing update for..."
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Type your message here..."
                rows={4}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 resize-none"
              />
            </div>
          </div>
          {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending || !form.to.trim() || !form.subject.trim() || !form.body.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {sending ? "Sending..." : "Send email"}
            </button>
            <button
              onClick={() => { setShowCompose(false); setSendError("") }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Replies to this email will be forwarded to {inboxAddress || "this matter's inbox"}.
          </p>
        </div>
      )}

      {/* Thread */}
      {loading && (
        <div className="border-t border-border px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && emails.length === 0 && !showCompose && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No emails yet.</p>
          {inboxAddress && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Share <span className="font-mono">{inboxAddress}</span> with parties so replies land here automatically.
            </p>
          )}
        </div>
      )}

      {!loading && emails.length > 0 && (
        <div className="border-t border-border">
          {emails.map(email => (
            <EmailRow key={email.id} email={email} />
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

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add components/email-threads-panel.tsx
git commit -m "feat: add EmailThreadsPanel component"
```

---

## Task 5: Wire panel into matter detail page

**Files:**
- Modify: `app/(dashboard)/matters/[matterId]/page.tsx`

- [ ] **Step 1: Add import**

Open `app/(dashboard)/matters/[matterId]/page.tsx`. After the existing panel imports (`PartiesPanel`, `DocumentSlotsPanel`), add:

```tsx
import EmailThreadsPanel from "@/components/email-threads-panel"
```

- [ ] **Step 2: Insert panel between Documents and Checklist**

Find the `{/* Document Slots */}` block:
```tsx
{/* Document Slots */}
<div className="mb-6">
  <DocumentSlotsPanel matterId={matterId} />
</div>
```

Directly AFTER it (and before `{/* Checklist */}`), add:

```tsx
{/* Email Thread */}
<div className="mb-6">
  <EmailThreadsPanel matterId={matterId} />
</div>
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Build check**

```bash
cd /Users/patrickmitchell/titlewise && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add "app/(dashboard)/matters/[matterId]/page.tsx"
git commit -m "feat: add email thread panel to matter detail page"
```

---

## Task 6: Update Postmark inbound webhook URL

**Files:**
- Create: `scripts/update-postmark-webhook.ts` (run once, then delete)

The Postmark inbound webhook currently points to an old Supabase URL. This script updates it to `https://titlewise.app/api/postmark/inbound` using the Postmark API.

- [ ] **Step 1: Create `scripts/update-postmark-webhook.ts`**

```ts
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY
if (!POSTMARK_API_KEY) throw new Error("POSTMARK_API_KEY required")

const res = await fetch("https://api.postmarkapp.com/server", {
  method: "PUT",
  headers: {
    "X-Postmark-Account-Token": POSTMARK_API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify({
    InboundHookUrl: "https://titlewise.app/api/postmark/inbound",
  }),
})

const data = await res.json()
console.log("Updated:", JSON.stringify(data, null, 2))
```

- [ ] **Step 2: Run the script**

```bash
cd /Users/patrickmitchell/titlewise && POSTMARK_API_KEY=3ee3632d-8656-47c7-b24c-53ce5ec4b2d5 npx tsx scripts/update-postmark-webhook.ts 2>&1
```

Expected: JSON response showing `InboundHookUrl: "https://titlewise.app/api/postmark/inbound"`.

Note: Postmark Server API uses `X-Postmark-Server-Token` for most endpoints, but updating server settings uses `X-Postmark-Account-Token`. If this returns 401, try replacing the header name with `X-Postmark-Server-Token`.

- [ ] **Step 3: Verify the update**

```bash
curl -s -H "X-Postmark-Server-Token: 3ee3632d-8656-47c7-b24c-53ce5ec4b2d5" https://api.postmarkapp.com/server | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('InboundHookUrl'))"
```

Expected: `https://titlewise.app/api/postmark/inbound`

- [ ] **Step 4: Add Postmark env to Vercel**

```bash
cd /Users/patrickmitchell/titlewise && npx vercel env add POSTMARK_API_KEY production
```

When prompted for the value, enter: `3ee3632d-8656-47c7-b24c-53ce5ec4b2d5`

Then:
```bash
npx vercel env add POSTMARK_FROM_EMAIL production
```
Value: `hello@titlewise.app`

- [ ] **Step 5: Commit and delete script**

```bash
cd /Users/patrickmitchell/titlewise
rm scripts/update-postmark-webhook.ts
git add -A
git commit -m "chore: update Postmark inbound webhook to titlewise route"
```

---

## Task 7: Deploy and smoke test

- [ ] **Step 1: Push to production**

```bash
cd /Users/patrickmitchell/titlewise && git push origin main
```

- [ ] **Step 2: Send a test email to a matter inbox**

Pick any matter ID from the DB (or use the Vercel logs to find one). The first 8 chars of a UUID like `550e8400-e29b-41d4-a716-446655440000` gives `550e8400`.

Send a test email to `matter-{shortId}@titlewise.app` from any email client (e.g. your personal Gmail). Wait 30 seconds, then open the matter in titlewise — the email should appear in the Email Thread panel.

- [ ] **Step 3: Verify outbound reply**

From the matter detail page, use the "Send" button in the Email Thread panel to send an outbound email. Confirm:
- Email arrives at the recipient
- The thread panel shows the outbound email immediately (optimistic add)
- Reply-To header is `matter-{shortId}@titlewise.app` (verify in received email headers)

- [ ] **Step 4: Tag release**

```bash
cd /Users/patrickmitchell/titlewise && git tag v-email-threading
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| `email_threads` DB table | Task 1 |
| Postmark inbound webhook handler | Task 2 |
| Matter emails GET/POST API | Task 3 |
| EmailThreadsPanel component | Task 4 |
| Panel wired into matter detail page | Task 5 |
| Postmark webhook URL updated | Task 6 |
| Deploy + smoke test | Task 7 |

**Key notes:**
- `extractShortId` in the webhook uses `match[1].slice(0, 8)` — UUIDs start with 8 hex chars before the first `-`, so `like(matters.id, '${shortId}%')` correctly matches the UUID prefix.
- The `X-Postmark-Account-Token` vs `X-Postmark-Server-Token` distinction: server settings (`/server` PUT) requires Account Token on some Postmark tiers. If Task 6 Step 2 returns 401, swap the header. The API key `3ee3632d-...` is a Server API Token.
- Outbound emails use `MessageStream: "outbound"` — required for Postmark transactional sends.
- The `dangerouslySetInnerHTML` in `EmailRow` is intentional for HTML emails, consistent with mailboxford's `DOMPurify` pattern. However, titlewise currently has no DOMPurify — for now the risk is low since only inbound emails from external senders get HTML rendered, and titlewise is a single-tenant tool. A follow-up should add DOMPurify.
- `POSTMARK_INBOUND_WEBHOOK_SECRET` is optional (webhook verifies if set). Task 6 leaves it empty; it can be added later once Postmark's credential UI exposes it.
- Tasks 1–5 are code-only and can be done before Task 6 (infra). Tasks 3–5 can run in parallel after Task 1 and 2 complete.
