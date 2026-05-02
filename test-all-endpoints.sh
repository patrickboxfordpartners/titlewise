#!/bin/bash

# TitleWise API - Test All Endpoints
# Usage: ./test-all-endpoints.sh <API_KEY>

if [ -z "$1" ]; then
  echo "Usage: ./test-all-endpoints.sh <API_KEY>"
  echo "Example: ./test-all-endpoints.sh tw_live_abc123..."
  exit 1
fi

API_KEY="$1"
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TitleWise API v1 - Endpoint Test Suite  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:20}..."
echo ""

# Test 1: Analyze Title Commitment
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 1: POST /api/v1/analyze-commitment${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE\n\nSchedule A\n\n1. Policy Amount: $500,000.00\n2. Premium: $2,450.00\n3. Subject Property: 123 Main Street, Portsmouth, NH 03801\n4. Proposed Insured: John Smith and Jane Smith\n\nSchedule B - Requirements\n\n1. Payment of consideration.\n2. Proper execution and delivery of deed.\n3. Recording of deed in Rockingham County Registry of Deeds.\n4. Payment of recording fees.\n5. Satisfaction of existing mortgage held by First National Bank.\n\nSchedule B - Exceptions\n\n1. Rights or claims of parties in possession not shown by public records.\n2. Easements affecting the property, including a 10-foot utility easement along the rear property line.\n3. Outstanding mortgage in favor of First National Bank, Instrument No. 2020-1234, amount $350,000.\n4. Zoning ordinances and building restrictions.\n5. Real estate taxes for the current year, not yet due and payable.",
    "property_address": "123 Main Street, Portsmouth, NH 03801"
  }' | jq -r '.analysis.summary // .error'

echo ""
echo ""

# Test 2: Analyze Closing Disclosure
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 2: POST /api/v1/analyze-cd${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s -X POST "$BASE_URL/api/v1/analyze-cd" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "CLOSING DISCLOSURE\n\nLoan Terms\nLoan Amount: $400,000\nInterest Rate: 6.5%\nMonthly Principal & Interest: $2,528.27\nPrepayment Penalty: None\nBalloon Payment: None\n\nProjected Payments\nYears 1-7: $3,456/month (Principal, Interest, MI, Escrow)\nYears 8-30: $3,128/month (Principal, Interest, Escrow)\n\nCosts at Closing\nClosing Costs: $12,847\nCash to Close: $112,847\n\nLoan Costs\nA. Origination Charges: $3,200\n  - Origination Fee: $3,200\nB. Services Borrower Did Not Shop For: $2,847\n  - Appraisal Fee: $650\n  - Credit Report: $45\n  - Flood Certification: $12\n  - Tax Service: $90\n  - Title - Lender Title Insurance: $1,250\n  - Title - Settlement Agent Fee: $800\n\nOther Costs\nE. Taxes and Government Fees\n  - Recording Fees: $285\n  - Transfer Tax: $4,000\nF. Prepaids\n  - Homeowners Insurance Premium: $1,200\n  - Mortgage Insurance Premium: $320\n  - Prepaid Interest: $1,095\n  - Property Taxes: $900",
    "property_address": "456 Oak Avenue"
  }' | jq -r '.analysis.summary // .error'

echo ""
echo ""

# Test 3: Review HOA Documents
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 3: POST /api/v1/review-hoa${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s -X POST "$BASE_URL/api/v1/review-hoa" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "HOMEOWNERS ASSOCIATION DOCUMENTS\n\nMaple Ridge Condominium Association\nManaged by: Horizon Property Management\nContact: (603) 555-1234\n\nMonthly Assessment: $285\nSpecial Assessment (Roof Replacement): $3,500 due December 2026\n\nPet Policy:\n- Dogs and cats permitted\n- Maximum 2 pets per unit\n- Weight limit: 50 pounds per pet\n- Breed restrictions apply (contact management for list)\n\nRental Restrictions:\n- Minimum lease term: 6 months\n- Maximum 20% of units may be rented\n- Owner must submit tenant application for approval\n- Currently 18% of units are rented\n\nParking:\n- One assigned space per unit\n- Guest parking on first-come basis\n- No commercial vehicles, RVs, or boats\n- No overnight street parking\n\nFinancial Status (as of Q3 2026):\n- Reserve Fund: $247,000 (82% funded per reserve study)\n- Delinquent Owners: 3 units (4.2% of total)\n- Pending Litigation: None\n- Master Insurance: $2M liability coverage\n\nFHA/VA Status: FHA-approved as of January 2025\nOwner Occupancy: 78%",
    "property_address": "789 Maple Ridge Drive"
  }' | jq -r '.analysis.summary // .error'

echo ""
echo ""

# Test 4: Verify Wire Instructions
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 4: POST /api/v1/verify-wire${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s -X POST "$BASE_URL/api/v1/verify-wire" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_text": "WIRE TRANSFER INSTRUCTIONS\n\nBeneficiary: Seacoast Title & Escrow LLC\nBeneficiary Address: 100 Market Street, Portsmouth, NH 03801\n\nReceiving Bank: TD Bank\nABA Routing Number: 011400071\nAccount Number: ****1234\nAccount Type: Business Checking\n\nAmount: $112,847.00\n\nReference: Smith Purchase - 123 Main St\n\nIMPORTANT FRAUD WARNING:\nDO NOT wire funds without verbal confirmation.\nCall our office at (603) 555-0100 to verify these instructions.\nUse the phone number you have on file, NOT one provided in this email.\n\nWire fraud is common in real estate transactions.\nWe will NEVER send changes to wire instructions via email.\n\nQuestions? Contact:\nSarah Johnson, Closing Coordinator\nsarah@seacoasttitle.com\n(603) 555-0100 ext. 24",
    "expected_amount": 112847,
    "expected_beneficiary": "Seacoast Title & Escrow LLC"
  }' | jq -r '.analysis.summary // .error'

echo ""
echo ""

# Rate Limit Check
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Rate Limit Headers Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s -I -X POST "$BASE_URL/api/v1/analyze-commitment" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_text":"COMMITMENT FOR TITLE INSURANCE\nSchedule A\nPolicy Amount: $100,000\nProperty: Test\nThis is a minimal test commitment with just enough text to pass validation requirements."}' \
  | grep -E "X-RateLimit-|X-Response-Time-"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All tests complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
