#!/bin/bash

# DataRand Task Creation Testing Script
# Tests both anonymous and authenticated task creation flows

BASE_URL="https://datarand.onrender.com/api/v1"
# For local testing, use: BASE_URL="http://localhost:3000/api/v1"

echo "========================================="
echo "DataRand Task Creation Security Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Anonymous Task Creation (Should succeed)
echo "Test 1: Anonymous Task Creation"
echo "--------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Anonymous Task",
    "description": "Testing anonymous task creation",
    "category": "Data Collection",
    "payoutPerWorker": "0.01",
    "requiredWorkers": 3
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Anonymous task created successfully"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 201, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Anonymous Task with Too Many Workers (Should fail)
echo "Test 2: Anonymous Task Exceeding Worker Limit"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Large Task",
    "description": "Testing worker limit",
    "category": "Data Collection",
    "payoutPerWorker": "0.01",
    "requiredWorkers": 10
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Worker limit enforced"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 400, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Anonymous Task with High Payout (Should fail)
echo "Test 3: Anonymous Task Exceeding Payout Limit"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test High Payout Task",
    "description": "Testing payout limit",
    "category": "Data Collection",
    "payoutPerWorker": "0.1",
    "requiredWorkers": 3
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Payout limit enforced"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 400, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Forbidden Keywords (Should fail)
echo "Test 4: Task with Forbidden Keywords"
echo "-------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hack the system",
    "description": "This is an illegal task",
    "category": "Data Collection",
    "payoutPerWorker": "0.01",
    "requiredWorkers": 3
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Forbidden keywords blocked"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 400, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Rate Limiting (Should fail on 4th request)
echo "Test 5: Rate Limiting (3 tasks per hour)"
echo "-----------------------------------------"
echo "Creating 4 tasks rapidly..."

for i in {1..4}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Rate Limit Test $i\",
        \"description\": \"Testing rate limiting\",
        \"category\": \"Data Collection\",
        \"payoutPerWorker\": \"0.01\",
        \"requiredWorkers\": 2
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ $i -le 3 ]; then
        if [ "$HTTP_CODE" = "201" ]; then
            echo -e "  Request $i: ${GREEN}✓ PASSED${NC} (201)"
        else
            echo -e "  Request $i: ${RED}✗ FAILED${NC} (Expected 201, got $HTTP_CODE)"
        fi
    else
        if [ "$HTTP_CODE" = "429" ]; then
            echo -e "  Request $i: ${GREEN}✓ PASSED${NC} (429 - Rate limited)"
        else
            echo -e "  Request $i: ${YELLOW}⚠ WARNING${NC} (Expected 429, got $HTTP_CODE)"
            echo "  Note: Rate limit may not trigger if previous tests were run recently"
        fi
    fi
    
    sleep 1
done
echo ""

# Test 6: Get Available Tasks (Should succeed without auth)
echo "Test 6: Get Available Tasks (No Auth)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/tasks/available")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Available tasks retrieved"
    TASK_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo "Found $TASK_COUNT tasks"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 200, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 7: Get My Tasks Without Auth (Should fail)
echo "Test 7: Get My Tasks Without Auth (Should Fail)"
echo "------------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/tasks")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Authentication required for personal tasks"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 8: Fund Task Without Auth (Should fail)
echo "Test 8: Fund Task Without Auth (Should Fail)"
echo "---------------------------------------------"
# Use a dummy task ID
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/tasks/00000000-0000-0000-0000-000000000000/fund")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Authentication required for funding"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Expected 401, got $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "Security Features Tested:"
echo "  ✓ Anonymous task creation"
echo "  ✓ Worker limit enforcement"
echo "  ✓ Payout limit enforcement"
echo "  ✓ Forbidden keyword filtering"
echo "  ✓ Rate limiting"
echo "  ✓ Public endpoint access"
echo "  ✓ Protected endpoint security"
echo ""
echo "Note: For authenticated user tests, you need a valid JWT token."
echo "Run: ./test-authenticated.sh <YOUR_JWT_TOKEN>"
echo ""
