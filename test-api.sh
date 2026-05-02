#!/bin/bash

# TitleWise API Test Script
# Usage: ./test-api.sh <API_KEY>

if [ -z "$1" ]; then
  echo "Usage: ./test-api.sh <API_KEY>"
  echo "Example: ./test-api.sh tw_live_abc123..."
  exit 1
fi

API_KEY="$1"
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing TitleWise API v1${NC}"
echo "================================"
echo ""

# Test 1: Missing Authorization header
echo -e "${YELLOW}Test 1: Missing Authorization header${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Content-Type: application/json" \
  -d '{"document_text":"test"}' | jq .

echo ""
echo ""

# Test 2: Invalid API key format
echo -e "${YELLOW}Test 2: Invalid API key format${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer invalid_key" \
  -H "Content-Type: application/json" \
  -d '{"document_text":"test"}' | jq .

echo ""
echo ""

# Test 3: Valid API key - Analyze commitment
echo -e "${YELLOW}Test 3: Valid API key - Analyze commitment${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000.00\n2. Premium: $2,450.00\n3. Subject Property: 123 Main Street, Portsmouth, NH 03801\n4. Proposed Insured: John Smith and Jane Smith\n\nSchedule B - Requirements\n\n1. Payment of consideration.\n2. Proper execution and delivery of deed.\n3. Recording of deed in Rockingham County Registry of Deeds.\n4. Payment of recording fees.\n\nSchedule B - Exceptions\n\n1. Rights or claims of parties in possession not shown by public records.\n2. Easements affecting the property, including a 10-foot utility easement along the rear property line.\n3. Outstanding mortgage in favor of First National Bank, Instrument No. 2020-1234, amount $350,000.\n4. Zoning ordinances and building restrictions.",
    "property_address": "123 Main Street, Portsmouth, NH 03801"
  }' -i

echo ""
echo ""

# Test 4: Check rate limit headers
echo -e "${YELLOW}Test 4: Check rate limit headers${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\nSchedule A\nPolicy Amount: $100,000\nProperty: 456 Oak St\nThis is a minimal test commitment with just enough text to pass validation requirements for the API endpoint."
  }' -I

echo ""
echo -e "${GREEN}Tests complete!${NC}"
