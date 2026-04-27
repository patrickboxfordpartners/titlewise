# TitleWise

AI-powered tools for real estate closing attorneys. Save 30+ minutes per file.

## Features

- **Status Update Generator** -- Enter file details, get a professional client update email in seconds. Supports streaming for instant feedback.
- **Title Commitment Analyzer** -- Paste or upload a PDF title commitment and get a structured breakdown of requirements, exceptions, and red flags.
- **History** -- All generated content saved and searchable. Re-generate from past entries with one click.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS 4
- Clerk (auth)
- Neon PostgreSQL + Drizzle ORM
- Stripe (subscriptions, billing portal)
- Anthropic Claude (AI generation)

## Getting Started

```bash
# Install
npm install

# Copy env file and fill in keys
cp .env.local.example .env.local

# Push schema to database
npm run db:push

# Start dev server
npm run dev
```

### Required Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | clerk.com |
| `CLERK_SECRET_KEY` | clerk.com |
| `DATABASE_URL` | neon.tech |
| `STRIPE_SECRET_KEY` | stripe.com |
| `STRIPE_WEBHOOK_SECRET` | stripe.com |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## Architecture

```
app/
  (marketing)/     # Public pages (pricing)
  (dashboard)/     # Auth-gated pages (dashboard, tools, history, settings)
  api/
    generate-update/   # Status update AI generation (streaming + non-streaming)
    analyze-title/     # Title commitment AI analysis
    parse-pdf/         # PDF text extraction
    history/           # User history retrieval
    settings/          # Profile management
    stripe/
      checkout/        # Subscription checkout session
      webhook/         # Stripe event handler (idempotent)
      portal/          # Billing portal redirect
lib/
  db/                  # Drizzle schema, connection, user helpers
  anthropic.ts         # Claude client + prompt builders
  stripe.ts            # Stripe client
  plans.ts             # Subscription tier config
  rate-limit.ts        # Per-user rate limiting
  logger.ts            # Structured JSON logging
  env.ts               # Environment variable validation
```

## Subscription Model

| Tier | Price | Seats |
|------|-------|-------|
| Solo | $99/mo | 1 |
| Small Firm | $249/mo | 5 |
| Team | $499/mo | 15 |

14-day free trial on signup. 5 free generations/month on free tier.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run verify:prod  # Verify production environment configuration
```

## Production Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete production setup guide.

**Quick steps:**
1. Create production Clerk instance (pk_live_ keys)
2. Create production Stripe products and webhooks
3. Create production database
4. Copy `.env.production.template` to `.env.production` and fill in all values
5. Run `npm run verify:prod` to validate configuration
6. Deploy to Vercel
