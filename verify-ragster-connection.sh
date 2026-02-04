#!/bin/bash
# Verify that Keen and Genius are properly hooked up to Ragster on fly.io

echo "🔍 Verifying Ragster Connection for Keen and Genius Apps"
echo "=========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local headers=$3
    
    echo -n "Testing $name... "
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json $headers "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    fi
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        return 1
    fi
}

# 1. Check Ragster Health
echo "1. Checking Ragster Service Health..."
check_endpoint "Ragster Health" "https://agent-collective-ragster.fly.dev/api/health"
echo ""

# 2. Check Keen.ai Ragster Connection
echo "2. Checking Keen.ai Ragster Connection..."
check_endpoint "Keen Collections" \
    "https://agent-collective-ragster.fly.dev/api/collections?org_id=keen.ai" \
    "-H 'x-org-id: keen.ai' -H 'x-user-id: user@keen.ai'"
cat /tmp/response.json | jq -r '"  Collections found: \(.count)"' 2>/dev/null || echo "  Collections found: 0"
echo ""

# 3. Check Genius Talent Ragster Connection
echo "3. Checking Genius Talent Ragster Connection..."
check_endpoint "Genius Collections" \
    "https://agent-collective-ragster.fly.dev/api/collections?org_id=genius-talent" \
    "-H 'x-org-id: genius-talent' -H 'x-user-id: user@genius-talent.com'"
cat /tmp/response.json | jq -r '"  Collections found: \(.count)"' 2>/dev/null || echo "  Collections found: 0"
echo ""

# 4. Verify Environment Configuration
echo "4. Verifying Environment Files..."
echo ""
echo "Keen.ai (.env.local):"
if [ -f "apps/keen-ai/.env.local" ]; then
    grep "RAGSTER" apps/keen-ai/.env.local | while read line; do
        echo "  $line"
    done
    echo -e "  ${GREEN}✓ File exists${NC}"
else
    echo -e "  ${RED}✗ File not found${NC}"
fi
echo ""

echo "Genius Talent (.env.local):"
if [ -f "apps/genius-talent/.env.local" ]; then
    grep "RAGSTER" apps/genius-talent/.env.local | while read line; do
        echo "  $line"
    done
    echo -e "  ${GREEN}✓ File exists${NC}"
else
    echo -e "  ${RED}✗ File not found${NC}"
fi
echo ""

# 5. Summary
echo "=========================================================="
echo -e "${YELLOW}Summary:${NC}"
echo "- Ragster is deployed at: https://agent-collective-ragster.fly.dev"
echo "- Keen.ai is configured to use org_id: keen.ai"
echo "- Genius Talent is configured to use org_id: genius-talent"
echo ""
echo "To test the apps:"
echo "  - For Keen: cd apps/keen-ai && bun run dev"
echo "  - For Genius: cd apps/genius-talent && bun run dev"
echo ""
echo "Once running, open Admin Settings and check:"
echo "  1. Identity (AM) tab - Should connect to AntiMatter"
echo "  2. Admin Stuff tab - Should show Ragster collections"
echo "=========================================================="

# Cleanup
rm -f /tmp/response.json
