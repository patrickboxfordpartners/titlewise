# TitleWise API - Quick Start Guide

Get your first API call working in under 5 minutes.

---

## Step 1: Get Your API Key (1 minute)

1. Log in to [titlewise.app](https://titlewise.app)
2. Navigate to **Settings → API Keys**
3. Click **"Generate Key"**
4. Enter a name (e.g., "Production")
5. **Copy your key immediately** — it won't be shown again!

> ⚠️ **Enterprise plan required.** API access is available on the Enterprise plan ($999/mo). [Upgrade here](https://titlewise.app/settings)

---

## Step 2: Make Your First Request (2 minutes)

### Option A: cURL (fastest)

```bash
curl -X POST https://titlewise.app/api/v1/analyze-commitment \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000.00\n2. Premium: $2,450.00\n3. Subject Property: 123 Main Street, Portsmouth, NH 03801\n4. Proposed Insured: John Smith and Jane Smith\n\nSchedule B - Requirements\n\n1. Payment of consideration.\n2. Proper execution and delivery of deed.\n\n Schedule B - Exceptions\n\n1. Rights or claims of parties in possession not shown by public records.\n2. Outstanding mortgage in favor of First National Bank, amount $350,000.",
    "property_address": "123 Main Street, Portsmouth, NH 03801"
  }'
```

### Option B: JavaScript

```javascript
const response = await fetch('https://titlewise.app/api/v1/analyze-commitment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document_text: 'COMMITMENT FOR TITLE INSURANCE\n\nSchedule A...',
    property_address: '123 Main Street, Portsmouth, NH 03801'
  })
})

const data = await response.json()
console.log(data.analysis.summary)
```

### Option C: Python

```python
import requests

response = requests.post(
    'https://titlewise.app/api/v1/analyze-commitment',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
    },
    json={
        'document_text': 'COMMITMENT FOR TITLE INSURANCE\n\nSchedule A...',
        'property_address': '123 Main Street, Portsmouth, NH 03801'
    }
)

data = response.json()
print(data['analysis']['summary'])
```

---

## Step 3: Understand the Response (1 minute)

### Success Response (200 OK)

```json
{
  "analysis": {
    "property": {
      "address": "123 Main Street, Portsmouth, NH 03801",
      "type": "residential",
      "owners": "John Smith and Jane Smith",
      "amount": "$500,000"
    },
    "scheduleA": {
      "summary": "Standard Schedule A for residential purchase..."
    },
    "requirements": [
      {
        "item": "1",
        "description": "Payment of purchase price",
        "flagged": false
      }
    ],
    "exceptions": [
      {
        "item": "1",
        "description": "Rights of parties in possession",
        "flagged": false
      },
      {
        "item": "3",
        "description": "Outstanding mortgage of $350,000",
        "flagged": true
      }
    ],
    "redFlags": [
      {
        "severity": "high",
        "issue": "Large outstanding mortgage",
        "explanation": "Verify payoff amount and timing before closing"
      }
    ],
    "summary": "This title commitment shows a standard residential transaction with one significant exception: an outstanding mortgage that must be satisfied at closing."
  },
  "usage": {
    "tokens": 1847
  }
}
```

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1746331200
X-Response-Time-Ms: 2314
```

---

## Step 4: Try Other Endpoints (1 minute)

### Analyze Closing Disclosure

```bash
curl -X POST https://titlewise.app/api/v1/analyze-cd \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "CLOSING DISCLOSURE\nLoan Amount: $400,000..."}'
```

### Review HOA Documents

```bash
curl -X POST https://titlewise.app/api/v1/review-hoa \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "HOMEOWNERS ASSOCIATION\nMonthly Dues: $285..."}'
```

### Verify Wire Instructions

```bash
curl -X POST https://titlewise.app/api/v1/verify-wire \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "WIRE INSTRUCTIONS\nBank: TD Bank\nRouting: 011400071...",
    "expected_amount": 112847,
    "expected_beneficiary": "Seacoast Title LLC"
  }'
```

---

## Common Errors & Solutions

### 401 Unauthorized

**Error:**
```json
{
  "error": "Invalid or revoked API key"
}
```

**Solution:**
- Check that your API key starts with `tw_live_`
- Verify the key hasn't been revoked in Settings
- Ensure you're using `Authorization: Bearer YOUR_KEY` (not just the key)

---

### 403 Forbidden

**Error:**
```json
{
  "error": "Enterprise plan required for API access"
}
```

**Solution:**
- Upgrade to Enterprise plan at [titlewise.app/settings](https://titlewise.app/settings)
- Enterprise includes 1,000 API calls/month for $999/mo

---

### 429 Rate Limit Exceeded

**Error:**
```json
{
  "error": "Rate limit exceeded",
  "limit": 1000,
  "resetAt": 1746331200
}
```

**Solution:**
- Wait until next month (resetAt timestamp)
- Or upgrade to higher API limit (contact sales@titlewise.app)
- Monitor `X-RateLimit-Remaining` header to track usage

---

### 400 Bad Request

**Error:**
```json
{
  "error": "Invalid request body",
  "details": [
    {
      "code": "too_small",
      "minimum": 100,
      "path": ["document_text"],
      "message": "Document text must be at least 100 characters"
    }
  ]
}
```

**Solution:**
- Ensure `document_text` is at least 100 characters
- Check JSON is valid (use a validator)
- Verify all required fields are present

---

## Best Practices

### 1. Monitor Rate Limits

```javascript
const response = await fetch(/* ... */)
const remaining = response.headers.get('X-RateLimit-Remaining')

if (remaining < 100) {
  console.warn(`Only ${remaining} API calls left this month`)
}
```

### 2. Handle Errors Gracefully

```javascript
try {
  const response = await fetch(/* ... */)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  const data = await response.json()
  return data.analysis
} catch (error) {
  console.error('API call failed:', error.message)
  // Fallback logic here
}
```

### 3. Store Keys Securely

❌ **DON'T:**
```javascript
const API_KEY = 'tw_live_abc123...' // Hardcoded in source
```

✅ **DO:**
```javascript
const API_KEY = process.env.TITLEWISE_API_KEY // Environment variable
```

### 4. Use Timeouts

```javascript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ...
  })
} finally {
  clearTimeout(timeout)
}
```

---

## Next Steps

- 📖 [Full API Documentation](https://titlewise.app/api-docs)
- 🔑 [Manage API Keys](https://titlewise.app/settings)
- 💬 [Get Support](mailto:hello@titlewise.app)
- 📊 [View Usage](https://titlewise.app/settings) (usage stats in API Keys section)

---

## Support

**Questions?** Contact us:
- Email: hello@titlewise.app
- Enterprise support: priority@titlewise.app
- Response time: < 4 hours (Enterprise), < 24 hours (standard)

**Found a bug?** Report it: bugs@titlewise.app

---

**🎉 You're all set!** You made your first API call in under 5 minutes.
