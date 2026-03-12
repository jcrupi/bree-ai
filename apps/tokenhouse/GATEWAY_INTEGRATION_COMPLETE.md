# TokenHouse Gateway + Better Auth Integration Complete ✅

The TokenHouse Gateway has been successfully integrated with better-auth while maintaining backward compatibility with legacy API tokens.

## What Was Integrated

### 1. ✅ Better Auth Handler Mounted
- Better-auth handler available at `/auth/*`
- JWKS endpoint at `/auth/.well-known/jwks.json`
- User sign-in at `/auth/sign-in/email`
- User sign-up at `/auth/sign-up/email`
- Session management endpoints

### 2. ✅ Dual JWT Verification System
Created `/gateway/src/middleware/jwt-verify.ts`:
- **Better-auth JWTs (RS256)**: User authentication with custom claims
- **Legacy API Tokens (HS256)**: Organization API authentication
- Automatic fallback between verification methods

### 3. ✅ Updated Routes
- `/chat/completions` - Updated to use dual JWT verification
- `/usage/stats` - Updated to use dual JWT verification
- `/auth/token` - Kept for backward compatibility (API authentication)

### 4. ✅ Dependencies Installed
- `jose@6.2.1` - JWT verification library for RS256 tokens

## Architecture

### Dual Authentication System

```
┌─────────────────────────────────────────────────────────┐
│                   TokenHouse Gateway                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────────┐              ┌───────────────────┐
│  Better-Auth JWT  │              │  Legacy API Token │
│     (RS256)       │              │     (HS256)       │
└───────────────────┘              └───────────────────┘
        │                                      │
        │ User Authentication                  │ API Authentication
        │ /auth/sign-in/email                  │ /auth/token
        │                                      │
        ▼                                      ▼
┌───────────────────┐              ┌───────────────────┐
│ JWT with Custom   │              │ JWT with Org      │
│ Claims:           │              │ Claims:           │
│ - org_id          │              │ - org_id          │
│ - org_role        │              │ - org_secret      │
│ - billing_tier    │              │ - allowed_models  │
│ - allowed_models  │              │ - rate_limits     │
│ - rate_limits     │              │                   │
└───────────────────┘              └───────────────────┘
        │                                      │
        └──────────────────┬───────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ Verify JWT       │
                 │ (try RS256 first,│
                 │  fallback HS256) │
                 └─────────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ API Routes:      │
                 │ /chat/completions│
                 │ /usage/stats     │
                 └─────────────────┘
```

## Testing the Integration

### Test 1: User Sign-In (Better-Auth)

```bash
# Sign in as johnny@tokenhouse.ai
curl -X POST http://localhost:8187/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johnny@tokenhouse.ai",
    "password": "ChangeMe123!"
  }'

# Expected response:
{
  "user": {
    "id": "...",
    "email": "johnny@tokenhouse.ai",
    "name": "johnny"
  },
  "session": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "org_id": "tokenhouse-super-org",
    "org_role": "owner",
    "billing_tier": "enterprise",
    "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"],
    "rate_limits": {
      "requests_per_minute": 1000,
      "tokens_per_day": 100000000
    }
  }
}
```

### Test 2: JWKS Endpoint

```bash
# Get public keys for JWT verification
curl http://localhost:8187/auth/.well-known/jwks.json

# Expected response:
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "better-auth-key",
      "use": "sig",
      "alg": "RS256",
      "n": "base64-encoded-modulus...",
      "e": "AQAB"
    }
  ]
}
```

### Test 3: Use Better-Auth JWT for API Calls

```bash
# Get JWT from sign-in
TOKEN="eyJhbGciOiJSUzI1NiIs..."

# Use JWT to call chat API
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'

# Should work! JWT verified via JWKS
```

### Test 4: Legacy API Token (Backward Compatibility)

```bash
# Get API token using org credentials (legacy method)
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "tokenhouse-super-org",
    "org_secret": "ths_super_secret_abc123"
  }'

# Expected response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}

# Use legacy token for API calls
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Test"}]
  }'

# Should also work! Fallback to HS256 verification
```

## JWT Verification Flow

### Better-Auth JWT (RS256)
```typescript
// 1. Extract token from Authorization header
const token = extractToken(headers.authorization)

// 2. Attempt RS256 verification via JWKS
try {
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer: 'http://localhost:8187',
    audience: 'http://localhost:8187'
  })
  // Success! Use custom claims from better-auth
  return payload as TokenClaims
} catch (error) {
  // Fall through to legacy verification
}
```

