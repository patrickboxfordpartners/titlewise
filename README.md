# TitleWise Agent Gateway

Agent-native document intelligence for real estate closings. Built for the [Agent Natives Builders Hackathon](https://immersivecommons.com/events/hackathon) (Aug 26-27, 2026 — Cloudflare SF). **Winner, Track 01 (External).**

## What it does

TitleWise catches wire fraud, flags title defects, and reviews closing documents — then has three independent AI agents argue about whether the findings are real. An unbriefed agent can discover TitleWise, authenticate, pay, and get a verified analysis without any human setup.

The organizer review tested it against 8 known wire-fraud indicators and a banana bread recipe. It caught all 8 and correctly rejected the recipe.

## Architecture

```
Agent discovers /llms.txt or /.well-known/mcp/server-card.json
        ↓
   IC token auth → x402 payment gate (Stripe)
        ↓
┌───────────────────────────────────────────┐
│           Multi-Agent Pipeline            │
│                                           │
│  Entity Extraction (regex + ABA checksum) │
│            ↓ parallel fan-out             │
│  ┌─────────┬──────────┬──────────┐        │
│  │Primary  │ Tavily   │ Mitosis  │        │
│  │Analysis │ Web      │ Memory   │        │
│  │(Claude) │ Verify   │ Check    │        │
│  └────┬────┴────┬─────┴────┬─────┘        │
│       └─────────┼──────────┘              │
│            ↓ context merge                │
│  ┌─────────────────────────────┐          │
│  │  Adversarial Verification   │          │
│  │  Panel (3 independent AI    │          │
│  │  agents, can't see each     │          │
│  │  other's work)              │          │
│  └─────────────────────────────┘          │
│            ↓                              │
│  Consensus + Risk Synthesis              │
│  (ABSTAIN-aware, quorum-enforced)        │
└───────────────────────────────────────────┘
        ↓
   SSE stream of every agent's reasoning
```

### Key design decisions

- **Panel failures default to ABSTAIN, not agreement.** If a verification agent crashes, it doesn't silently vote "safe." If 2+ agents are unavailable, quorum is lost and risk escalates to HIGH.
- **Adversarial verification runs even when primary finds nothing.** The adversarial agent independently scans the document rather than rubber-stamping a clean bill of health.
- **Memory is tenant-isolated.** Each authenticated caller's Mitosis memory feeds are scoped by agent ID — one caller can't read another's prior analyses.
- **x402 receipts are tool-bound.** A payment receipt for `verify_wire` can't be replayed against `analyze_commitment`.

## MCP Tools

| Tool | What it does | Price |
|------|-------------|-------|
| `verify_wire` | Wire fraud detection with 3-agent adversarial panel | $2.50 |
| `analyze_commitment` | Title commitment analysis — requirements, exceptions, red flags | $2.00 |
| `analyze_closing_disclosure` | TRID compliance review of Closing Disclosures | $2.00 |
| `review_hoa` | HOA document review — fees, restrictions, transfer requirements | $1.50 |
| `recall` | Query persistent memory for prior analyses across matters | $0.25 |

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | Landing page + JSON capability manifest |
| `/llms.txt` | GET | Agent-readable service description |
| `/.well-known/mcp/server-card.json` | GET | MCP server card for discovery |
| `/sse` | GET | MCP SSE transport (requires IC auth) |
| `/mcp` | POST | MCP Streamable HTTP transport (requires IC auth) |
| `/api/stream` | POST | Full pipeline with SSE streaming (auth + x402) |
| `/api/analyze` | POST | Single-tool analysis (auth required) |
| `/api/pricing` | GET | x402-compatible pricing manifest |
| `/api/quote` | GET | Per-tool price quote |
| `/api/checkout` | POST | Stripe checkout session creation |
| `/health` | GET | Health check |
| `/cotal` | GET | Cotal agent presence manifest |

## Auth

Bearer token via [Immersive Commons](https://immersivecommons.com):
```
Authorization: Bearer <ic_agent_token>
```
Required scopes: `titlewise:analyze` or `titlewise:read`

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers + Durable Objects |
| Agent protocol | Cloudflare Agents SDK (MCP server) |
| Auth | Immersive Commons (IC tokens) |
| Payments | x402 protocol + Stripe |
| AI | Anthropic Claude (primary + panel agents) |
| Web verification | Tavily (entity + routing number verification) |
| Persistent memory | Mitosis Labs (cross-session, cross-matter) |
| Agent presence | Cotal (discovery + broadcasting) |
| Notifications | Telnyx (SMS + voice alerts) |
| Document storage | Cloudflare R2 |

## Testing

```bash
npm test          # 42 tests across auth, consensus, entity extraction, payments
npm run test:watch  # Watch mode
```

Tests cover the safety-critical paths: ABA routing number validation, panel consensus logic (including ABSTAIN handling and quorum loss), auth rejection, hackathon mode boundaries, and receipt validation.

## Local Development

```bash
npm install
cp .dev.vars.example .dev.vars  # Add your API keys
npx wrangler dev --remote       # Remote mode required for Durable Objects
```

## Deploy

```bash
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put MITOSIS_API_KEY
npx wrangler secret put MITOSIS_OFFICE_ID
npx wrangler secret put TAVILY_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put HACK_SECRET
npx wrangler deploy
```
