# TitleWise Production Deployment Checklist

This guide walks through the steps to move TitleWise from development mode to production.

## Current State

- Using Clerk test keys (`pk_test_...`)
- Using Stripe test keys from ReviewSniper project
- Development database
- No production webhook endpoints configured

## Production Setup Steps

### 1. Clerk Authentication Setup

**Create Production Instance:**

1. Go to https://dashboard.clerk.com
2. Click "Create Application"
3. Name: "TitleWise Production"
4. Select authentication methods (Email, Google, etc.)
5. Click "Create Application"

**Configure Application:**

1. Navigate to **Domains** → Add production domain: `titlewise.app`
2. Navigate to **Paths** → Configure:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
3. Navigate to **API Keys** → Copy production keys:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

**Optional - User Management:**

Current implementation uses custom `teamMembers` table. Consider migrating to Clerk Organizations for better multi-tenant support:
- Clerk Organizations provide built-in team management
- Automatic invitation handling
- Role-based access control
- Better scalability

Decision: Keep custom `teamMembers` for now (simpler) or migrate to Organizations (more robust)?

### 2. Stripe Setup

**Create Production Products:**

1. Go to https://dashboard.stripe.com → Switch to "Production" mode
2. Navigate to **Products** → Click "Add Product"

Create three products:

**Solo Plan:**
- Name: TitleWise Solo
- Description: For solo practitioners
- Pricing:
  - Monthly: $99/month
  - Annual: $950/year (save $238)
- Copy monthly price ID: `price_...`
- Copy annual price ID: `price_...`

**Small Firm Plan:**
- Name: TitleWise Small Firm
- Description: Up to 5 attorneys
- Pricing:
  - Monthly: $249/month
  - Annual: $2,390/year (save $598)
- Copy monthly price ID: `price_...`
- Copy annual price ID: `price_...`

**Team Plan:**
- Name: TitleWise Team
- Description: Up to 15 attorneys
- Pricing:
  - Monthly: $499/month
  - Annual: $4,790/year (save $1,198)
- Copy monthly price ID: `price_...`
- Copy annual price ID: `price_...`

**Configure Webhooks:**

1. Navigate to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Endpoint URL: `https://titlewise.app/api/stripe/webhook`
4. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy webhook signing secret: `whsec_...`

### 3. Database Setup

**Create Production Database:**

1. Go to https://console.neon.tech
2. Click "New Project"
3. Name: "titlewise-production"
4. Region: Choose closest to your hosting (AWS us-east-1 recommended)
5. Copy connection string

**Run Migrations:**

```bash
cd /Users/patrickmitchell/titlewise

# Set production DATABASE_URL in .env.production
# Then run migrations
npm run db:push
```

**Verify Tables Created:**
- users
- matters
- checklistItems
- wireInstructions
- statusUpdates
- titleAnalyses
- teamMembers
- processedEvents (for webhook idempotency)

### 4. Email Configuration (Postmark)

**Create Production Server:**

1. Go to https://account.postmarkapp.com
2. Click "Servers" → "Add Server"
3. Name: "TitleWise Production"
4. Copy Server API Token

**Verify Domain:**

1. Navigate to **Sender Signatures**
2. Add domain: `titlewise.app`
3. Add DNS records (DKIM, return-path)
4. Wait for verification (usually 15-30 minutes)

**Configure From Address:**
- Default: `noreply@titlewise.app`
- Support emails: `support@titlewise.app`

### 5. Environment Variables

Copy `.env.production.template` to `.env.production` and fill in all production values:

```bash
cp .env.production.template .env.production
```

**Fill in these required values:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from step 1)
- `CLERK_SECRET_KEY` (from step 1)
- `STRIPE_SECRET_KEY` (from step 2)
- `STRIPE_WEBHOOK_SECRET` (from step 2)
- All 6 Stripe price IDs (from step 2)
- `DATABASE_URL` (from step 3)
- `POSTMARK_API_KEY` (from step 4)
- `POSTMARK_FROM_EMAIL` (from step 4)
- `ANTHROPIC_API_KEY` (separate key for production usage tracking)

### 6. Deployment

