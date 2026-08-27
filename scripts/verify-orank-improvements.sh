#!/bin/bash

# Verify orank improvements are in place
# Run this script to check that all files exist and are accessible

set -e

DOMAIN="https://titlewise.app"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔍 Verifying orank improvements for TitleWise"
echo "=============================================="
echo ""

# Check for new files
echo "📁 Checking new files exist..."
FILES=(
  "public/.well-known/ard.json"
  "public/.well-known/agent-card.json"
  "public/.well-known/oauth-protected-resource"
  "public/.well-known/oauth-authorization-server"
  "public/.well-known/api-catalog"
  "public/pricing.md"
  "public/about.md"
  "public/contact.md"
  "public/privacy.md"
  "public/index.md"
  "public/schemamap.xml"
)

for file in "${FILES[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ Missing: $file"
  fi
done

echo ""
echo "📝 Checking modified files..."
MODIFIED=(
  "public/.well-known/ai-catalog.json"
  "public/.well-known/mcp/server-card.json"
  "public/.well-known/agent-skills/index.json"
  "public/llms.txt"
  "public/robots.txt"
  "public/auth.md"
  "app/page.tsx"
  "app/sitemap.ts"
  "app/layout.tsx"
)

for file in "${MODIFIED[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ⚠️  Not found: $file"
  fi
done

echo ""
echo "🔎 Checking file contents..."

# Check ai-catalog has displayName
if grep -q '"displayName"' "$BASE_DIR/public/.well-known/ai-catalog.json"; then
  echo "  ✅ ai-catalog.json has displayName"
else
  echo "  ❌ ai-catalog.json missing displayName"
fi

# Check ard.json has identifier
if grep -q '"identifier"' "$BASE_DIR/public/.well-known/ard.json"; then
  echo "  ✅ ard.json uses identifier (not id)"
else
  echo "  ❌ ard.json missing identifier"
fi

# Check agent-skills has digests
if grep -q '"digest".*"sha256:' "$BASE_DIR/public/.well-known/agent-skills/index.json"; then
  echo "  ✅ agent-skills/index.json has SHA256 digests"
else
  echo "  ❌ agent-skills/index.json missing digests"
fi

# Check llms.txt has markdown links
if grep -q '\[.*\](https://' "$BASE_DIR/public/llms.txt"; then
  echo "  ✅ llms.txt has markdown links"
else
  echo "  ❌ llms.txt missing markdown links"
fi

# Check llms.txt has "When to Use" section
if grep -q 'When to Use' "$BASE_DIR/public/llms.txt"; then
  echo "  ✅ llms.txt has 'When to Use' section"
else
  echo "  ❌ llms.txt missing 'When to Use' section"
fi

# Check robots.txt has schemamap
if grep -q 'Schemamap:' "$BASE_DIR/public/robots.txt"; then
  echo "  ✅ robots.txt has schemamap directive"
else
  echo "  ❌ robots.txt missing schemamap"
fi

# Check markdown files have frontmatter
for md in pricing.md about.md contact.md privacy.md auth.md index.md; do
  if head -n 1 "$BASE_DIR/public/$md" | grep -q '^---$'; then
    echo "  ✅ $md has frontmatter"
  else
    echo "  ❌ $md missing frontmatter"
  fi
done

# Check page.tsx has enhanced contactPoint
if grep -q '"contactPoint":.*\[' "$BASE_DIR/app/page.tsx"; then
  echo "  ✅ page.tsx has multiple contactPoint entries"
else
  echo "  ⚠️  page.tsx may not have enhanced contactPoint"
fi

# Check MCP server-card has root-level fields
if grep -q '"name".*:.*"titlewise"' "$BASE_DIR/public/.well-known/mcp/server-card.json" && \
   grep -q '"serverUrl"' "$BASE_DIR/public/.well-known/mcp/server-card.json"; then
  echo "  ✅ mcp/server-card.json has root-level name and serverUrl"
else
  echo "  ❌ mcp/server-card.json missing root-level fields"
fi

echo ""
echo "✨ File verification complete!"
echo ""
echo "🌐 After deployment, verify URLs are accessible:"
echo "   $DOMAIN/.well-known/ard.json"
echo "   $DOMAIN/.well-known/agent-card.json"
echo "   $DOMAIN/pricing.md"
echo "   $DOMAIN/about.md"
echo "   $DOMAIN/contact.md"
echo "   $DOMAIN/privacy.md"
echo "   $DOMAIN/index.md"
echo ""
echo "🔄 To rescan with orank:"
echo "   curl -X POST https://ora.ai/api/scan -H 'Content-Type: application/json' -d '{\"url\": \"titlewise.app\"}'"
echo ""
echo "📊 To check score:"
echo "   curl https://ora.ai/api/score/titlewise.app"
echo ""
