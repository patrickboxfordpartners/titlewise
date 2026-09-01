import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-static"

const PAGES: Record<string, string> = {
  "/": `# TITLEwise — AI Tools for Real Estate Closing Attorneys

> Automate document review, wire verification, closing checklists, and client communication.

## What is TITLEwise?

TITLEwise is a SaaS platform that gives real estate closing attorneys AI-powered tools to manage their practice more efficiently.

## Key Features

- **Status Updates** — AI generates plain-language updates from checklist progress, emails them to all parties
- **Title Analysis** — Parses title commitments, flags exceptions, identifies potential issues
- **CD Reviewer** — TRID-compliant closing disclosure review engine
- **Wire Verification** — Cross-matter memory detects anomalies in wire instructions
- **HOA Reviewer** — Extracts key terms, fees, and restrictions from HOA documents
- **Fee Estimate** — County-specific recording fees, transfer taxes, title insurance premiums
- **Tax Proration** — Calculates buyer/seller tax responsibilities with per-diem precision
- **Closing Agent** — AI assistant that auto-updates checklists, drafts communications, surfaces blockers

## Pricing

| Plan | Price | Users |
|------|-------|-------|
| Solo | $149/mo | 1 attorney |
| Small Firm | $349/mo | Up to 5 |
| Pro | $599/mo | Up to 15, includes Closing Agent |
| Enterprise | $999/mo | Unlimited, API access |

## API Access

Enterprise plan includes API access for AI agent integration.

- Documentation: [/auth.md](/auth.md)
- API Catalog: [/.well-known/api-catalog](/.well-known/api-catalog)
- MCP Server: [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)

## Links

- [Pricing](/pricing)
- [FAQ](/faq)
- [Blog](/blog)
- [Sign Up](/sign-up)
- [Contact](mailto:hello@titlewise.app)
`,
  "/pricing": `# TITLEwise Pricing

## Plans

### Solo — $149/month
- 1 attorney
- All 7 AI tools
- Unlimited matters
- Client portal
- Email integration

### Small Firm — $349/month
- Up to 5 users
- Everything in Solo
- Team collaboration
- Shared matter templates

### Pro — $599/month
- Up to 15 users
- Everything in Small Firm
- Closing Agent AI assistant
- Priority support

### Enterprise — $999/month
- Unlimited users
- Everything in Pro
- API access (v1 endpoints)
- Webhooks
- Custom integrations
- Dedicated support

## API Access

Enterprise plan includes programmatic access to all AI tools via REST API.
See [/auth.md](/auth.md) for authentication details.
`,
  "/faq": `# TITLEwise FAQ

## What is TITLEwise?
TITLEwise is an AI-powered SaaS platform for real estate closing attorneys that automates document review, wire verification, and client communication.

## Who is it for?
Solo closing attorneys, small title firms (2-10 attorneys), and any attorney handling residential real estate closings.

## What AI tools are included?
Status Updates, Title Analysis, CD Reviewer, Wire Verification, HOA Reviewer, Fee Estimate, and Tax Proration.

## Is there an API?
Yes. Enterprise plan ($999/mo) includes full API access with Bearer token authentication. See [/auth.md](/auth.md).

## How does wire verification work?
The system cross-references wire instructions against historical data from your previous transactions, detecting account changes and potential fraud indicators.

## Is my data secure?
Yes. All data is encrypted in transit and at rest. We do not train AI models on your documents.

## What payment methods do you accept?
We accept all major credit cards via Stripe. All subscriptions are billed monthly.
`,
}

export function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/"
  const markdown = PAGES[path]

  if (!markdown) {
    return new NextResponse("# Not Found\n\nThis page is not available in markdown format.", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  const tokenEstimate = Math.ceil(markdown.length / 4)

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(tokenEstimate),
      "Cache-Control": "public, max-age=3600",
    },
  })
}