**Recommended Platform: Vercel**

1. Push code to GitHub
2. Connect Vercel to repository
3. Configure project:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
4. Add environment variables from `.env.production`
5. Deploy

**Custom Domain:**
1. Add domain in Vercel: `titlewise.app`
2. Configure DNS:
   - Type: CNAME
   - Name: `@` (or `www`)
   - Value: `cname.vercel-dns.com`
3. Wait for SSL certificate (automatic)

**Webhook URLs to Configure After Deployment:**
- Stripe: `https://titlewise.app/api/stripe/webhook`
- Update in Stripe Dashboard → Webhooks

### 7. Testing Checklist

**Authentication:**
- [ ] Sign up with new user
- [ ] Sign in with existing user
- [ ] Sign out
- [ ] Password reset flow
- [ ] Protected routes redirect to sign-in

**Subscription:**
- [ ] View pricing page
- [ ] Start checkout for Solo plan
- [ ] Complete payment with test card (4242 4242 4242 4242)
- [ ] Verify webhook received (check logs)
- [ ] Verify user subscription status updated in database
- [ ] Access dashboard (should be granted)
- [ ] Try to exceed monthly generation limit
- [ ] Cancel subscription
- [ ] Verify access revoked

**Core Features:**
- [ ] Create new matter
- [ ] Generate AI checklist
- [ ] Generate AI status update
- [ ] Generate AI title analysis
- [ ] Send wire instructions
- [ ] Invite team member
- [ ] Team member accepts invite
- [ ] Team member access control

**Error Handling:**
- [ ] Stripe webhook signature validation
- [ ] Database connection failures
- [ ] API rate limits
- [ ] Invalid user input

### 8. Monitoring & Alerts

**Recommended Services:**

1. **Vercel Analytics** (built-in)
   - Web vitals
   - Performance metrics

2. **Sentry** (error tracking)
   - Runtime errors
   - API failures
   - User impact

3. **PostHog** (product analytics)
   - Feature usage
   - User journeys
   - Conversion funnels

4. **Better Stack** (uptime monitoring)
   - Endpoint health checks
   - Alert on downtime

### 9. Security Review

**Before Launch:**
- [ ] All API keys in environment variables (not in code)
- [ ] `.env.production` added to `.gitignore`
- [ ] Webhook signature verification enabled
- [ ] Clerk middleware protecting all authenticated routes
- [ ] Database uses SSL connection
- [ ] CORS configured properly for production domain
- [ ] Rate limiting on sensitive endpoints
- [ ] SQL injection prevention (using Drizzle ORM parameterized queries)
- [ ] XSS protection (React auto-escaping)

### 10. Launch

**Pre-launch:**
1. Complete all testing checklist items
2. Set up monitoring and alerts
3. Prepare support email (support@titlewise.app)
4. Create incident response plan

**Launch Day:**
1. Deploy to production
2. Verify all services operational
3. Test critical user path (sign up → subscribe → generate)
4. Monitor error logs for first few hours
5. Monitor Stripe webhooks dashboard

**Post-launch:**
1. Set up weekly review of:
   - Error rates
   - Conversion rates
   - User feedback
   - System costs
2. Plan first product iteration based on user feedback

---

## Migration from Development

If you have existing development users/data to migrate:

1. Export development database:
   ```bash
   pg_dump $DEV_DATABASE_URL > dev_backup.sql
   ```

2. Review data for PII/test data to exclude

3. Import to production (with caution):
   ```bash
   psql $PROD_DATABASE_URL < dev_backup_cleaned.sql
   ```

4. Update Clerk user IDs if using different Clerk instance

**Recommendation:** Start fresh in production, do not migrate development data.

---

## Rollback Plan

If critical issues arise:

1. Revert deployment in Vercel (click "Redeploy" on previous version)
2. Check environment variables unchanged
3. Verify database state (no destructive migrations)
4. Monitor for continued issues
5. Fix in development → test → redeploy

---

## Support Contacts

- Clerk Support: https://clerk.com/support
- Stripe Support: https://support.stripe.com
- Neon Support: https://neon.tech/docs/introduction
- Vercel Support: https://vercel.com/support
