# Review HOA Documents

Extract key terms, fees, special assessments, transfer restrictions, and compliance requirements from HOA or condominium association documents.

## Endpoint

```
POST https://titlewise.app/api/v1/review-hoa
```

## Authentication

```
Authorization: Bearer tw_live_your_key_here
```

## Request

```json
{
  "document_text": "Full text content of HOA documents (min 100 chars, max 500KB)",
  "property_address": "Optional property address for context"
}
```

## Response

```json
{
  "associationInfo": {
    "name": "Maple Ridge Homeowners Association",
    "managementCompany": "Premier Property Management",
    "contactPhone": "(555) 123-4567"
  },
  "fees": {
    "monthlyDues": "$385",
    "specialAssessments": [
      {
        "description": "Roof replacement reserve",
        "amount": "$2,400",
        "duration": "24 months remaining"
      }
    ],
    "transferFee": "$250",
    "capitalContribution": "$500"
  },
  "restrictions": [
    {
      "category": "rental",
      "description": "No short-term rentals under 12 months",
      "severity": "important"
    }
  ],
  "flags": [
    {
      "severity": "high",
      "category": "financial",
      "description": "Reserve fund below 10% threshold — special assessment likely"
    }
  ],
  "summary": "Monthly dues $385, $2,400 special assessment active, rental restriction flagged"
}
```

## Error Codes

- `401` — Missing or invalid API key
- `403` — Enterprise plan required
- `422` — Validation error
- `429` — Rate limit exceeded
