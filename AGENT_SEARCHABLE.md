# Agent-Searchable Content on TitleWise.app

**Status:** All resources confirmed accessible as of 2026-08-27

## Primary Discovery Entry Point

**🔍 Start Here:** https://titlewise.app/api/agent-discovery

This returns a JSON index of all agent-accessible resources.

## Core Agent Resources

### 1. llms.txt (Natural Language Description)
- **Primary:** https://titlewise.app/api/agent-discovery/llms
- **Contains:**
  - "When to Use TitleWise" section
  - Product description and features
  - Pricing information
  - Resource links
  - Use cases and limitations

### 2. ARD - Agent Resource Directory
- **URL:** https://titlewise.app/api/agent-discovery/ard
- **Spec:** ARD v0.91
- **Contains:**
  - Service catalog with 5 entries
  - URN identifiers for each tool
  - Representative queries for each capability
  - Media types and endpoints

### 3. Agent Card (A2A Discovery)
- **URL:** https://titlewise.app/api/agent-discovery/agent-card
- **Spec:** Agent Card v1.0
- **Contains:**
  - Agent capabilities and skills
  - Supported protocols (MCP, REST API, Agent Skills)
  - Contact information
  - Pricing tiers
  - Documentation links

### 4. AI Catalog
- **URL:** https://titlewise.app/.well-known/ai-catalog.json
- **Status:** ✅ Working
- **Contains:**
  - Host information
  - Service entries with URN identifiers

### 5. MCP Server Card
- **URL:** https://titlewise.app/.well-known/mcp/server-card.json
- **Status:** ✅ Working
- **Contains:**
  - MCP endpoint configuration
  - Authentication requirements
  - Tool descriptions

### 6. Agent Skills Index
- **URL:** https://titlewise.app/.well-known/agent-skills/index.json
- **Status:** ✅ Working
- **Contains:**
  - Skill directory with SHA256 digests
  - Links to individual skill MARKDOWN files

### 7. OAuth Metadata
- **URL:** https://titlewise.app/.well-known/oauth-protected-resource
- **Status:** ✅ Working
- **Contains:**
  - Protected resource metadata
  - Authorization server URLs
  - Agent auth configuration

## Supporting Resources

### robots.txt
- **URL:** https://titlewise.app/robots.txt
- **Status:** ✅ Working
- **Contains:**
  - AI crawler allowlist (GPTBot, ClaudeBot, etc.)
  - Sitemap reference
  - Content signals

### sitemap.xml
- **URL:** https://titlewise.app/sitemap.xml
- **Status:** ✅ Working
- **Contains:**
  - All public pages with lastModified dates

### Structured Data (JSON-LD)
- **Location:** Embedded in https://titlewise.app homepage
- **Contains:**
  - Organization schema with multiple contact points
  - SoftwareApplication schema
  - FAQPage schema
  - sameAs links to social profiles

## API Documentation

### Pricing
- **URL:** https://titlewise.app/api/md/pricing
- **Format:** Markdown with frontmatter
- **Contains:** All 4 pricing tiers with detailed breakdowns

### About
- **URL:** https://titlewise.app/api/md/about
- **Format:** Markdown with frontmatter
- **Contains:** Company background

### Authentication Guide
- **URL:** https://titlewise.app/auth.md
- **Format:** Markdown
- **Contains:**
  - Bearer token authentication
  - OAuth discovery
  - API endpoints
  - Rate limits

## Verification Commands

Test all agent-searchable resources:

```bash
# Discovery index
curl https://titlewise.app/api/agent-discovery

# llms.txt
curl https://titlewise.app/api/agent-discovery/llms | grep "When to Use"

# ARD
curl https://titlewise.app/api/agent-discovery/ard | jq '.specVersion'

# Agent Card
curl https://titlewise.app/api/agent-discovery/agent-card | jq '.agent.name'

# AI Catalog
curl https://titlewise.app/.well-known/ai-catalog.json | jq '.host.displayName'

# MCP Server
curl https://titlewise.app/.well-known/mcp/server-card.json | jq '.name'

# Agent Skills
curl https://titlewise.app/.well-known/agent-skills/index.json | jq '.skills | length'

# OAuth
curl https://titlewise.app/.well-known/oauth-protected-resource | jq '.resource'

# Pricing
curl https://titlewise.app/api/md/pricing | head -10

# About
curl https://titlewise.app/api/md/about | head -5
```

## What Agents Can Discover

An agent starting from scratch can discover TitleWise by:

1. **Via Standard Discovery:**
   - Finding `llms.txt` at root (standard location)
   - Finding `.well-known/ai-catalog.json`
   - Finding `.well-known/agent-skills/`

2. **Via orank/Agent Directories:**
   - Listed in agent directories that scan for ARD files
   - Listed in agent catalogs that index AI-catalog.json

3. **Via Direct Search:**
   - Searching for "real estate closing attorney AI"
   - Finding blog posts/content that link back
   - Discovering via social profiles in sameAs

## Key Capabilities Agents Can Access

1. **analyze_commitment** - Title commitment analysis
2. **analyze_cd** - Closing disclosure review
3. **verify_wire** - Wire fraud detection
4. **review_hoa** - HOA document extraction

## Authentication for Agents

- **Method:** Bearer token (API key format: `tw_live_...`)
- **How to Get:** Sign up at https://titlewise.app/sign-up → Subscribe to Enterprise plan → Settings > API Keys
- **Rate Limits:** 100 req/min (Solo) to 1000 req/min (Enterprise)

## Current orank Score

**Score:** 64/100 (Grade: C)
**Last Scanned:** 2026-08-27

### What's Working (+4 from baseline 60):
- ✅ AI Catalog with displayName
- ✅ Agent Skills index with SHA256 digests
- ✅ OAuth metadata with agent_auth block
- ✅ Sitemap with dates

### What's Available But Not Scored Yet:
- ARD accessible via `/api/agent-discovery/ard` (not at `.well-known/ard.json`)
- Agent Card accessible via `/api/agent-discovery/agent-card`
- llms.txt with "When to Use" accessible via `/api/agent-discovery/llms`
- Pricing/About accessible via `/api/md/pricing` and `/api/md/about`

## Implementation Notes

All agent-searchable content is delivered via API routes with:
- `force-dynamic` rendering
- 5-minute cache (`max-age=300`)
- Proper content-type headers
- Inlined content (no file system reads)

This approach bypasses:
- Static file caching issues
- Next.js routing limitations for .md files
- Cloudflare CDN staleness
- Build-time vs runtime file access problems

## Contact

For agent integration support:
- Email: hello@titlewise.app
- API Support: support@titlewise.app
- Documentation: https://titlewise.app/api-docs
