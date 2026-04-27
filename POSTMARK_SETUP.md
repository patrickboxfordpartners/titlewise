# Postmark Setup for TitleWise

## Step 1: Add Sender Signatures

1. Log in to Postmark: https://account.postmarkapp.com/
2. Navigate to **Sender Signatures**
3. Click **Add Sender Signature**
4. Add both:
   - `hello@titlewise.app`
   - `patrick@titlewise.app`
5. Verify email addresses via confirmation links sent to each address

## Step 2: Add Domain (titlewise.app)

1. In Postmark, navigate to **Domains**
2. Click **Add Domain**
3. Enter: `titlewise.app`
4. Postmark will provide DNS records to configure

## Step 3: Configure DNS Records in Cloudflare

### DKIM Records (3 CNAMEs from Postmark)
```
Type: CNAME
Name: <provided-by-postmark>
Target: <provided-by-postmark>
```

### SPF Record
```
Type: TXT
Name: titlewise.app
Content: v=spf1 include:spf.mtasv.net ~all
```

### Return-Path (CNAME)
```
Type: CNAME
Name: pm-bounces
Target: pm.mtasv.net
```

## Step 4: Set Up Inbound Email

1. In Postmark domain settings, enable **Inbound**
2. Add MX record in Cloudflare:
```
Type: MX
Name: titlewise.app
Priority: 10
Target: inbound.postmarkapp.com
```

3. Configure inbound webhook in Postmark:
   - Webhook URL: `https://titlewise.app/api/postmark/inbound` (we'll create this)
   - Click **Test** to verify

## Step 5: Get API Keys

1. Navigate to **Servers** > **mailBOXFORD** (or create new server "TitleWise")
2. Copy **Server API Token** for sending email
3. Copy **Inbound Hook Credential** for webhook verification

## Step 6: Add to TitleWise .env.local

```bash
POSTMARK_API_KEY="<server-api-token>"
POSTMARK_INBOUND_WEBHOOK_SECRET="<inbound-hook-credential>"
POSTMARK_FROM_EMAIL="hello@titlewise.app"
```

## Step 7: Add to mailBOXFORD Supabase Secrets

```bash
cd /Users/patrickmitchell/mailboxford
supabase secrets set POSTMARK_TITLEWISE_API_KEY="<server-api-token>"
```

## Verification Checklist

- [ ] Both email addresses verified in Postmark
- [ ] Domain `titlewise.app` added to Postmark
- [ ] All DNS records configured in Cloudflare (3 DKIM CNAMEs, SPF TXT, Return-Path CNAME, MX)
- [ ] DNS propagation complete (check with `dig titlewise.app MX`)
- [ ] Domain shows green checkmark in Postmark
- [ ] Inbound enabled and MX record verified
- [ ] API keys saved in both projects
