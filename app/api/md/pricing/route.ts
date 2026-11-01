import { NextResponse } from "next/server"
import { PLANS } from "@/lib/plans"

export const dynamic = "force-static"

const generations = (plan: keyof typeof PLANS) =>
  `${PLANS[plan].monthlyGenerationLimit.toLocaleString("en-US")} AI generations/month`

const CONTENT = `---
title: TITLEwise Pricing
description: Machine-readable pricing plans for AI agents. Plans from $149/month to $999/month.
canonical: https://titlewise.app/pricing
last-updated: 2026-08-27
---

# TITLEwise Pricing

> Machine-readable pricing for AI agents

## Plans

### Solo
**$149/month**

- 1 attorney seat
- All AI document review tools
- ${generations("solo")}
- Wire fraud screening (AI red flags + drafted callback request)
- Email status updates
- Basic support
- API access (100 req/min)

**Limits:**
- 1 user account
- 1,000 API calls/month
- Email support only

---

### Small Firm
**$349/month**

Everything in Solo, plus:

- Up to 5 attorney seats
- ${generations("small_firm")}
- Shared matter dashboard
- Team collaboration features
- Priority support
- API access (250 req/min)

**Limits:**
- 5 user accounts
- 5,000 API calls/month
- Priority email support

---

### Pro
**$599/month**

Everything in Small Firm, plus:

- Up to 10 attorney seats
- ${generations("pro")}
- Closing Agent AI assistant
- Automated checklist updates
- Client portal access
- Advanced reporting
- API access (500 req/min)

**Limits:**
- 10 user accounts
- 10,000 API calls/month
- Phone + email support

---

### Enterprise
**$999/month**

Everything in Pro, plus:

- Up to 25 attorney seats
- ${generations("enterprise")}
- Full API access (1000 req/min)
- Custom integrations
- Dedicated account manager
- SLA guarantees (99.9% uptime)
- Advanced security controls
- Custom training sessions
- Webhook support

**Limits:**
- Up to 25 users
- 50,000 API calls/month (negotiable)
- 24/7 phone + email support

---

## Contact

Questions about pricing? Email hello@titlewise.app or visit https://titlewise.app/pricing`

export function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
