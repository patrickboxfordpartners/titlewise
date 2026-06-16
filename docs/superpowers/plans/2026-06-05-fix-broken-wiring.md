# Fix Broken Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three broken/unwired features: feature flags that always return null (kills plan-gating), team invite emails that silently fail with a missing `/join` route, and the Status Update send button that requires OAuth instead of falling back to Postmark.

**Architecture:** Three independent fixes. (1) `app/flags.ts` reads the Clerk session and looks up the user's `subscriptionTier` from the DB — two lines of real code replace the stub. (2) `app/api/team/route.ts` replaces the `logger.info` TODO with a Postmark send; `app/join/page.tsx` is created to accept invite tokens and redirect to dashboard. (3) `lib/email/send.ts` adds a Postmark fallback after the OAuth paths so the Status Update "Send" button works for all users.

**Tech Stack:** Next.js 16 App Router, TypeScript, Clerk auth, Drizzle ORM, Postmark (`lib/postmark.ts`), Zod v4.

---

## File Map

### Modified files
- `app/flags.ts` — wire `getUserPlan()` to Clerk + DB
- `app/api/team/route.ts` — send invite email via Postmark instead of logging
- `lib/email/send.ts` — add Postmark fallback when no OAuth tokens

### New files
- `app/join/page.tsx` — team invite acceptance page
- `app/api/team/join/route.ts` — API route to validate token and mark member as accepted

### Untouched
- `lib/plans.ts` — no changes, plan config is correct
- All other routes — no changes

---

## Task 1: Wire feature flags to real subscription data

**Files:**
- Modify: `app/flags.ts`

`getUserPlan()` currently always returns `null`. Fix it to call `auth()` from Clerk (already available server-side in this file's context) and `getOrCreateUser()` to get the DB user, then return `user.subscriptionTier as PlanKey | null`.

- [ ] **Step 1: Read the current file**

```bash
cat /Users/patrickmitchell/titlewise/app/flags.ts
```

Confirm the imports: `flag` from `"flags/next"`, `PLANS` and `PlanKey` from `"@/lib/plans"`. Note what's missing: `auth` and `getOrCreateUser`.

- [ ] **Step 2: Update imports**

Change the imports at the top of `app/flags.ts` from:

```ts
import { flag } from "flags/next";
import { PLANS, type PlanKey } from "@/lib/plans";
```

To:

```ts
import { flag } from "flags/next";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/db/get-user";
import { PLANS, type PlanKey } from "@/lib/plans";
```

- [ ] **Step 3: Replace the getUserPlan stub**

Find:

```ts
async function getUserPlan(): Promise<PlanKey | null> {
  // This will be called server-side. In a real implementation,
  // read from the auth session / DB. For now, return null (free tier).
  // TODO: Wire to Clerk session + Stripe subscription lookup
  return null;
}
```

Replace with:

```ts
async function getUserPlan(): Promise<PlanKey | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await getOrCreateUser(userId);
  const tier = user.subscriptionTier;
  if (tier && tier in PLANS) return tier as PlanKey;
  return null;
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
git add app/flags.ts
git commit -m "fix: wire feature flags to real Stripe subscription tier"
```

---

## Task 2: Send team invite emails via Postmark

**Files:**
- Modify: `app/api/team/route.ts`

Replace the `logger.info` TODO with a real Postmark send. The invite email needs: recipient is the invited email, subject is the invite, body includes the invite URL, sent from `hello@titlewise.app`.

- [ ] **Step 1: Read the current team route**

```bash
cat /Users/patrickmitchell/titlewise/app/api/team/route.ts
```

Find the block near line 99-102:
```ts
const inviteUrl = `${appUrl}/join?token=${token}`
// TODO: Send invite email via SES (for now log the URL)
logger.info("team/invite", `Invite sent to ${email}`, { inviteUrl, owner: user.email })
return NextResponse.json({ success: true, inviteUrl })
```

- [ ] **Step 2: Add Postmark import**

At the top of `app/api/team/route.ts`, after the existing imports, add:

```ts
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"
```

- [ ] **Step 3: Replace the TODO with a real send**

Find the block:
```ts
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"
  const inviteUrl = `${appUrl}/join?token=${token}`

  // TODO: Send invite email via SES (for now log the URL)
  logger.info("team/invite", `Invite sent to ${email}`, { inviteUrl, owner: user.email })

  return NextResponse.json({ success: true, inviteUrl })
```

Replace with:

```ts
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"
  const inviteUrl = `${appUrl}/join?token=${token}`

  const inviterName = user.name || user.email
  const firmName = user.firmName ? ` at ${user.firmName}` : ""

  await postmark.sendEmail({
    From: POSTMARK_FROM_EMAIL,
    To: email,
    Subject: `You've been invited to TitleWise`,
    TextBody: `${inviterName}${firmName} has invited you to join their TitleWise workspace.\n\nAccept your invitation:\n${inviteUrl}\n\nThis link expires if the invitation is revoked.\n\n— TitleWise`,
    HtmlBody: `<p>${inviterName}${firmName} has invited you to join their TitleWise workspace.</p><p><a href="${inviteUrl}" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">Accept Invitation</a></p><p style="color:#888;font-size:12px">This link expires if the invitation is revoked.</p>`,
    MessageStream: "outbound",
  })

  return NextResponse.json({ success: true, inviteUrl })
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add app/api/team/route.ts
git commit -m "fix: send team invite emails via Postmark instead of logging"
```

---

## Task 3: Create the team invite join API and page

**Files:**
- Create: `app/api/team/join/route.ts`
- Create: `app/join/page.tsx`

The `/join?token=` route is referenced in invite emails but doesn't exist. The flow: user clicks link → `app/join/page.tsx` calls `POST /api/team/join` with the token → API validates token, marks member accepted, creates/links the user → page redirects to `/dashboard` (which redirects to `/matters`).

- [ ] **Step 1: Create the join API route**

```bash
mkdir -p /Users/patrickmitchell/titlewise/app/api/team/join
```

Create `app/api/team/join/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { teamMembers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateUser } from "@/lib/db/get-user"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }) }

  const token = (body as { token?: string }).token
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const [invite] = await db.select().from(teamMembers)
    .where(eq(teamMembers.inviteToken, token))
    .limit(1)

  if (!invite) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
  if (invite.status === "revoked") return NextResponse.json({ error: "This invitation has been revoked" }, { status: 410 })
  if (invite.status === "accepted") return NextResponse.json({ ok: true, alreadyAccepted: true })

  const user = await getOrCreateUser(userId)

  await db.update(teamMembers)
    .set({ status: "accepted", joinedUserId: user.id, acceptedAt: new Date() })
    .where(eq(teamMembers.inviteToken, token))

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create the join page**

