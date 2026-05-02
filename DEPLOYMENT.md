# TitleWise API - Production Deployment Guide

## Pre-Deployment Checklist

### Database Migrations

- [ ] Migration 0001_violet_blade.sql applied to production Neon database
  - Tables created: `api_keys`, `api_usage_logs`, `webhooks`
  - All foreign keys, indexes, and constraints in place
  - Verify with: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('api_keys', 'api_usage_logs', 'webhooks');`

### Environment Variables

- [ ] `DATABASE_URL` - Neon connection string (pooled)
- [ ] `ANTHROPIC_API_KEY` - Claude API key (production)
- [ ] `CLERK_SECRET_KEY` - Clerk authentication
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `POSTMARK_SERVER_API_TOKEN` - Postmark API key

### Code Review

- [ ] API authentication logic reviewed (`lib/api-auth.ts`)
- [ ] Rate limiting logic reviewed (`lib/api-rate-limit.ts`)
- [ ] Webhook dispatcher reviewed (`lib/webhook-dispatcher.ts`)
- [ ] All 4 API endpoints tested (`/api/v1/*`)
- [ ] OpenAPI spec matches implementation (`public/api/openapi.yaml`)
- [ ] No hardcoded secrets in codebase

### Security Audit

- [ ] API keys stored as bcrypt hashes (10 salt rounds)
- [ ] Webhook secrets use HMAC-SHA256 signatures
- [ ] Rate limiting active (1,000 calls/month per key)
- [ ] Enterprise tier gating in place (403 for non-Enterprise)
- [ ] CORS headers configured (`Access-Control-Allow-Origin: *`)
- [ ] Input validation on all endpoints (Zod schemas)
- [ ] Error messages don't leak sensitive information

### Testing

- [ ] All integration tests pass (`./test-integration.sh`)
- [ ] Webhook tests pass (`./test-webhooks.sh`)
- [ ] API key generation tested
- [ ] API key revocation tested
- [ ] Rate limit enforcement tested (make 1,001 calls)
- [ ] Webhook delivery tested (success + failure scenarios)
- [ ] Webhook auto-disable tested (10 consecutive failures)
- [ ] All error codes return correct status (400, 401, 403, 429, 500)

### Documentation

- [ ] OpenAPI spec published at `/api/openapi.yaml`
- [ ] Swagger UI live at `/api-docs`
- [ ] Quick Start guide available at `/api/quick-start.md`
- [ ] Code examples tested (JavaScript, Python, cURL)
- [ ] Webhook verification guide complete

### Monitoring

- [ ] `api_usage_logs` table populating correctly
- [ ] Rate limit counters incrementing
- [ ] Webhook failure counts tracking
- [ ] Claude API token usage logging
- [ ] Error logging configured (Sentry/LogRocket if applicable)

---

## Deployment Steps

### 1. Database Migration

```bash
# Connect to production Neon database
psql $DATABASE_URL

# Verify tables don't exist yet
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('api_keys', 'api_usage_logs', 'webhooks');

# Apply migration
\i drizzle/0001_violet_blade.sql

# Verify tables created
\dt

# Exit
\q
```

### 2. Deploy to Vercel

```bash
# Ensure all changes committed
git status

# Push to main branch
git push origin main

# Vercel auto-deploys from main
# Or manual deploy:
vercel --prod
```

### 3. Verify Environment Variables

```bash
# Check Vercel dashboard:
# https://vercel.com/your-org/titlewise/settings/environment-variables

# Required variables:
# - DATABASE_URL (Neon pooled connection)
# - ANTHROPIC_API_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - POSTMARK_SERVER_API_TOKEN
```

### 4. Test Production Endpoints

```bash
# Generate test API key in production
# 1. Log in to titlewise.app
# 2. Navigate to Settings
# 3. Generate API Key (name: "Production Test")
# 4. Copy key immediately

# Test analyze-commitment
curl -X POST https://titlewise.app/api/v1/analyze-commitment \
  -H "Authorization: Bearer YOUR_PRODUCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "COMMITMENT..."}'

# Verify response includes:
# - analysis object
# - usage.tokens
# - X-RateLimit-* headers
```

### 5. Create Stripe Enterprise Product

```bash
# In Stripe dashboard:
# 1. Products → Create product
# 2. Name: "Enterprise"
# 3. Price: $999/month recurring
# 4. Save price ID
# 5. Update titlewise code to recognize this price ID as "enterprise" tier
```

### 6. Monitor First 24 Hours

- [ ] Check `api_usage_logs` for incoming requests
- [ ] Verify rate limiting works (watch for 429 responses)
- [ ] Check webhook delivery (if any webhooks configured)
- [ ] Monitor Claude API token usage (estimate costs)
- [ ] Watch error logs for unexpected failures

---

## Rollback Plan

If critical issues found post-deployment:

1. **Revert Vercel deployment:**
   ```bash
   vercel rollback
   ```

2. **Disable API endpoints** (emergency):
   - Add maintenance mode check in `lib/api-auth.ts`
   - Return 503 Service Unavailable
   - Deploy hotfix

3. **Rollback database migration** (if necessary):
   ```sql
   DROP TABLE IF EXISTS webhooks CASCADE;
   DROP TABLE IF EXISTS api_usage_logs CASCADE;
   DROP TABLE IF EXISTS api_keys CASCADE;
   ```
   **⚠️ WARNING:** This destroys all API keys, usage logs, and webhooks. Only use in emergency.

---

## Post-Deployment

### Customer Onboarding

1. **Email existing Enterprise customers:**
   - Subject: "New: TitleWise API Now Available"
   - Body: Quick start guide + `/api-docs` link
   - CTA: "Generate Your First API Key"

2. **Update sales collateral:**
   - Add API feature to Enterprise tier description
   - Highlight 1,000 calls/month included
   - Emphasize developer-friendly docs

3. **Create sample integrations:**
   - JavaScript/Node.js client library
   - Python SDK
   - Postman collection (import OpenAPI spec)

### Monitoring & Alerts

- [ ] Set up alert if daily API call volume exceeds expected
- [ ] Monitor Claude API costs (should be ~$15/1000 calls)
- [ ] Watch for rate limit hit rate (if high, consider increasing limits)
- [ ] Track webhook failure rate (if >5%, investigate)

### Optimization Opportunities

- [ ] Add Redis caching for authentication (reduce DB queries)
- [ ] Implement API key prefix search optimization
- [ ] Add CDN for OpenAPI spec and docs
- [ ] Consider async webhook delivery (queue-based)
- [ ] Add API response caching for identical requests

---

## Success Metrics (First Month)

- **Adoption:** X% of Enterprise customers generate API keys
- **Usage:** X calls per customer per month (target: 500-800)
- **Revenue:** $Y additional revenue from new Enterprise signups
- **Performance:** <3s average response time
- **Reliability:** >99.5% uptime (exclude scheduled maintenance)
- **Support:** <5 API-related support tickets

---

## Appendix: Useful Queries

### Check API usage by endpoint
```sql
SELECT endpoint, COUNT(*), AVG(duration_ms), AVG(tokens_used)
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY endpoint
ORDER BY COUNT(*) DESC;
```

### Identify high-volume API keys
```sql
SELECT ak.name, u.email, COUNT(aul.id) as call_count
FROM api_keys ak
JOIN users u ON ak.user_id = u.id
LEFT JOIN api_usage_logs aul ON ak.id = aul.api_key_id
WHERE aul.created_at > NOW() - INTERVAL '30 days'
GROUP BY ak.id, ak.name, u.email
ORDER BY call_count DESC
LIMIT 10;
```

### Check webhook delivery success rate
```sql
SELECT 
  w.url,
  COUNT(*) FILTER (WHERE w.failure_count = 0) as successful,
  COUNT(*) FILTER (WHERE w.failure_count > 0) as failed,
  MAX(w.failure_count) as max_failures
FROM webhooks w
GROUP BY w.url;
```

### Calculate monthly Claude API costs
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(tokens_used) as total_tokens,
  SUM(tokens_used) * 0.000015 as estimated_cost
FROM api_usage_logs
WHERE status_code = 200
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```
