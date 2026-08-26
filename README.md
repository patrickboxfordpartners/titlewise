# TitleWise Agent Gateway

Agent-native interface to TitleWise document intelligence, built for the [Agent Natives Builders Hackathon](https://immersivecommons.com/events/hackathon) (Aug 26-27, Cloudflare SF).

## What it does

Exposes TitleWise's production document intelligence as MCP tools that any agent can discover and use — no human briefing required.

**Track 01 (External):** An unbriefed agent discovers TitleWise, authenticates via IC token, and completes a real document analysis transaction.

## Tools

| Tool | Description |
|------|-------------|
| `analyze_commitment` | Title commitment analysis — requirements, exceptions, red flags |
| `verify_wire` | Wire fraud detection in transfer instructions |
| `analyze_closing_disclosure` | TRID compliance review of Closing Disclosures |
| `review_hoa` | HOA document extraction — fees, restrictions, transfer requirements |

## Discovery

- `GET /` — JSON capability manifest
- `GET /llms.txt` — Agent-readable service description
- `GET /health` — Health check
- `GET /sse` — MCP endpoint (requires IC auth)

## Auth

Bearer token via Immersive Commons:
```
Authorization: Bearer <ic_agent_token>
```

Required scopes: `titlewise:analyze` or `hack:*`

## Stack

- **Cloudflare Workers** — Runtime (Durable Objects for MCP sessions)
- **Cloudflare Agents SDK** — MCP server infrastructure
- **Immersive Commons** — Agent authentication (IC tokens)
- **Cotal** — Agent-to-agent presence and discovery
- **TitleWise** — Production document intelligence (existing SaaS)

## Local Development

```bash
npm install
# Add your TitleWise service key to .dev.vars:
# TITLEWISE_SERVICE_KEY=tw_live_...

# Can't run locally on macOS <13.5, use remote mode:
npx wrangler dev --remote
```

## Deploy

```bash
npx wrangler login
npx wrangler secret put TITLEWISE_SERVICE_KEY
npx wrangler deploy
```

## Demo

```bash
# 1. Discover
curl https://titlewise-agent.<account>.workers.dev/llms.txt

# 2. Connect MCP (with IC token)
# Point any MCP client at /sse with Authorization header

# 3. Call a tool
# analyze_commitment({document_text: "<title commitment text>"})
```
