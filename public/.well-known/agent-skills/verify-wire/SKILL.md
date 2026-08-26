# Verify Wire Instructions

Cross-reference wire instructions against known patterns and historical data to detect anomalies and potential wire fraud indicators.

## Endpoint

```
POST https://titlewise.app/api/v1/verify-wire
```

## Authentication

```
Authorization: Bearer tw_live_your_key_here
```

## Request

```json
{
  "wire_instructions": "Full text of wire instructions to verify",
  "recipient_name": "Optional expected recipient name",
  "expected_amount": "Optional expected wire amount"
}
```

## Response

```json
{
  "bankInfo": {
    "bankName": "First National Bank",
    "routingNumber": "021000021",
    "accountNumber": "****4567",
    "accountType": "checking"
  },
  "verification": {
    "routingValid": true,
    "bankNameMatch": true,
    "accountFormatValid": true
  },
  "riskScore": 15,
  "flags": [
    {
      "severity": "critical",
      "category": "wire_fraud",
      "description": "Account number differs from previous wire to same title company"
    }
  ],
  "crossMatterHistory": {
    "previousWires": 3,
    "lastSeen": "2026-07-20",
    "consistencyScore": 85
  },
  "summary": "Risk score 15/100. 1 critical flag: account mismatch vs prior transaction."
}
```

## Error Codes

- `401` — Missing or invalid API key
- `403` — Enterprise plan required
- `422` — Validation error
- `429` — Rate limit exceeded
