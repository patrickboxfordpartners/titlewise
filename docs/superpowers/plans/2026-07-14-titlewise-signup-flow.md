# TitleWise Signup Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move plan selection before account creation — pricing → sign-up → trial/checkout → dashboard — with a 7-day trial for Solo (3 active matter cap) and immediate Stripe Checkout for paid plans.

**Architecture:** The pricing page links directly to `/sign-up?plan=<tier>`. The sign-up page reads the `plan` param, shows a badge, and passes it through Clerk's `redirectUrl` to a new `/api/auth/post-signup` route. That route either activates a Stripe trial (Solo) or redirects to Stripe Checkout (paid). Existing webhook and flags infrastructure is extended, not replaced.

**Tech Stack:** Next.js 15 App Router, Clerk (`@clerk/nextjs`), Stripe (`stripe`), Drizzle ORM, Neon PostgreSQL, Zod v4, Tailwind CSS, Framer Motion

## Global Constraints

- Zod import: `import { z } from "zod/v4"` — never `"zod"`
- Plan keys: `"solo" | "small_firm" | "pro" | "enterprise"` — underscore, not hyphen
- Clerk server auth: `import { auth } from "@clerk/nextjs/server"`
- Stripe instance: `import { stripe } from "@/lib/stripe"`
- DB: `import { db } from "@/lib/db"`, schema from `@/lib/db/schema`
- Logger: `import { logger } from "@/lib/logger"`
- No `any` unless file already has `@ts-nocheck`
- Straight quotes only

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/(marketing)/pricing/page.tsx` | Modify | Update CTAs to link to `/sign-up?plan=<tier>` |
| `app/sign-up/[[...sign-up]]/page.tsx` | Modify | Read plan param, show badge, redirect to post-signup |
| `app/api/auth/post-signup/route.ts` | Create | Trial activation or Stripe Checkout redirect |
| `app/api/stripe/webhook/route.ts` | Modify | Handle `trial_will_end`, update `isTrial` in `subscription.updated` |
| `app/api/checklist/route.ts` | Modify | Enforce 3-matter cap on POST |
| `app/flags.ts` | Modify | Add `isTrialFlag` and `trialDaysRemainingFlag` |
| `lib/db/get-user.ts` | Modify | Add `getTrialStatus()` helper |
| `components/sidebar.tsx` | Modify | Add trial banner with days-remaining + upgrade CTA |
| `app/(dashboard)/matters/page.tsx` | Modify | Show upgrade prompt when trial cap reached |

---

### Task 1: Update pricing page CTAs

**Files:**
- Modify: `app/(marketing)/pricing/page.tsx`

**Interfaces:**
- Produces: Solo CTA navigates to `/sign-up?plan=solo`, all others to `/sign-up?plan=<tier>`

- [ ] **Step 1: Find the existing CTA buttons in pricing/page.tsx**

Search for the Solo plan CTA. Currently it calls `stripe.checkout` directly. The pattern is a `Button` or `Link` component inside the plan card. Read lines 80–200 of the file to find the exact CTA markup.

```bash
grep -n "Get Started\|Start\|CTA\|href\|onClick\|checkout" app/\(marketing\)/pricing/page.tsx | head -20
```

- [ ] **Step 2: Replace Solo CTA**

Find the Solo plan card CTA and replace it with a Link to `/sign-up?plan=solo`:

```tsx
// Before (whatever the current CTA is — button calling checkout API)
// After:
<Link
  href="/sign-up?plan=solo"
  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
>
  Start 7-Day Free Trial
</Link>
```

- [ ] **Step 3: Replace Small Firm, Pro, Enterprise CTAs**

For each paid plan card, replace the CTA with a Link to `/sign-up?plan=<tier>`:

```tsx
// small_firm:
<Link href="/sign-up?plan=small_firm" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
  Get Started
</Link>

// pro:
<Link href="/sign-up?plan=pro" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
  Get Started
</Link>

// enterprise:
<Link href="/sign-up?plan=enterprise" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
  Get Started
