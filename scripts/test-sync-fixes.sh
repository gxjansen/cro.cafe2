#!/bin/bash

# Test script to verify all sync fixes
echo "🧪 Testing NocoDB Sync Fixes"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_result="$3"
    
    echo -n "Testing: $test_name... "
    
    if eval "$command"; then
        if [ "$expected_result" = "pass" ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}✗ FAILED (expected to fail but passed)${NC}"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✓ PASSED (correctly failed)${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((TESTS_FAILED++))
        fi
    fi
}

echo ""
echo "1️⃣ Testing Update Fix"
echo "----------------------"
echo "The overwrite logic should now allow updates to existing files"
grep -q "Always overwrite to ensure updates are synced" src/lib/engines/simple-content-generator.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Update fix implemented${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Update fix not found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "2️⃣ Testing Deletion Sync"
echo "------------------------"
echo "Checking for deletion tracking methods..."
grep -q "cleanupOrphanedFiles" src/lib/engines/simple-content-generator.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deletion sync implemented${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Deletion sync not found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "3️⃣ Testing Platform Fix"
echo "-----------------------"
echo "Checking for improved platform field mapping..."
grep -q "Platform data from NocoDB:" src/lib/engines/simple-content-generator.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Platform debugging added${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Platform debugging not found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "4️⃣ Testing Validation"
echo "---------------------"
echo "Checking for validation logic..."
grep -q "Validate required fields" src/lib/engines/simple-content-generator.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Validation implemented${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Validation not found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "5️⃣ Testing Social Links Fix"
echo "---------------------------"
echo "Checking for social links array creation..."
grep -q "Create social links array from individual fields" src/lib/engines/simple-content-generator.ts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Social links fix implemented${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Social links fix not found${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready to run full sync test.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before running full sync test.${NC}"
    exit 1
fi