```bash
mkdir -p /Users/patrickmitchell/titlewise/app/join
```

Create `app/join/page.tsx`:

```tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid invitation link.")
      return
    }

    fetch("/api/team/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok || data.alreadyAccepted) {
          setStatus("success")
          setTimeout(() => router.push("/matters"), 1500)
        } else {
          setStatus("error")
          setMessage(data.error ?? "Failed to accept invitation.")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      })
  }, [token, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Accepting invitation...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to TitleWise</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to your workspace...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Invitation Error</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <a href="/sign-in" className="mt-4 inline-block text-xs text-primary hover:underline">
              Go to sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  )
}
```

- [ ] **Step 3: Add /join to Clerk public routes**

Open `middleware.ts`. The `isPublicRoute` matcher must include `/join(.*)` so unauthenticated users can land on the join page and be redirected to sign in first.

Find the current list:
```ts
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/stripe/webhook",
  "/api/postmark/inbound",
  "/matter-portal(.*)",
  "/api/checklist/portal",
  "/join(.*)",
])
```

`/join(.*)` is already in the list (added previously). Verify it's there:

```bash
grep "join" /Users/patrickmitchell/titlewise/middleware.ts
```

If it's missing, add `"/join(.*)"` to the matcher list.

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add app/api/team/join/ app/join/
git commit -m "feat: add team invite join route and acceptance page"
```

---

## Task 4: Add Postmark fallback to email send

**Files:**
- Modify: `lib/email/send.ts`

Currently `sendEmail()` throws `"No email account connected"` if the user hasn't connected Gmail or Outlook. Most attorneys won't go through OAuth setup. Add a Postmark fallback as the third option — sends from `hello@titlewise.app` with `Reply-To` set to the user's stored email.

- [ ] **Step 1: Read the current file**

```bash
cat /Users/patrickmitchell/titlewise/lib/email/send.ts
```

Confirm the current shape: imports `getGmailAccessToken`, `sendViaGmail`, `getOutlookAccessToken`, `sendViaOutlook`. Falls through to `throw new Error("No email account connected")` if neither OAuth token exists.

- [ ] **Step 2: Add Postmark import**

After the existing imports, add:

```ts
import { postmark, POSTMARK_FROM_EMAIL } from "@/lib/postmark"
```

- [ ] **Step 3: Replace the throw with a Postmark fallback**

Find:

```ts
  throw new Error("No email account connected")
```

Replace with:

```ts
  // Fallback: send via Postmark from hello@titlewise.app
  // Reply-To is set to user's email so replies come back to them
  await postmark.sendEmail({
    From: POSTMARK_FROM_EMAIL,
    To: to,
    ReplyTo: user.email,
    Subject: subject,
    TextBody: body,
    MessageStream: "outbound",
  })
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Build check**

```bash
cd /Users/patrickmitchell/titlewise && npm run build 2>&1 | tail -15
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
cd /Users/patrickmitchell/titlewise
git add lib/email/send.ts
git commit -m "fix: add Postmark fallback to email send when no OAuth connected"
```

---

## Self-Review

**Spec coverage:**

| Fix | Task |
|---|---|
| Feature flags always return null | Task 1 |
| Team invite email never sends | Task 2 |
| `/join` route doesn't exist | Task 3 |
| Team join API doesn't exist | Task 3 |
| Status Update send requires OAuth | Task 4 |

**Notes:**
- Tasks 1, 2, 3, 4 are fully independent and can run in parallel.
- Task 3 Step 3 checks whether `/join(.*)` is already in `middleware.ts` — it was added in a previous session along with `/matter-portal`. If it's already there, the step is a no-op.
- The `user.firmName` field used in Task 2 comes from `getOrCreateUser()` which returns the full `User` type — `firmName` is a nullable column on the `users` table, confirmed in `lib/db/schema.ts`.
- The Postmark fallback in Task 4 uses `user.email` as `Reply-To`. This means replies to status update emails land in the attorney's inbox (their Clerk email), not the matter thread. This is correct behavior — the matter thread is for emails explicitly routed to `matter-{id}@titlewise.app`. Status update emails are one-directional unless the attorney has configured per-matter routing.
- Task 3's join page calls `/api/team/join` while authenticated. If the user isn't signed in, Clerk middleware will redirect them to `/sign-in` first (the `/join` page itself is public, but `/api/team/join` requires auth). This is correct behavior — invite accepts require a signed-in account.
