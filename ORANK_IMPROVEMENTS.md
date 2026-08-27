# orank Improvements Summary

**Date:** August 27, 2026  
**Current Score:** 60/100 (Grade C)  
**Goal:** Improve to 80+ (Grade B or higher)

## Changes Implemented

### Discovery Layer (was 3/10 pts)

#### Fixed Issues:
1. ✅ **ARD discovery** - Created `/public/.well-known/ard.json` with proper ARD v0.91 spec
   - Added `displayName` to host
   - Used `identifier` instead of `id`
   - Used `mediaType` instead of `type`
   - Expected gain: +1 pt

2. ✅ **AI Catalog discovery** - Fixed `/public/.well-known/ai-catalog.json`
   - Added `displayName` to host object
   - Expected gain: +1 pt

3. ✅ **Agent Skills index conformance** - Updated `/public/.well-known/agent-skills/index.json`
   - Changed schema to `https://schemas.agentskills.io/discovery/0.2.0/schema.json`
   - Changed `type` from "api" to "skill-md"
   - Added SHA256 digests for all skill files
   - Expected gain: +1 pt

### Access Layer (was 23/60 pts)

#### Fixed Issues:
4. ✅ **pricing.md** - Created `/public/pricing.md`
   - Machine-readable pricing with all 4 plans detailed
   - Add-ons, free trial, and payment terms documented
   - Expected gain: +2 pts

5. ✅ **Trust anchor pages** - Created `/public/about.md`, `/public/contact.md`, `/public/privacy.md`
   - Each >500 characters with substantial content
   - About: Company story, technology, team, commitment
   - Contact: Multiple email addresses, business hours, response times
   - Privacy: Complete privacy policy with GDPR/CCPA compliance
   - Expected gain: +2 pts

6. ✅ **llms.txt formatting** - Enhanced `/public/llms.txt`
   - Added markdown links to all sitemap entries
   - Added links to .well-known resources
   - Added comprehensive "When to Use" section
   - Expected gain: +1 pt (formatting) + +3 pts (agent instruction)

7. ✅ **A2A agent-card** - Created `/public/.well-known/agent-card.json`
   - Complete agent capabilities, skills, protocols
   - Contact info, endpoints, documentation links
   - Pricing info and metadata
   - Expected gain: +2 pts

8. ✅ **OAuth metadata** - Created OAuth discovery files
   - `/public/.well-known/oauth-protected-resource`
   - `/public/.well-known/oauth-authorization-server`
   - Both include WorkOS agent_auth blocks with identity_types_supported
   - Expected gain: +1 pt (PRM + AS metadata)

9. ✅ **API catalog (RFC 9727)** - Created `/public/.well-known/api-catalog`
   - Linkset with OpenAPI spec references
   - MCP server card reference
   - Expected gain: +1 pt

10. ✅ **Markdown frontmatter** - Added frontmatter to all .md files
    - pricing.md, about.md, contact.md, privacy.md, auth.md
    - All include title, description, canonical, last-updated
    - Expected gain: +1 pt

11. ✅ **Markdown URL fallback** - Created `/public/index.md`
    - Markdown homepage with full content
    - Includes all key sections and resource links
    - Expected gain: +2 pts

12. ✅ **NLWeb Schema Feeds** - Added schemamap directive
    - Updated `/public/robots.txt` with schemamap line
    - Created `/public/schemamap.xml` listing all structured data feeds
    - Expected gain: +1 pt

13. ✅ **Sitemap updates** - Updated `/app/sitemap.ts`
    - Added about, contact, auth.md, pricing.md pages
    - All entries have lastModified dates
    - Expected gain: Already had dates, maintains score

14. ✅ **Organization schema enhancement** - Updated `/app/page.tsx`
    - Added multiple contactPoint entries (support, sales)
    - Expanded sameAs array with social profiles
    - Expected gain: +2 pts (Organization completeness) + +2 pts (entity linking)

### Usability Layer (was 34/61 pts)

#### Fixed Issues:
15. ✅ **MCP server-card.json** - Restructured `/public/.well-known/mcp/server-card.json`
    - Added root-level `name`, `version`, `serverUrl` fields
    - Added `tools[]` array with tool descriptions
    - Kept backward-compatible `serverInfo` nested object
    - Expected gain: +1 pt

## Expected Score Impact

### Point Gains by Layer:
- **Discovery:** +3 pts (3 → 6)
- **Access:** +18 pts (23 → 41)
- **Usability:** +1 pt (34 → 35)
- **Total Expected:** +22 pts

