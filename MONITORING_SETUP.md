# TITLEwise Monitoring Setup

Production monitoring is configured with **Sentry** (error tracking) and **PostHog** (product analytics).

## Sentry Setup

### 1. Create Sentry Project

1. Go to https://sentry.io
2. Create new organization: "titlewise"
3. Create new project:
   - Platform: **Next.js**
   - Project name: **titlewise-app**
4. Copy the DSN (looks like `https://...@sentry.io/...`)

### 2. Add to Vercel Environment Variables

Add to Vercel → TITLEwise → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE@sentry.io/PROJECT_ID
```

Environment: **Production**

### 3. Features Enabled

✅ **Error Tracking**:
- Automatic exception capture
- Server-side and client-side errors
- API route errors
- Edge function errors

✅ **Performance Monitoring**:
- 100% transaction sampling
- API endpoint performance
- Page load times

✅ **Session Replay** (10% sample rate):
- Watch user sessions when errors occur
- Privacy: all text and media masked

✅ **Smart Filtering**:
- Network errors ignored
- Auth errors filtered out
- Sensitive data (cookies, headers) stripped

### 4. Verify Setup

After deploying:
1. Go to Sentry dashboard
2. Trigger a test error: `throw new Error("Sentry test")`
3. Check that error appears in Sentry

---

## PostHog Setup

### Current Status

✅ **Configured from the environment**:
- Project key: `NEXT_PUBLIC_POSTHOG_KEY` (public write-only project key; do not commit the value)
- Host: `NEXT_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com`)
- User identification: Automatic via the signed-in session when the key is set

### Events Being Tracked

```typescript
// Predefined events (see lib/analytics.ts)
TOOL_USED
PDF_EXPORTED  
EMAIL_SENT
MATTER_CREATED
MATTER_PORTAL_SHARED
SUBSCRIPTION_UPGRADE_PROMPTED
WIRE_VERIFIED
TITLE_ANALYZED
STATUS_UPDATE_GENERATED
CD_REVIEWED
HOA_REVIEWED
FEE_ESTIMATE_GENERATED
TEAM_MEMBER_INVITED
```

### Features Enabled

✅ **Automatic Tracking**:
- Page views
- Page leaves
- User identification (via Clerk)

✅ **Custom Events**:
- Tool usage tracking
- Feature adoption
- Conversion funnels

### 3. Best Practices

**PostHog key stays in the environment:**

`components/posthog-provider.tsx` reads `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`. Analytics stays off until the key is set on the host (for example in Vercel). Do not commit the key.

---

## Monitoring Dashboards

### Sentry Dashboard

**Key Metrics to Watch:**
- Error rate by route
- Most common errors
- Affected users count
- Performance by endpoint

**Alerts to Set Up:**
- Error spike (>10 errors/min)
- Performance degradation (>2s average)
- New error types

### PostHog Dashboard

**Key Funnels:**
1. **Activation Funnel**:
   - Sign up → First tool use → Second tool use
   
2. **Conversion Funnel**:
   - Visit pricing → Start checkout → Complete subscription

3. **Feature Adoption**:
   - Track which tools are most used
   - Which features drive retention

**Dashboards to Create:**
- Daily Active Users (DAU)
- Tool usage heatmap
- Subscription conversion rate
- Churn risk indicators

---

## Deployment

After adding `NEXT_PUBLIC_SENTRY_DSN` to Vercel:

```bash
git add -A
git commit -m "Add Sentry error tracking"
git push origin main
```

Vercel will automatically redeploy with monitoring enabled.

---

## Testing Monitoring

### Test Sentry

```typescript
// Add to any page temporarily
useEffect(() => {
  throw new Error("Sentry test error");
}, []);
```

Should appear in Sentry dashboard within seconds.

### Test PostHog

```typescript
import { trackEvent, EVENTS } from "@/lib/analytics"

trackEvent(EVENTS.TOOL_USED, {
  tool: "test",
  duration_ms: 1000,
})
```

Check PostHog → Live Events to see it captured.

---

## Cost Estimates

**Sentry**:
- Free tier: 5K errors/mo
- Recommended: Team ($26/mo) - 50K errors/mo

**PostHog**:
- Free tier: 1M events/mo  
- More than enough for initial launch

---

## Support

- Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- PostHog docs: https://posthog.com/docs/libraries/next-js