</Link>
```

- [ ] **Step 4: Remove any now-unused checkout state/handlers**

If `pricing/page.tsx` had `useState` for checkout loading or a `handleCheckout` function, remove them. Also remove any `useAuth` import if it's no longer needed.

- [ ] **Step 5: Verify no TypeScript errors**

```bash
cd /Users/patrickmitchell/titlewise && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to pricing/page.tsx

- [ ] **Step 6: Commit**

```bash
git add app/\(marketing\)/pricing/page.tsx
git commit -m "feat: pricing CTAs link to /sign-up?plan= instead of checkout"
```

---

### Task 2: Update sign-up page — plan badge + post-signup redirect

**Files:**
- Modify: `app/sign-up/[[...sign-up]]/page.tsx`

**Interfaces:**
- Consumes: `?plan=solo|small_firm|pro|enterprise` from URL search params
- Produces: Clerk `<SignUp />` with `forceRedirectUrl` pointing to `/api/auth/post-signup?plan=<tier>`; if no plan param, redirects to `/pricing`

- [ ] **Step 1: Add redirect-to-pricing if no plan param**

The sign-up page is a Server Component. Add a check at the top:

```tsx
import { redirect } from "next/navigation"
import { SignUp } from "@clerk/nextjs"
import { Logo } from "@/components/logo"
import { PLANS, type PlanKey } from "@/lib/plans"

const VALID_PLANS: PlanKey[] = ["solo", "small_firm", "pro", "enterprise"]

interface Props {
  searchParams: Promise<{ plan?: string }>
}

export default async function SignUpPage({ searchParams }: Props) {
  const { plan } = await searchParams
  if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
    redirect("/pricing")
  }
  const planKey = plan as PlanKey
  const planName = PLANS[planKey].name
  const isTrial = planKey === "solo"
  // ...
}
```

- [ ] **Step 2: Add plan badge above Clerk widget**

```tsx
return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
    <div className="mb-8">
      <Logo href="/" />
    </div>

    {/* Plan badge */}
    <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/30 text-sm">
      <span className="font-semibold text-foreground">{planName} plan</span>
      {isTrial && (
        <span className="text-muted-foreground">— 7-day free trial</span>
      )}
    </div>

    <SignUp
      forceRedirectUrl={`/api/auth/post-signup?plan=${planKey}`}
    />
  </div>
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "sign-up"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/sign-up/[[...sign-up]]/page.tsx"
git commit -m "feat: sign-up page shows plan badge, redirects to /pricing if no plan param"
```

---

### Task 3: Create `/api/auth/post-signup` route

**Files:**
- Create: `app/api/auth/post-signup/route.ts`

**Interfaces:**
- Consumes: `?plan=<tier>` query param, Clerk session (authenticated user)
- Produces: For solo — creates Stripe customer + trial subscription, updates user record, redirects to `/dashboard`. For paid — creates Stripe Checkout session, redirects to Stripe.

- [ ] **Step 1: Create the route file**

```bash
mkdir -p app/api/auth/post-signup
```

- [ ] **Step 2: Write the route**

```ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { PLANS, type PlanKey } from "@/lib/plans"
import { getOrCreateUser } from "@/lib/db/get-user"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"

const VALID_PLANS: PlanKey[] = ["solo", "small_firm", "pro", "enterprise"]
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://titlewise.app"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", APP_URL))
  }

  const plan = req.nextUrl.searchParams.get("plan") as PlanKey | null
  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.redirect(new URL("/pricing", APP_URL))
  }

  try {
    const user = await getOrCreateUser(userId)

    // Create or reuse Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { clerkId: userId, titlewiseUserId: user.id },
      })
      customerId = customer.id
      await db.update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }

    if (plan === "solo") {
      // Create trial subscription — no payment method required
      const priceId = PLANS.solo.monthlyPriceId
      if (!priceId) {
        logger.error("post-signup", "Solo price ID not configured")
        return NextResponse.redirect(new URL("/pricing", APP_URL))
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: 7,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { clerkId: userId, plan: "solo" },
        expand: ["latest_invoice"],
      })

      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await db.update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          subscriptionTier: "solo",
          subscriptionStatus: "trialing",
          trialEndsAt: trialEnd,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      logger.info("post-signup", "Trial activated", { userId, plan: "solo", trialEnd })
      return NextResponse.redirect(new URL("/dashboard", APP_URL))
    }

    // Paid plan — Stripe Checkout
    const planConfig = PLANS[plan]
    const priceId = planConfig.monthlyPriceId
    if (!priceId) {
      logger.error("post-signup", `Price ID not configured for plan: ${plan}`)
      return NextResponse.redirect(new URL("/pricing", APP_URL))
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?subscribed=true`,
      cancel_url: `${APP_URL}/pricing`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, clerkId: userId },
        description: `TitleWise ${planConfig.name} - ${planConfig.description}`,
      },
      metadata: { clerkId: userId, plan },
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      phone_number_collection: { enabled: true },
      custom_text: {
        submit: { message: "Start your TitleWise subscription today. Cancel anytime." },
      },
    })

    if (!session.url) {
      logger.error("post-signup", "No checkout session URL returned")
      return NextResponse.redirect(new URL("/pricing", APP_URL))
    }

    logger.info("post-signup", "Checkout session created", { userId, plan })
    return NextResponse.redirect(session.url)
  } catch (err) {
    logger.error("post-signup", "Error in post-signup route", { error: String(err) })
    return NextResponse.redirect(new URL("/pricing", APP_URL))
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "post-signup"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/post-signup/route.ts
git commit -m "feat: /api/auth/post-signup — trial activation for solo, checkout for paid plans"
```

---

### Task 4: Update Stripe webhook — handle trial events

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

**Interfaces:**
- Consumes: `customer.subscription.trial_will_end`, extended `customer.subscription.updated` (now also writes `trialEndsAt`, `subscriptionTier`)
- Produces: Updated user record with accurate `subscriptionStatus`, `subscriptionTier`, `trialEndsAt`

- [ ] **Step 1: Add `trial_will_end` handler**

In the `switch` statement, add before the `default` case:

```ts
case "customer.subscription.trial_will_end": {
  const subscription = event.data.object as Stripe.Subscription
  const clerkId = subscription.metadata?.clerkId
  if (!clerkId) break

  // Non-fatal: send reminder email via existing drip system
  try {
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(clerkId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ")
    if (email) {
      await sendDripEmail({ to: email, name, plan: "solo", sequence: "trial_ending" })
    }
  } catch (dripErr) {
    logger.error("stripe/webhook", "Trial ending drip failed (non-fatal)", { error: String(dripErr) })
  }

  logger.info("stripe/webhook", "Trial will end in 3 days", { clerkId })
  break
}
```

- [ ] **Step 2: Extend `subscription.updated` handler to sync trial fields**

Replace the existing `customer.subscription.updated` case with:

```ts
case "customer.subscription.updated": {
  const subscription = event.data.object as Stripe.Subscription
  const clerkId = subscription.metadata?.clerkId
  if (!clerkId) break

  const planFromMetadata = subscription.metadata?.plan ?? null
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null

  await db.update(users)
    .set({
      subscriptionStatus: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      ...(planFromMetadata ? { subscriptionTier: planFromMetadata } : {}),
      ...(trialEnd ? { trialEndsAt: trialEnd } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, clerkId))

  logger.info("stripe/webhook", "Subscription updated", { clerkId, status: subscription.status })
  break
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "webhook"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: webhook handles trial_will_end, syncs trial fields on subscription.updated"
```

---

### Task 5: Add trial flags to flags.ts + getTrialStatus helper

**Files:**
- Modify: `app/flags.ts`
- Modify: `lib/db/get-user.ts`

**Interfaces:**
- Produces:
  - `getTrialStatus(user: User): { isTrial: boolean; daysRemaining: number }` in `lib/db/get-user.ts`
  - `isTrialFlag: Flag<boolean>` — true if user is on a trial
  - `trialDaysRemainingFlag: Flag<number>` — days left on trial (0 if not trialing)

- [ ] **Step 1: Add `getTrialStatus` to `lib/db/get-user.ts`**

Add at the bottom of the file:

```ts
export function getTrialStatus(user: User): { isTrial: boolean; daysRemaining: number } {
  const isTrialing = user.subscriptionStatus === "trialing"
  if (!isTrialing || !user.trialEndsAt) return { isTrial: false, daysRemaining: 0 }
  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now()
  const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  return { isTrial: true, daysRemaining }
}
```

- [ ] **Step 2: Add trial flags to `app/flags.ts`**

Add to the bottom of flags.ts:

```ts
export const isTrialFlag = flag<boolean>({
  key: "is-trial",
  description: "Whether the user is on a 7-day free trial",
  async decide() {
    const { userId } = await auth()
    if (!userId) return false
    const user = await getOrCreateUser(userId)
    return user.subscriptionStatus === "trialing"
  },
})

export const trialDaysRemainingFlag = flag<number>({
  key: "trial-days-remaining",
  description: "Days remaining on the free trial (0 if not trialing)",
  async decide() {
    const { userId } = await auth()
    if (!userId) return 0
    const user = await getOrCreateUser(userId)
    const { daysRemaining } = getTrialStatus(user)
    return daysRemaining
  },
})
```

Also add the import for `getTrialStatus` at the top of flags.ts:

```ts
import { getOrCreateUser, getTrialStatus } from "@/lib/db/get-user"
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "flags|get-user"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/flags.ts lib/db/get-user.ts
git commit -m "feat: isTrialFlag, trialDaysRemainingFlag, getTrialStatus helper"
```

---

### Task 6: Enforce 3-matter cap in API

**Files:**
- Modify: `app/api/checklist/route.ts`

**Interfaces:**
- Consumes: `getTrialStatus(user)` from `lib/db/get-user`
- Produces: `POST /api/checklist` returns `{ error: "trial_limit_reached", limit: 3 }` with status 403 when `isTrial && activeMatters >= 3`

- [ ] **Step 1: Add import**

Add to the top of `app/api/checklist/route.ts`:

```ts
import { getTrialStatus } from "@/lib/db/get-user"
import { and, eq, ne, count } from "drizzle-orm"
```

- [ ] **Step 2: Add trial cap check in the POST handler**

After `const user = await getOrCreateUser(userId)` and before the body parse, add:

```ts
const { isTrial } = getTrialStatus(user)
if (isTrial) {
  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(matters)
    .where(and(eq(matters.userId, user.id), ne(matters.status, "closed")))
  if (activeCount >= 3) {
    return NextResponse.json(
      { error: "trial_limit_reached", limit: 3 },
      { status: 403 }
    )
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "checklist"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/checklist/route.ts
git commit -m "feat: enforce 3-matter cap for trial users in POST /api/checklist"
```

---

### Task 7: Trial banner in Sidebar

**Files:**
- Modify: `components/sidebar.tsx`

**Interfaces:**
- Consumes: `GET /api/user/trial-status` (new endpoint below) returning `{ isTrial: boolean; daysRemaining: number }`
- Produces: Banner above sidebar nav when `isTrial === true`

- [ ] **Step 1: Create `GET /api/user/trial-status` route**

```bash
mkdir -p app/api/user/trial-status
```

Create `app/api/user/trial-status/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getOrCreateUser, getTrialStatus } from "@/lib/db/get-user"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ isTrial: false, daysRemaining: 0 })
  const user = await getOrCreateUser(userId)
  return NextResponse.json(getTrialStatus(user))
}
```

- [ ] **Step 2: Add trial banner state to Sidebar**

In `components/sidebar.tsx`, add a state and effect to fetch trial status:

```tsx
const [trialStatus, setTrialStatus] = useState<{ isTrial: boolean; daysRemaining: number } | null>(null)

useEffect(() => {
  fetch("/api/user/trial-status")
    .then((r) => r.json())
    .then((d) => setTrialStatus(d))
    .catch(() => {})
}, [])
```

- [ ] **Step 3: Render the trial banner**

Add this inside the sidebar `<div className="sidebar">`, before the main nav:

```tsx
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
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "sidebar|trial-status"
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/sidebar.tsx app/api/user/trial-status/route.ts
git commit -m "feat: trial banner in sidebar with days-remaining countdown and upgrade CTA"
```

---

### Task 8: Show upgrade prompt in matters UI when cap reached

**Files:**
- Modify: `app/(dashboard)/matters/page.tsx`

**Interfaces:**
- Consumes: `POST /api/checklist` returning `{ error: "trial_limit_reached", limit: 3 }` with status 403
- Produces: When `handleCreate` receives a 403 with `trial_limit_reached`, show an inline upgrade prompt instead of a generic error

- [ ] **Step 1: Update `handleCreate` to detect trial limit error**

Find the `handleCreate` function. After the `fetch("/api/checklist", {...})` call, add a check:

```ts
async function handleCreate() {
  setCreating(true)
  setFormError("")
  try {
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      if (data.error === "trial_limit_reached") {
        setFormError("trial_limit_reached")
      } else {
        setFormError(data.error ?? "Failed to create matter")
      }
      return
    }
    const data = await res.json()
    router.push(`/matters/${data.matterId}`)
  } catch {
    setFormError("Something went wrong. Please try again.")
  } finally {
    setCreating(false)
  }
}
```

- [ ] **Step 2: Render upgrade prompt when `formError === "trial_limit_reached"`**

In the form error display area (find where `formError` is currently rendered), add a special case:

```tsx
{formError === "trial_limit_reached" ? (
  <div style={{
    padding: "12px 16px",
    borderRadius: 8,
    backgroundColor: "rgba(232,168,74,0.08)",
    border: "1px solid rgba(232,168,74,0.2)",
    marginTop: 12,
  }}>
    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#b8860b", marginBottom: 4 }}>
      Trial limit reached
    </p>
    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 10 }}>
      Your 7-day trial includes up to 3 active matters. Upgrade to unlock unlimited matters.
    </p>
    <Link
      href="/pricing"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 16px",
        borderRadius: 6,
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      View plans &rarr;
    </Link>
  </div>
) : formError ? (
  <p style={{ fontSize: "0.875rem", color: "var(--color-error)", marginTop: 8 }}>{formError}</p>
) : null}
```

- [ ] **Step 3: Also block the "New matter" button in the empty state when cap is reached**

The empty state has an `onClick={() => setShowCreate(true)}` button. The cap is enforced server-side already, so no UI gate needed on the button itself — the form will show the upgrade prompt when they try to submit. This is correct behavior.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "matters"
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/matters/page.tsx"
git commit -m "feat: show upgrade prompt in matters UI when trial 3-matter cap is reached"
```

---

### Task 9: End-to-end smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/patrickmitchell/titlewise && npm run dev
```

- [ ] **Step 2: Test the pricing → sign-up redirect**

Navigate to `http://localhost:3000/pricing`. Verify:
- Solo CTA says "Start 7-Day Free Trial" and clicking it navigates to `/sign-up?plan=solo`
- Small Firm CTA says "Get Started" and navigates to `/sign-up?plan=small_firm`

- [ ] **Step 3: Test the sign-up page guard**

Navigate directly to `http://localhost:3000/sign-up` (no plan param). Verify: redirects to `/pricing`.

- [ ] **Step 4: Test the plan badge**

Navigate to `http://localhost:3000/sign-up?plan=solo`. Verify: "Solo plan — 7-day free trial" badge appears above the Clerk widget.

Navigate to `http://localhost:3000/sign-up?plan=small_firm`. Verify: "Small Firm plan" badge appears (no trial text).

- [ ] **Step 5: Test the trial cap (requires a trial user in DB)**

If you have a test user with `subscriptionStatus: "trialing"`, create 3 matters and attempt a 4th. Verify: the API returns 403 with `trial_limit_reached` and the UI shows the upgrade prompt.

- [ ] **Step 6: Final commit and push**

```bash
git push
```
