# TitleWise Agent Authentication

## Overview

TitleWise provides a REST API for AI agents to perform real estate closing document analysis. Authentication uses Bearer tokens (API keys).

## Getting an API Key

1. Sign up at https://titlewise.app/sign-up
2. Subscribe to the Enterprise plan ($999/mo) which includes API access
3. Navigate to Settings > API Keys
4. Click "Generate New Key"
5. Store the key securely — it is shown only once

API keys use the prefix `tw_live_` followed by 48 random characters.

## Authentication

Include the API key as a Bearer token in the Authorization header:

```
Authorization: Bearer tw_live_your_key_here
```

## Available Endpoints

All endpoints are at `https://titlewise.app/api/v1/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analyze-cd` | POST | Analyze a Closing Disclosure |
| `/api/v1/analyze-commitment` | POST | Analyze a title commitment |
| `/api/v1/verify-wire` | POST | Verify wire instructions |
| `/api/v1/review-hoa` | POST | Review HOA documents |
| `/api/health` | GET | Health check (no auth required) |

## Rate Limits

- 100 requests per minute per API key
- 10,000 requests per month (Enterprise plan)

Usage is logged and viewable in Settings > API Keys > Usage.

## Webhooks

Enterprise users can register webhook URLs to receive event notifications:

- `matter.created`
- `matter.updated`
- `checklist.completed`
- `document.analyzed`

Register webhooks at Settings > Webhooks or via `POST /api/webhooks`.

## MCP Transport

An MCP-compatible endpoint is available at `https://titlewise.app/api/mcp` for agents that support the Model Context Protocol. Use the same Bearer token for authentication.

## Support

- Email: hello@titlewise.app
- API Documentation: https://titlewise.app/api-docs
