import { NextResponse } from "next/server"

export const dynamic = "force-static"

const CONTENT = `---
title: TitleWise Pricing
description: Machine-readable pricing plans for AI agents. Plans from $149/month to $999/month with 14-day free trial.
canonical: https://titlewise.app/pricing
last-updated: 2026-08-27
---

# TitleWise Pricing

> Machine-readable pricing for AI agents

## Plans

### Solo
**$149/month**

- 1 attorney seat
- All AI document review tools
- Unlimited document analysis
- Wire fraud verification
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

- Up to 15 attorney seats
- Closing Agent AI assistant
- Automated checklist updates
- Client portal access
- Advanced reporting
- API access (500 req/min)

**Limits:**
- 15 user accounts
- 10,000 API calls/month
- Phone + email support

---

### Enterprise
**$999/month**

Everything in Pro, plus:

- Unlimited attorney seats
- Full API access (1000 req/min)
- Custom integrations
- Dedicated account manager
- SLA guarantees (99.9% uptime)
- Advanced security controls
- Custom training sessions
- Webhook support

**Limits:**
- Unlimited users
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
