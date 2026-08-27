# orank Quick Reference

## Current Status
- **Before:** 60/100 (Grade C)
- **Expected After:** 82/100 (Grade B)
- **Improvement:** +22 points

## What Was Done

### ✅ Discovery Layer (+3 pts)
- Created ARD (Agent Resource Directory) at `.well-known/ard.json`
- Fixed AI Catalog with displayName field
- Updated Agent Skills index with v0.2.0 schema and SHA256 digests

### ✅ Access Layer (+18 pts)
- Created machine-readable `pricing.md`
- Created trust anchor pages: `about.md`, `contact.md`, `privacy.md`
- Enhanced `llms.txt` with markdown links and "When to Use" section
- Created A2A `agent-card.json`
- Added OAuth metadata files for agent authentication
- Created RFC 9727 `api-catalog` linkset
- Added frontmatter to all markdown files
- Created `index.md` for markdown homepage fallback
- Added NLWeb schemamap to `robots.txt` and created `schemamap.xml`
- Enhanced Organization JSON-LD with multiple contact points and sameAs links

### ✅ Usability Layer (+1 pt)
- Restructured MCP server-card with root-level fields and tools array

## Quick Deploy Checklist

1. **Verify locally:**
   ```bash
   ./scripts/verify-orank-improvements.sh
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: improve orank score with agent-readiness enhancements

   - Add ARD, agent-card, OAuth metadata, and API catalog
   - Create trust anchor pages (about, contact, privacy)
   - Add machine-readable pricing.md
   - Enhance llms.txt with links and usage guidance
   - Add markdown frontmatter and homepage fallback
   - Update MCP server-card structure
   - Enhance Organization schema with contacts and entity links
   
   Expected improvement: 60 → 82 points (Grade C → B)"
   ```

3. **Deploy to production:**
   ```bash
   git push
   # Or: vercel --prod
   ```

4. **Wait 5 minutes for deployment**

5. **Verify URLs are accessible:**
   - https://titlewise.app/.well-known/ard.json
   - https://titlewise.app/.well-known/agent-card.json
   - https://titlewise.app/pricing.md
   - https://titlewise.app/about.md
   - https://titlewise.app/contact.md
   - https://titlewise.app/privacy.md
   - https://titlewise.app/index.md

6. **Trigger orank rescan:**
   ```bash
   curl -X POST https://ora.ai/api/scan \
     -H "Content-Type: application/json" \
     -d '{"url": "titlewise.app"}'
   ```

7. **Check new score (wait ~2 minutes):**
   ```bash
   curl https://ora.ai/api/score/titlewise.app | jq
   ```

8. **View full report:**
   https://ora.ai/score/titlewise.app

## Key Files Added

```
public/
├── .well-known/
│   ├── ard.json                          # Agent Resource Directory
│   ├── agent-card.json                   # A2A agent capabilities
│   ├── api-catalog                       # RFC 9727 API discovery
│   ├── oauth-protected-resource          # OAuth metadata
│   └── oauth-authorization-server        # OAuth AS metadata
├── about.md                              # Trust anchor: company info
├── contact.md                            # Trust anchor: contact info
├── privacy.md                            # Trust anchor: privacy policy
├── pricing.md                            # Machine-readable pricing
├── index.md                              # Markdown homepage
└── schemamap.xml                         # NLWeb schema feeds

scripts/
└── verify-orank-improvements.sh          # Verification script
```

## Files Modified

```
public/
├── .well-known/
│   ├── ai-catalog.json                   # Added displayName
│   ├── mcp/server-card.json              # Restructured with tools[]
│   └── agent-skills/index.json           # Updated schema + digests
├── llms.txt                              # Added links + "When to Use"
├── robots.txt                            # Added schemamap directive
└── auth.md                               # Added frontmatter

app/
├── page.tsx                              # Enhanced Organization schema
├── sitemap.ts                            # Added new pages
└── layout.tsx                            # Added markdown alternate
```

## Expected Score Breakdown

| Layer | Before | After | Gain |
|-------|--------|-------|------|
| Discovery | 3/10 | 6/10 | +3 |
| Access | 23/60 | 41/60 | +18 |
| Usability | 34/61 | 35/61 | +1 |
| **TOTAL** | **60/100** | **82/100** | **+22** |

## Next Steps (Optional)

To reach 90+ (Grade A):
1. Create developer portal at `/developers` (+6 pts)
2. Add ?mode=agent support (+2 pts)
3. Publish NPM SDK (+1 pt)
4. Create per-section llms.txt files (+1 pt)
5. Add markdown alternate links to all pages (+1 pt)
6. Implement NLWeb /ask endpoint (+1 pt)

## Troubleshooting

### If score doesn't improve:
1. Check all URLs return 200 (not 404 or 500)
2. Verify JSON files are valid: `jq . public/.well-known/*.json`
3. Check markdown files have frontmatter: `head public/*.md`
4. Verify deployment completed successfully
5. Wait 5-10 minutes for scan cache to clear
6. Re-trigger scan manually

### If specific files not found:
- Ensure Next.js serves static files from `/public`
- Check Vercel deployment includes all files
- Verify `.gitignore` doesn't exclude them
- Test locally: `npm run dev` and visit URLs

### If validation errors:
- Run verification script: `./scripts/verify-orank-improvements.sh`
- Check JSON syntax: `jq . [file]`
- Verify markdown frontmatter syntax
- Ensure no trailing commas in JSON

## Support

- **orank API:** https://ora.ai/api/openapi.json
- **Score page:** https://ora.ai/score/titlewise.app
- **Methodology:** https://ora.ai/methodology
- **Issues:** Create GitHub issue or email hello@titlewise.app