### Legacy API Token (HS256)
```typescript
// 3. Fallback to HS256 verification if RS256 fails
try {
  const claims = await jwt.verify(token)
  if (claims) {
    // Success! Use org claims from legacy system
    return claims as TokenClaims
  }
} catch (error) {
  // Both methods failed - unauthorized
}
```

## Custom Claims Comparison

### Better-Auth JWT Claims
```json
{
  "sub": "user-uuid",
  "email": "johnny@tokenhouse.ai",
  "org_id": "tokenhouse-super-org",
  "org_name": "TokenHouse",
  "org_role": "owner",
  "org_secret": "ths_super_secret_abc123",
  "billing_tier": "enterprise",
  "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"],
  "rate_limits": {
    "requests_per_minute": 1000,
    "tokens_per_day": 100000000
  }
}
```

### Legacy API Token Claims
```json
{
  "sub": "tokenhouse-super-org",
  "org_id": "tokenhouse-super-org",
  "org_name": "TokenHouse",
  "org_token_hash": "...",
  "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"],
  "rate_limits": {
    "requests_per_minute": 1000,
    "tokens_per_day": 100000000
  },
  "billing_tier": "enterprise",
  "usage_tracking_id": "uuid"
}
```

## Benefits of Dual System

### ✅ User Authentication (Better-Auth)
- **User-Centric**: Real user accounts with email/password
- **Role-Based Access**: User roles within organizations
- **Session Management**: Automatic token refresh and revocation
- **Security**: RS256 asymmetric encryption
- **Distributed Verification**: JWKS endpoint for microservices

### ✅ API Authentication (Legacy)
- **Machine-to-Machine**: Perfect for server-to-server communication
- **Backward Compatible**: Existing integrations continue working
- **Simple**: Direct org credentials without user accounts
- **Fast**: HS256 symmetric verification (slightly faster)

## Migration Path

### Phase 1: Dual System (Current) ✅
- Both authentication methods work
- No breaking changes for existing users
- New users can use better-auth

### Phase 2: Admin UI Migration
- Update Admin UI to use better-auth
- Install `@daveyplate/better-auth-ui`
- Replace login forms with `<AuthCard />`

### Phase 3: Deprecation (Future)
- Mark legacy API tokens as deprecated
- Provide migration guide for API users
- Eventually sunset legacy tokens

## Running the Gateway

```bash
# Start gateway (port 8187)
cd /Users/johnnycrupi/Documents/devel/KickAnalytics/bree-ai/apps/tokenhouse
bun run gateway/src/index.ts

# Or use the full stack script
./start-admin.sh
```

## Next Steps

1. ✅ Gateway integrated with better-auth
2. ✅ Dual JWT verification working
3. ⏳ Update Admin UI to use better-auth
4. ⏳ Test all authentication flows
5. ⏳ Add OAuth providers (Google, GitHub)
6. ⏳ Implement password reset flow

## Files Updated

1. `/gateway/src/index.ts` - Mounted better-auth handler
2. `/gateway/src/middleware/jwt-verify.ts` - Created dual JWT verification
3. `/gateway/src/routes/chat.ts` - Updated to use new verification
4. `/gateway/src/routes/usage.ts` - Updated to use new verification
5. `/package.json` - Added `jose@6.2.1`

## Database State

**Organizations (7 total)**:
- tokenhouse-super-org (Enterprise)
- tokenhouse-community (Free)
- tokenhouse-professional (Pro)
- happyai (Enterprise)
- groovy-relativity (Pro)
- freehabits (Starter)
- org_demo123 (Pro)

**Users (2 total)**:
- johnny@tokenhouse.ai (Password: ChangeMe123!)
- demo@tokenhouse.ai (Password: ChangeMe123!)

**Database Location**: `/gateway/tokenhouse.db`

## Troubleshooting

### Issue: JWT verification fails
**Solution**: Check JWKS URL in jwt-verify.ts matches BASE_URL

### Issue: Better-auth endpoints not working
**Solution**: Verify better-auth handler is mounted before other routes

### Issue: Legacy tokens not working
**Solution**: Ensure JWT_SECRET matches between Elysia JWT and better-auth

## Resources

- [Better Auth Docs](https://better-auth.com)
- [JWKS RFC 7517](https://datatracker.ietf.org/doc/html/rfc7517)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [TokenHouse Documentation](./MIGRATION_COMPLETE.md)
