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

Every plan includes every TITLEwise tool: title analysis, CD/TRID review, wire fraud screening, HOA review, fee estimates, tax proration, status updates, closing checklists, client portal, and the Closing Agent. Plans differ by seats, monthly AI generations, and Enterprise API access.

- Wire fraud screening = AI red flags + ABA routing checksum + comparison to wires you confirmed by phone, plus a drafted callback request. It does not check account ownership with any outside source. Always confirm by phone before wiring.
- TRID classifications and cure amounts are AI estimates. Verify them against the LE and CD before issuing a cure.
- The Closing Agent runs on demand when you click Run Agent on a matter. It does not run on a schedule.

### Solo
**$149/month**

- 1 attorney seat
- ${generations("solo")}
- Every tool, including the Closing Agent
- Email support

---

### Small Firm
**$349/month**

- Up to 5 attorney seats
- ${generations("small_firm")}
- Every tool, including the Closing Agent
- Team invitations and seat management
- Priority email support

---

### Pro
**$599/month**

- Up to 10 attorney seats
- ${generations("pro")}
- Every tool, including the Closing Agent
- Team invitations and seat management
- Priority support

---

### Enterprise
**$999/month**

- Up to 25 attorney seats
- ${generations("enterprise")}
- Every tool, including the Closing Agent
- REST API access and webhooks
- Dedicated onboarding

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
