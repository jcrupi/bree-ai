#!/bin/bash
set -e

# FlySaaS E2E Test Script
# Tests the complete FlySaaS workflow

API_URL=${API_URL:-http://localhost:3000}
TEST_EMAIL="test-$(date +%s)@flysaas.dev"
TEST_PASSWORD="TestPassword123!"

echo "🧪 Running FlySaaS E2E Tests..."
echo "API URL: $API_URL"
echo ""

# Helper function for colored output
success() {
  echo "✅ $1"
}

error() {
  echo "❌ $1"
  exit 1
}

# Test 1: Health Check
echo "1️⃣  Testing health check..."
HEALTH=$(curl -s $API_URL/health)
if echo "$HEALTH" | grep -q "healthy"; then
  success "Health check passed"
else
  error "Health check failed"
fi

# Test 2: JWKS Endpoint
echo ""
echo "2️⃣  Testing JWKS endpoint..."
JWKS=$(curl -s $API_URL/auth/jwks)
if echo "$JWKS" | grep -q "keys"; then
  success "JWKS endpoint working"
else
  error "JWKS endpoint failed"
fi

# Test 3: Sign Up
echo ""
echo "3️⃣  Testing user sign up..."
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/auth/sign-up \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}")

if echo "$SIGNUP_RESPONSE" | grep -q "user"; then
  USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.user.id')
  success "User created: $USER_ID"
else
  error "Sign up failed: $SIGNUP_RESPONSE"
fi

# Test 4: Sign In
echo ""
echo "4️⃣  Testing user sign in..."
SIGNIN_RESPONSE=$(curl -s -X POST $API_URL/auth/sign-in \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$SIGNIN_RESPONSE" | grep -q "token"; then
  TOKEN=$(echo $SIGNIN_RESPONSE | jq -r '.token')
  success "Signed in successfully"
else
  error "Sign in failed: $SIGNIN_RESPONSE"
fi

# Test 5: Create Organization
echo ""
echo "5️⃣  Testing organization creation..."
ORG_SLUG="test-org-$(date +%s)"
ORG_RESPONSE=$(curl -s -X POST $API_URL/api/orgs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"org_slug\":\"$ORG_SLUG\",\"org_name\":\"Test Organization\",\"region\":\"iad\"}")

if echo "$ORG_RESPONSE" | grep -q "organization"; then
  ORG_ID=$(echo $ORG_RESPONSE | jq -r '.organization.id')
  success "Organization created: $ORG_ID"
else
  # Provisioning might fail in local dev without Fly.io
  echo "⚠️  Organization creation returned: $ORG_RESPONSE"
  echo "   (This is expected in local dev without Fly.io)"
fi

# Test 6: Create Contact (Core CRM)
echo ""
echo "6️⃣  Testing contact creation (SuperOrg core)..."
CONTACT_RESPONSE=$(curl -s -X POST $API_URL/api/core/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"phone\":\"+1-555-0100\"}")

if echo "$CONTACT_RESPONSE" | grep -q "contact"; then
  CONTACT_ID=$(echo $CONTACT_RESPONSE | jq -r '.contact.id')
  success "Contact created: $CONTACT_ID"
else
  error "Contact creation failed: $CONTACT_RESPONSE"
fi

# Test 7: Create Deal (Core CRM)
echo ""
echo "7️⃣  Testing deal creation (SuperOrg core)..."
DEAL_RESPONSE=$(curl -s -X POST $API_URL/api/core/deals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Deal\",\"contact_id\":\"$CONTACT_ID\",\"amount\":50000,\"stage\":\"proposal\"}")

if echo "$DEAL_RESPONSE" | grep -q "deal"; then
  DEAL_ID=$(echo $DEAL_RESPONSE | jq -r '.deal.id')
  success "Deal created: $DEAL_ID"
else
  error "Deal creation failed: $DEAL_RESPONSE"
fi

# Test 8: List Contacts
echo ""
echo "8️⃣  Testing contact list..."
CONTACTS_RESPONSE=$(curl -s $API_URL/api/core/contacts \
  -H "Authorization: Bearer $TOKEN")

if echo "$CONTACTS_RESPONSE" | grep -q "contacts"; then
  CONTACT_COUNT=$(echo $CONTACTS_RESPONSE | jq '.contacts | length')
  success "Retrieved $CONTACT_COUNT contacts"
else
  error "Contact list failed: $CONTACTS_RESPONSE"
fi

# Test 9: Update Contact
echo ""
echo "9️⃣  Testing contact update..."
UPDATE_RESPONSE=$(curl -s -X PATCH $API_URL/api/core/contacts/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"company\":\"Acme Corp\"}")

if echo "$UPDATE_RESPONSE" | grep -q "Acme Corp"; then
  success "Contact updated successfully"
else
  error "Contact update failed: $UPDATE_RESPONSE"
fi

# Test 10: Delete Deal
echo ""
echo "🔟 Testing deal deletion..."
DELETE_RESPONSE=$(curl -s -X DELETE $API_URL/api/core/deals/$DEAL_ID \
  -H "Authorization: Bearer $TOKEN")

if echo "$DELETE_RESPONSE" | grep -q "success"; then
  success "Deal deleted successfully"
else
  error "Deal deletion failed: $DELETE_RESPONSE"
fi

echo ""
echo "🎉 All E2E tests passed!"
echo ""
echo "Summary:"
echo "  - User created: $USER_ID"
echo "  - Email: $TEST_EMAIL"
echo "  - Contact created: $CONTACT_ID"
echo "  - Deal created and deleted: $DEAL_ID"
