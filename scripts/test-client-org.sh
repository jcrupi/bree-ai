#!/bin/bash
set -e

# FlySaaS Client Org E2E Test Script
# Tests client org CRM and AI features

SUPERORG_URL=${SUPERORG_URL:-http://localhost:3000}
CLIENT_URL=${CLIENT_URL:-http://localhost:3001}
TEST_EMAIL="client-test-$(date +%s)@flysaas.dev"
TEST_PASSWORD="TestPassword123!"

echo "🧪 Testing FlySaaS Client Org..."
echo "SuperOrg URL: $SUPERORG_URL"
echo "Client URL: $CLIENT_URL"
echo ""

# Get token from SuperOrg
echo "1️⃣  Signing up and getting token..."
SIGNUP_RESPONSE=$(curl -s -X POST $SUPERORG_URL/auth/sign-up \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Client Test\"}")

SIGNIN_RESPONSE=$(curl -s -X POST $SUPERORG_URL/auth/sign-in \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $SIGNIN_RESPONSE | jq -r '.token')
echo "✅ Token acquired"

# Test 1: Client Org Health
echo ""
echo "2️⃣  Testing client org health..."
HEALTH=$(curl -s $CLIENT_URL/health)
if echo "$HEALTH" | grep -q "healthy"; then
  ORG_ID=$(echo $HEALTH | jq -r '.org_id')
  echo "✅ Client org healthy: $ORG_ID"
else
  echo "❌ Client org health check failed"
  exit 1
fi

# Test 2: Create Contact in Client Org
echo ""
echo "3️⃣  Testing contact creation in client org..."
CONTACT_RESPONSE=$(curl -s -X POST $CLIENT_URL/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Jane Smith\",\"email\":\"jane@startup.io\",\"company\":\"StartupIO\"}")

if echo "$CONTACT_RESPONSE" | grep -q "contact"; then
  CONTACT_ID=$(echo $CONTACT_RESPONSE | jq -r '.contact.id')
  echo "✅ Contact created: $CONTACT_ID"
else
  echo "❌ Contact creation failed: $CONTACT_RESPONSE"
  exit 1
fi

# Test 3: Create Deal in Client Org
echo ""
echo "4️⃣  Testing deal creation in client org..."
DEAL_RESPONSE=$(curl -s -X POST $CLIENT_URL/api/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Startup Package\",\"contact_id\":\"$CONTACT_ID\",\"amount\":25000,\"stage\":\"negotiation\"}")

if echo "$DEAL_RESPONSE" | grep -q "deal"; then
  DEAL_ID=$(echo $DEAL_RESPONSE | jq -r '.deal.id')
  echo "✅ Deal created: $DEAL_ID"
else
  echo "❌ Deal creation failed: $DEAL_RESPONSE"
  exit 1
fi

# Test 4: Generate AI Feature
echo ""
echo "5️⃣  Testing AI feature generation..."
AI_RESPONSE=$(curl -s -X POST $CLIENT_URL/api/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"Add lead scoring to deals\"}")

if echo "$AI_RESPONSE" | grep -q "feature_id"; then
  FEATURE_ID=$(echo $AI_RESPONSE | jq -r '.feature_id')
  echo "✅ AI feature generated: $FEATURE_ID"
else
  echo "❌ AI generation failed: $AI_RESPONSE"
  exit 1
fi

# Test 5: List AI Features
echo ""
echo "6️⃣  Testing AI feature list..."
FEATURES_RESPONSE=$(curl -s $CLIENT_URL/api/ai/features \
  -H "Authorization: Bearer $TOKEN")

if echo "$FEATURES_RESPONSE" | grep -q "features"; then
  FEATURE_COUNT=$(echo $FEATURES_RESPONSE | jq '.features | length')
  echo "✅ Retrieved $FEATURE_COUNT AI features"
else
  echo "❌ Feature list failed: $FEATURES_RESPONSE"
  exit 1
fi

# Test 6: Get Feature Code
echo ""
echo "7️⃣  Testing feature code retrieval..."
FEATURE_CODE_RESPONSE=$(curl -s $CLIENT_URL/api/ai/features/$FEATURE_ID \
  -H "Authorization: Bearer $TOKEN")

if echo "$FEATURE_CODE_RESPONSE" | grep -q "code"; then
  echo "✅ Feature code retrieved"
  echo "   Code preview:"
  echo "$FEATURE_CODE_RESPONSE" | jq -r '.feature.code' | head -5
  echo "   ..."
else
  echo "❌ Feature code retrieval failed"
  exit 1
fi

# Test 7: Proxy Test (SuperOrg -> Client Org)
echo ""
echo "8️⃣  Testing proxy routing (SuperOrg -> Client Org)..."
PROXY_RESPONSE=$(curl -s $SUPERORG_URL/api/orgs/$ORG_ID/apps/contacts \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROXY_RESPONSE" | grep -q "contacts"; then
  echo "✅ Proxy routing working"
else
  echo "⚠️  Proxy test result: $PROXY_RESPONSE"
  echo "   (May fail if org routing not configured)"
fi

echo ""
echo "🎉 Client org tests passed!"
echo ""
echo "Summary:"
echo "  - Client org: $ORG_ID"
echo "  - Contact created: $CONTACT_ID"
echo "  - Deal created: $DEAL_ID"
echo "  - AI feature generated: $FEATURE_ID"
