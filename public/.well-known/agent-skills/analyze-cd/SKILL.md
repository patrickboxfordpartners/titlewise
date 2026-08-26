# Analyze Closing Disclosure

Analyze a Closing Disclosure (CD) for TRID compliance, loan term accuracy, and closing cost discrepancies.

## Endpoint

```
POST https://titlewise.app/api/v1/analyze-cd
```

## Authentication

```
Authorization: Bearer tw_live_your_key_here
```

## Request

```json
{
  "document_text": "Full text content of the Closing Disclosure (min 100 chars, max 500KB)",
  "property_address": "Optional property address for context"
}
```

## Response

```json
{
  "loanInformation": {
    "loanAmount": "$350,000",
    "interestRate": "6.5%",
    "monthlyPayment": "$2,212",
    "loanType": "conventional",
    "term": "30 years"
  },
  "closingCosts": {
    "totalClosingCosts": "$12,450",
    "lenderCredits": "$1,200",
    "cashToClose": "$87,250"
  },
  "loanCosts": [...],
  "flags": [
    {
      "severity": "high",
      "category": "TRID tolerance",
      "description": "Origination charge exceeds LE by $450 (zero-tolerance violation)"
    }
  ],
  "summary": "2 high-severity flags, 1 informational note"
}
```

## Error Codes

- `401` — Missing or invalid API key
- `403` — Enterprise plan required
- `422` — Validation error (document too short/long)
- `429` — Rate limit exceeded
