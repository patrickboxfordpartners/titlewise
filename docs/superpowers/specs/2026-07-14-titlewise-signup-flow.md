# TitleWise Signup Flow

**Date:** 2026-07-14
**Status:** Approved

---

## Goal

Move plan selection before account creation. New users commit to a plan first, then create an account, then pay (or activate a trial). This matches how professional SaaS tools work at the $149–$999/month price point and removes the awkward empty-dashboard experience for new signups.

---

## Full Flow

```
/pricing → choose plan → /sign-up?plan=solo|small-firm|pro|enterprise
→ Clerk signup → trial activation OR Stripe Checkout
→ /dashboard
```

---

## Pricing Page Changes

- Solo plan CTA: **"Start 7-Day Free Trial"** — links to `/sign-up?plan=solo`
- Small Firm, Pro, Enterprise CTAs: **"Get Started"** — links to `/sign-up?plan=<tier>`
- Solo is the only plan with a free trial. Higher tiers pay upfront.

---

## Sign Up Page (`/sign-up`)

- If no `?plan=` query param present, redirect to `/pricing`
- Display a small plan badge above the Clerk widget: e.g. "Solo plan — 7-day free trial" or "Small Firm plan"
- Clerk `<SignUp />` component handles all field collection (email, password)
- `afterSignUp` redirect: `/api/auth/post-signup?plan=<tier>` (passed via Clerk's `redirectUrl`)

---

## Post-Signup API Route (`/api/auth/post-signup`)

Runs after Clerk signup completes.

### Solo (trial)
1. Create Stripe customer for the new Clerk user
2. Create Stripe subscription with `trial_period_days: 7`, no payment method required
3. Store `stripeCustomerId` and `subscriptionTier: "solo"` and `isTrial: true` on the user record
4. Redirect to `/dashboard`

### Paid plans (Small Firm, Pro, Enterprise)
1. Create Stripe customer
2. Create Stripe Checkout session for the selected plan price ID
3. Redirect to Stripe Checkout
4. On `checkout.session.completed` webhook: activate subscription, redirect to `/dashboard`

---

## Trial Enforcement

### 3 Active Matter Cap
- `app/flags.ts` `getUserPlan()` already returns `subscriptionTier`
- Add `isTrial: boolean` and `trialMattersCount: number` derived from Stripe subscription status
- In `POST /api/matters` (matter creation): if `isTrial && activeMatters >= 3`, return 403 with `{ error: "trial_limit_reached" }`
- In the matter creation UI: if `isTrial && activeMatters >= 3`, show upgrade prompt instead of creation form

### Trial Banner (Sidebar)
- Show when `isTrial === true`
- Content: "7-day free trial — [N] days remaining" with "Upgrade" CTA
- When trial expires without payment: banner changes to "Your trial has ended — upgrade to continue"

---

## Stripe Webhooks (additions)

| Event | Action |
|---|---|
| `customer.subscription.trial_will_end` | Send reminder email (3 days before expiry) |
| `customer.subscription.updated` | Update `isTrial` and `subscriptionTier` in user record |
| `customer.subscription.deleted` | Lock dashboard, show upgrade gate |
| `checkout.session.completed` | Activate paid subscription, redirect to `/dashboard` |

---

## Files Touched

| File | Change |
|---|---|
| `app/(marketing)/pricing/page.tsx` | Update CTAs to link to `/sign-up?plan=` |
| `app/sign-up/[[...sign-up]]/page.tsx` | Add plan badge, redirect to pricing if no plan param |
| `app/api/auth/post-signup/route.ts` | New — handles trial activation and Stripe Checkout redirect |
| `app/api/stripe/webhook/route.ts` | Add trial_will_end, subscription.updated, subscription.deleted handlers |
| `app/flags.ts` | Add `isTrial`, `trialMattersCount` to `getUserPlan()` |
| `app/(dashboard)/matters/page.tsx` | Enforce 3-matter cap, show upgrade prompt |
| `components/sidebar.tsx` | Add trial banner with days-remaining countdown |

---

## Out of Scope

- Changing Clerk configuration (social login, SSO) — Clerk dashboard handles that
- Email templates for trial reminders — Postmark handles that separately
- Changing pricing amounts — separate decision
