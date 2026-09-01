# TITLEwise Production Testing Checklist

## ✅ Pre-Deployment Complete

- [x] Stripe products created (4 tiers: Solo, Small Firm, Pro, Enterprise)
- [x] Stripe webhook configured at `https://titlewise.app/api/stripe/webhook`
- [x] All 8 price IDs added to Vercel environment variables
- [x] Clerk production keys configured
- [x] Production database created and migrated
- [x] Postmark domain verified and configured
- [x] All environment variables set in Vercel

## 🧪 Post-Deployment Testing

### 1. Basic Site Functionality

- [ ] Homepage loads at https://www.titlewise.app
- [ ] Navigation works (Pricing, Sign In, Get Started)
- [ ] Footer links work
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive design works

### 2. Authentication Flow (Clerk)

- [ ] Sign up with new email address
  - Email: `test+production@yourdomain.com`
  - Should redirect to dashboard after sign up
- [ ] Sign out
- [ ] Sign in with same account
- [ ] Password reset flow works
- [ ] OAuth (Google) sign in works (if enabled)

### 3. Pricing Page

- [ ] All 4 tiers displayed: Solo ($149), Small Firm ($349), Pro ($599), Enterprise ($999)
- [ ] Monthly/Annual toggle works
- [ ] Annual pricing shows correct discount (20% off)
- [ ] "Get Started" buttons work for each tier
- [ ] Feature lists match what's in code

### 4. Subscription Flow (Critical!)

**Test with Stripe test card: `4242 4242 4242 4242`**

- [ ] Click "Get Started" on Solo plan
- [ ] Stripe Checkout loads
- [ ] Enter test card: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits
  - ZIP: Any 5 digits
- [ ] Complete checkout
- [ ] Redirect back to dashboard with success message
- [ ] Subscription status shows "active" in dashboard
- [ ] Check Stripe dashboard - subscription should appear
- [ ] Check database - user record should have:
  - `stripeCustomerId`
  - `stripeSubscriptionId`
  - `subscriptionStatus: "active"`
  - `subscriptionTier: "solo"`

### 5. Stripe Webhook Testing

In Stripe Dashboard → Developers → Webhooks → Click your endpoint:

- [ ] `checkout.session.completed` event received (status: 200)
- [ ] `customer.subscription.updated` event received (if applicable)
- [ ] No failed webhook deliveries (status 400/500)
- [ ] Webhook signature verification working

### 6. Core Features (Subscribed User)

- [ ] Generate AI checklist
  - Should work and increment usage counter
- [ ] Generate status update
  - Should work and show in history
- [ ] Generate title analysis
  - Should work and save to database
- [ ] View history page
  - Should show all generated items
- [ ] Usage counter updates
  - Check that `monthlyUsageCount` increases in database

### 7. Usage Limits

- [ ] Try to generate content when at monthly limit
  - Should show error: "You've used all X generations for this month"
  - Should prompt to upgrade plan

### 8. Subscription Management

- [ ] Access Stripe Customer Portal from settings
  - Should redirect to `https://billing.stripe.com/p/session/...`
- [ ] View current subscription details
- [ ] Update payment method (add new test card)
- [ ] Download invoice
- [ ] Cancel subscription
  - Should set status to "canceled"
  - Access should remain until end of billing period

### 9. Team/Multi-User Features (If Applicable)

- [ ] Invite team member
- [ ] Team member receives email
- [ ] Team member accepts invite
- [ ] Team member can access shared matters
- [ ] Seat limits enforced (can't invite more than plan allows)

### 10. Email Deliverability (Postmark)

- [ ] Welcome email sent on sign up
- [ ] Subscription confirmation email sent
- [ ] Invoice email sent
- [ ] Team invitation email sent
- [ ] All emails land in inbox (not spam)
- [ ] Email templates render correctly
- [ ] Links in emails work

### 11. Error Handling

- [ ] Try to access dashboard without signing in → redirects to sign in
- [ ] Try to subscribe without being signed in → redirects to sign up
- [ ] Try to use expired/declined card → shows error message
- [ ] Database connection failure → shows friendly error (test by breaking DATABASE_URL)
- [ ] Stripe API failure → shows friendly error

### 12. Performance

- [ ] Page load times < 2 seconds
- [ ] AI generation completes within reasonable time
- [ ] No memory leaks in long sessions
- [ ] Database queries optimized (check Vercel logs)

### 13. Security

- [ ] No API keys exposed in client-side code
- [ ] Webhook signature verification working
- [ ] HTTPS enforced (no mixed content warnings)
- [ ] No sensitive data in console logs
- [ ] Rate limiting on API endpoints working

### 14. Monitoring & Logs

In Vercel Dashboard:

- [ ] Check Runtime Logs for errors
- [ ] Check Function logs for webhook processing
- [ ] Verify no build warnings
- [ ] Check edge function response times

In Stripe Dashboard:

- [ ] Monitor webhook deliveries
- [ ] Check for failed payments
- [ ] Review customer disputes (should be none)

## 🚨 Known Issues / Edge Cases

Document any issues found during testing:

1. 
2. 
3. 

## 📊 Test Results Summary

**Date Tested**: _________________

**Tested By**: _________________

**Overall Status**: ☐ Pass  ☐ Fail  ☐ Pass with minor issues

**Critical Issues Found**: _________________

**Action Items**:
- [ ] 
- [ ] 
- [ ] 

---

## Quick Test Commands

```bash
# Check if site is up
curl -I https://www.titlewise.app

# Check webhook endpoint (should return 405 Method Not Allowed for GET)
curl https://www.titlewise.app/api/stripe/webhook

# Verify database connection (run locally)
DATABASE_URL="postgresql://..." npm run db:studio
```

## Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure required**: `4000 0025 0000 3155`
- **Expired card**: `4000 0000 0000 0069`

More test cards: https://stripe.com/docs/testing#cards
