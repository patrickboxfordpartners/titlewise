---
title: Authentication Guide - TITLEwise
description: Authentication methods for AI agents and developers. Bearer token authentication with OAuth2 support.
canonical: https://titlewise.app/auth.md
last-updated: 2026-08-27
---

# Auth.md

## Service

- **Name:** TITLEwise
- **URL:** https://titlewise.app
- **Description:** AI-powered tools for real estate closing attorneys

## Authentication

### For AI Agents

Agents authenticate using Bearer tokens (API keys) issued per-user.

**Token format:** `tw_live_` followed by 48 random characters

**Header:**
```
Authorization: Bearer tw_live_your_key_here
```

### Registration

1. Create an account at https://titlewise.app/sign-up
2. Subscribe to the Enterprise plan ($999/mo)
3. Navigate to Settings > API Keys
4. Generate a new key

### OAuth Discovery

- **Authorization Server:** https://clerk.titlewise.app
- **OIDC Configuration:** https://clerk.titlewise.app/.well-known/openid-configuration
- **Protected Resource Metadata:** https://titlewise.app/.well-known/oauth-protected-resource

## Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/analyze-cd` | POST | Bearer | Analyze a Closing Disclosure |
| `/api/v1/analyze-commitment` | POST | Bearer | Analyze a title commitment |
| `/api/v1/verify-wire` | POST | Bearer | Verify wire instructions |
| `/api/v1/review-hoa` | POST | Bearer | Review HOA documents |
| `/api/health` | GET | None | Health check |

## Rate Limits

- 100 requests per minute per key
- 10,000 requests per month (Enterprise plan)

## Webhooks

Enterprise users can register webhook URLs for event notifications:

- `matter.created`
- `matter.updated`
- `checklist.completed`
- `document.analyzed`

## MCP Transport

MCP-compatible endpoint: `https://titlewise.app/api/mcp`
Authentication: Same Bearer token

## Contact

- Email: hello@titlewise.app
- Documentation: https://titlewise.app/api-docs
