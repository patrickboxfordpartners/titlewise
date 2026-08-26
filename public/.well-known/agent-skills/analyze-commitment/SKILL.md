# Analyze Title Commitment

Parse a title commitment document, identify Schedule B exceptions, and flag potential issues with easements, liens, and encumbrances.

## Endpoint

```
POST https://titlewise.app/api/v1/analyze-commitment
```

## Authentication

```
Authorization: Bearer tw_live_your_key_here
```

## Request

```json
{
  "document_text": "Full text content of the title commitment (min 100 chars, max 500KB)",
  "property_address": "Optional property address for context"
}
```

## Response

```json
{
  "scheduleA": {
    "effectiveDate": "2026-08-15",
    "policyAmount": "$450,000",
    "proposedInsured": "John Smith",
    "estateOrInterest": "Fee Simple",
    "vestingType": "Individual"
  },
  "scheduleBExceptions": [
    {
      "number": 1,
      "text": "Rights of way and easements as shown on recorded plat",
      "category": "easement",
      "severity": "standard",
      "note": "Common plat easement, typically acceptable"
    }
  ],
  "requirements": [...],
  "flags": [
    {
      "severity": "high",
      "category": "lien",
      "description": "Open mortgage from 2019 not scheduled for payoff"
    }
  ],
  "summary": "12 Schedule B exceptions, 1 high-severity flag"
}
```

## Error Codes

- `401` — Missing or invalid API key
- `403` — Enterprise plan required
- `422` — Validation error
- `429` — Rate limit exceeded
