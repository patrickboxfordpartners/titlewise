#!/bin/bash

# test-integration.sh - Full integration test suite
# Tests: API Keys, Rate Limiting, All Endpoints, Webhooks, Error Handling
# Usage: ./test-integration.sh

BASE_URL="http://localhost:3000"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TitleWise API - Integration Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Prerequisites:"
echo "  - Dev server running (npm run dev)"
echo "  - Logged in as Enterprise user"
echo "  - API key generated in Settings"
echo ""
read -p "Enter your API key: " API_KEY

if [ -z "$API_KEY" ]; then
  echo "❌ API key required"
  exit 1
fi

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

function test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local payload="$3"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Test $TOTAL_TESTS: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Status: $HTTP_CODE"
    echo "$BODY" | jq -r '.analysis.summary' 2>/dev/null || echo "$BODY" | jq '.error' 2>/dev/null
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "❌ Status: $HTTP_CODE"
    echo "$BODY" | jq '.'
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  # Extract rate limit headers
  RATE_LIMIT_REMAINING=$(curl -s -I -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null | grep -i "x-ratelimit-remaining" | cut -d' ' -f2 | tr -d '\r')

  if [ -n "$RATE_LIMIT_REMAINING" ]; then
    echo "Rate limit remaining: $RATE_LIMIT_REMAINING"
  fi
}

# Test 1: Analyze Title Commitment
test_endpoint \
  "POST /api/v1/analyze-commitment" \
  "/api/v1/analyze-commitment" \
  '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000.00\n2. Premium: $2,450.00\n3. Subject Property: 123 Main Street, Portsmouth, NH 03801\n4. Proposed Insured: John Smith and Jane Smith\n\nSchedule B - Requirements\n\n1. Payment of consideration.\n2. Proper execution and delivery of deed.\n\nSchedule B - Exceptions\n\n1. Rights or claims of parties in possession not shown by public records.\n2. Outstanding mortgage in favor of First National Bank, amount $350,000.",
    "property_address": "123 Main Street, Portsmouth, NH 03801"
  }'

# Test 2: Analyze Closing Disclosure
test_endpoint \
  "POST /api/v1/analyze-cd" \
  "/api/v1/analyze-cd" \
  '{
    "document_text": "CLOSING DISCLOSURE\n\nClosing Information\nDate Issued: 2026-04-15\nClosing Date: 2026-04-22\nDisbursement Date: 2026-04-22\n\nTransaction Information\nBorrower: John Smith\nSeller: Jane Doe\nLender: First National Bank\n\nLoan Terms\nLoan Amount: $400,000\nInterest Rate: 6.5%\nMonthly Principal & Interest: $2,528.27\n\nClosing Costs\nOrigination Charges: $4,000\nTitle Services: $1,850\nRecording Fees: $385\nTotal Closing Costs: $12,450",
    "property_address": "456 Oak Avenue, Dover, NH"
  }'

# Test 3: Review HOA Documents
test_endpoint \
  "POST /api/v1/review-hoa" \
  "/api/v1/review-hoa" \
  '{
    "document_text": "HOMEOWNERS ASSOCIATION DOCUMENTS\n\nMaple Ridge Condominium Association\n\nMonthly Assessment: $285\nSpecial Assessment: None\nReserve Fund: $450,000 (72% funded)\n\nRules & Restrictions\n- No short-term rentals (minimum 6-month lease)\n- Pet policy: 2 pets maximum, under 50 lbs\n- Parking: 2 assigned spaces per unit\n\nFHA Approved: Yes\nVA Approved: Yes\n\nFinancial Health: Strong\nDelinquency Rate: 2% (industry avg: 5%)",
    "property_address": "789 Maple Ridge Drive #12"
  }'

# Test 4: Verify Wire Instructions
test_endpoint \
  "POST /api/v1/verify-wire" \
  "/api/v1/verify-wire" \
  '{
    "document_text": "WIRE TRANSFER INSTRUCTIONS\n\n⚠️ IMPORTANT: Always call us at (603) 555-1234 to verify these instructions before wiring funds.\n\nBeneficiary: Seacoast Title & Escrow LLC\nBank Name: TD Bank\nRouting Number: 011400071\nAccount Number: ****7890\nAmount: $112,847.00\n\nReference: 123 Main Street Closing\nClosing Date: 2026-04-22",
    "expected_amount": 112847,
    "expected_beneficiary": "Seacoast Title"
  }'

# Test 5: Error Handling - Missing Auth Header
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test $TOTAL_TESTS: Missing Authorization header"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERROR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "test"}')

ERROR_CODE=$(echo "$ERROR_RESPONSE" | tail -n1)
ERROR_BODY=$(echo "$ERROR_RESPONSE" | head -n-1)

if [ "$ERROR_CODE" = "401" ]; then
  echo "✓ Status: $ERROR_CODE (expected)"
  echo "$ERROR_BODY" | jq '.error'
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Status: $ERROR_CODE (expected 401)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 6: Error Handling - Invalid API Key
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test $TOTAL_TESTS: Invalid API key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer tw_live_invalid123456" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "test"}')

INVALID_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
INVALID_BODY=$(echo "$INVALID_RESPONSE" | head -n-1)

if [ "$INVALID_CODE" = "401" ]; then
  echo "✓ Status: $INVALID_CODE (expected)"
  echo "$INVALID_BODY" | jq '.error'
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Status: $INVALID_CODE (expected 401)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 7: Error Handling - Invalid Request Body
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test $TOTAL_TESTS: Invalid request body (too short)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SHORT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "short"}')

SHORT_CODE=$(echo "$SHORT_RESPONSE" | tail -n1)
SHORT_BODY=$(echo "$SHORT_RESPONSE" | head -n-1)

if [ "$SHORT_CODE" = "400" ]; then
  echo "✓ Status: $SHORT_CODE (expected)"
  echo "$SHORT_BODY" | jq '.error'
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Status: $SHORT_CODE (expected 400)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 8: Rate Limit Headers Present
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test $TOTAL_TESTS: Rate limit headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEADERS=$(curl -s -I -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000"}' 2>/dev/null)

LIMIT=$(echo "$HEADERS" | grep -i "x-ratelimit-limit" | cut -d' ' -f2 | tr -d '\r')
REMAINING=$(echo "$HEADERS" | grep -i "x-ratelimit-remaining" | cut -d' ' -f2 | tr -d '\r')
RESET=$(echo "$HEADERS" | grep -i "x-ratelimit-reset" | cut -d' ' -f2 | tr -d '\r')

if [ -n "$LIMIT" ] && [ -n "$REMAINING" ] && [ -n "$RESET" ]; then
  echo "✓ Rate limit headers present"
  echo "  Limit: $LIMIT"
  echo "  Remaining: $REMAINING"
  echo "  Reset: $RESET ($(date -r $RESET 2>/dev/null || echo 'N/A'))"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "❌ Missing rate limit headers"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total:  $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
