#!/bin/bash

# test-webhooks.sh - Webhook testing script
# Usage: ./test-webhooks.sh <api_key> <webhook_secret>

API_KEY="${1:-}"
WEBHOOK_SECRET="${2:-}"

if [ -z "$API_KEY" ]; then
  echo "❌ Usage: $0 <api_key> [webhook_secret]"
  exit 1
fi

BASE_URL="http://localhost:3000"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TitleWise Webhook Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Start local webhook receiver (if not already running)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Start webhook receiver"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Starting nc listener on port 8080..."
echo "(This will receive webhook POSTs)"
echo ""

# Start receiver in background
nc -l 8080 > /tmp/webhook-test.log 2>&1 &
RECEIVER_PID=$!
echo "✓ Receiver started (PID: $RECEIVER_PID)"
sleep 1

# Test 2: Create webhook pointing to local receiver
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Create webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:8080/webhook",
    "events": ["analysis.completed", "analysis.failed"]
  }')

echo "$WEBHOOK_RESPONSE" | jq '.'

WEBHOOK_SECRET_RETURNED=$(echo "$WEBHOOK_RESPONSE" | jq -r '.secret // empty')
WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id // empty')

if [ -n "$WEBHOOK_SECRET_RETURNED" ]; then
  echo ""
  echo "✓ Webhook created"
  echo "  ID: $WEBHOOK_ID"
  echo "  Secret: $WEBHOOK_SECRET_RETURNED"
  WEBHOOK_SECRET="$WEBHOOK_SECRET_RETURNED"
else
  echo "❌ Failed to create webhook"
  kill $RECEIVER_PID 2>/dev/null
  exit 1
fi

# Test 3: Trigger analysis (which should fire webhook)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Trigger API analysis (fires webhook)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ANALYSIS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000.00\n2. Premium: $2,450.00\n3. Subject Property: 123 Main Street, Portsmouth, NH 03801\n4. Proposed Insured: John Smith and Jane Smith\n\nSchedule B - Requirements\n\n1. Payment of consideration.\n2. Proper execution and delivery of deed.\n\nSchedule B - Exceptions\n\n1. Rights or claims of parties in possession not shown by public records.\n2. Outstanding mortgage in favor of First National Bank, amount $350,000.",
    "property_address": "123 Main Street, Portsmouth, NH 03801"
  }')

echo "$ANALYSIS_RESPONSE" | jq '.analysis.summary'

ANALYSIS_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.id // empty')

if [ -n "$ANALYSIS_ID" ]; then
  echo ""
  echo "✓ Analysis completed (ID: $ANALYSIS_ID)"
  echo "  Waiting for webhook delivery..."
  sleep 3
else
  echo "❌ Analysis failed"
  kill $RECEIVER_PID 2>/dev/null
  exit 1
fi

# Test 4: Check webhook was received
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Verify webhook received"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill receiver to flush log
kill $RECEIVER_PID 2>/dev/null
sleep 1

if [ -f /tmp/webhook-test.log ] && [ -s /tmp/webhook-test.log ]; then
  echo "✓ Webhook received:"
  echo ""
  cat /tmp/webhook-test.log
  echo ""

  # Extract signature header if present
  SIGNATURE=$(grep -i "X-Webhook-Signature:" /tmp/webhook-test.log | cut -d' ' -f2 | tr -d '\r')
  if [ -n "$SIGNATURE" ]; then
    echo "  Signature: $SIGNATURE"
  fi

  # Extract event header
  EVENT=$(grep -i "X-Webhook-Event:" /tmp/webhook-test.log | cut -d' ' -f2 | tr -d '\r')
  if [ -n "$EVENT" ]; then
    echo "  Event: $EVENT"
  fi
else
  echo "❌ No webhook received (check if endpoint is reachable)"
fi

# Test 5: List webhooks
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: List webhooks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/webhooks" \
  -H "Authorization: Bearer $API_KEY")

echo "$LIST_RESPONSE" | jq '.'

WEBHOOK_COUNT=$(echo "$LIST_RESPONSE" | jq '.webhooks | length')
echo ""
echo "✓ Webhooks listed: $WEBHOOK_COUNT total"

# Test 6: Disable webhook
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Disable webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DISABLE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/webhooks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$WEBHOOK_ID\",
    \"isActive\": \"false\"
  }")

echo "$DISABLE_RESPONSE" | jq '.'
echo "✓ Webhook disabled"

# Test 7: Re-enable webhook
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 7: Re-enable webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENABLE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/webhooks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$WEBHOOK_ID\",
    \"isActive\": \"true\"
  }")

echo "$ENABLE_RESPONSE" | jq '.'
echo "✓ Webhook re-enabled"

# Test 8: Delete webhook
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 8: Delete webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/webhooks?id=$WEBHOOK_ID" \
  -H "Authorization: Bearer $API_KEY")

echo "$DELETE_RESPONSE" | jq '.'
echo "✓ Webhook deleted"

# Cleanup
rm -f /tmp/webhook-test.log

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ All webhook tests complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