### Projected New Score:
- **Current:** 60/100 (Grade C)
- **Expected:** 82/100 (Grade B)
- **Improvement:** +22 points

## Remaining Gaps (Not Addressed)

### Discovery (Medium-High Complexity):
- Wikipedia/Wikidata entity (4 pts) - Requires external article creation
- Brand name discoverability (3 pts) - Requires SEO/press coverage
- ChatGPT app listing (2 pts) - Requires external submission
- NPM/PyPI SDK package (1 pt) - Requires SDK development
- Agent platform configs (1 pt) - Need to create GitHub repo with AGENTS.md
- Agent Plugins manifest (1 pt) - Need to create plugin.json
- Listed on skills.sh (1 pt) - Need to publish skills

### Access (High Complexity):
- Developer portal (6 pts) - Requires building full documentation site
- Agent mode view (2 pts) - Requires ?mode=agent implementation
- Sandbox environment (2 pts) - Requires infrastructure setup
- Modular llms.txt per area (1 pt) - Need /docs/llms.txt, /api/llms.txt, etc.
- Markdown alternate links (1 pt) - Need <link rel="alternate"> in HTML
- Bot-UA markdown serving (1 pt) - Requires server-side UA detection
- Markdown content negotiation (1 pt) - Requires Accept header handling + Vary header

### Usability (High Complexity):
- Multi-language SDKs (3 pts) - Requires SDK development for npm, PyPI, etc.
- Web Bot Auth directory (2 pts) - Requires Ed25519 key generation
- auth.md WorkOS structure (2 pts) - Need to restructure with spec anchors
- Product + docs MCP coverage (2 pts) - Need separate docs MCP server
- Sandbox/test environment (2 pts) - Infrastructure requirement
- NLWeb /ask endpoint (1 pt) - Requires POST endpoint implementation
- Agent-friendly 404s (1 pt) - Need markdown body in 404 responses

## Next Steps

### Priority 1 (Quick Wins Remaining):
1. Add ?mode=agent support - Create dedicated agent view
2. Add <link rel="alternate"> tags for markdown twins
3. Create modular llms.txt files (/api/llms.txt, /docs/llms.txt)
4. Structure auth.md per WorkOS spec with anchors

### Priority 2 (Medium Effort):
5. Create developer portal at /developers
6. Publish official skills to skills.sh
7. Create Agent Plugin manifest (plugin.json)
8. Improve brand discoverability through SEO

### Priority 3 (High Effort):
9. Develop and publish NPM SDK package
10. Develop multi-language SDKs (Python, Ruby, Go)
11. Implement NLWeb /ask endpoint
12. Setup sandbox/test environment
13. Create Wikipedia article and Wikidata entity

## Verification

To verify improvements:

```bash
curl -X POST https://ora.ai/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "titlewise.app"}'
```

Or check cached score:
```bash
curl https://ora.ai/api/score/titlewise.app
```

View full report: https://ora.ai/score/titlewise.app

## Files Modified

### New Files:
- `/public/.well-known/ard.json`
- `/public/.well-known/agent-card.json`
- `/public/.well-known/oauth-protected-resource`
- `/public/.well-known/oauth-authorization-server`
- `/public/.well-known/api-catalog`
- `/public/pricing.md`
- `/public/about.md`
- `/public/contact.md`
- `/public/privacy.md`
- `/public/index.md`
- `/public/schemamap.xml`

### Modified Files:
- `/public/.well-known/ai-catalog.json` - Added displayName to host
- `/public/.well-known/mcp/server-card.json` - Restructured with root fields
- `/public/.well-known/agent-skills/index.json` - Updated schema and added digests
- `/public/llms.txt` - Added markdown links and "when to use" section
- `/public/robots.txt` - Added schemamap directive
- `/public/auth.md` - Added frontmatter
- `/app/page.tsx` - Enhanced Organization schema
- `/app/sitemap.ts` - Added new pages

## Deployment Notes

After deploying these changes:

1. Verify all .well-known files are accessible via HTTPS
2. Check that markdown files render correctly
3. Test that sitemap.xml includes new entries
4. Verify robots.txt includes schemamap directive
5. Confirm JSON-LD renders in homepage source
6. Run orank rescan to verify score improvement

## Success Metrics

- **Primary Goal:** Score ≥80/100 (Grade B)
- **Stretch Goal:** Score ≥90/100 (Grade A)
- **Current Projection:** 82/100 (Grade B) ✅

The implemented changes should significantly improve TitleWise's agent-readiness score, with particular gains in the Access layer (Discovery, metadata, authentication) and foundational improvements to documentation and structured data.
