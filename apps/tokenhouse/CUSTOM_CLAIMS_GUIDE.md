# Adding Custom Claims to Organizations and Users

Quick guide for adding TokenHouse-specific claims to JWT tokens using better-auth.

## Overview

Custom claims allow you to embed organization and user metadata directly into JWTs, eliminating database lookups on every API request.

**TokenHouse Custom Claims:**
- `org_id` - Organization slug/identifier
- `org_role` - User's role in organization (owner, admin, member)
- `org_secret` - Organization API secret
- `billing_tier` - Organization billing level (free, starter, pro, enterprise)
- `allowed_models` - Array of AI models this org can access
- `rate_limits` - Per-org rate limits (requests/min, tokens/day)

## How It Works

```
User signs in
     ↓
Better Auth validates credentials
     ↓
After-hook runs (src/auth/better-auth.ts)
     ↓
Query user's organizations from database
     ↓
Add org data to JWT payload as custom claims
     ↓
Return JWT with all claims embedded
     ↓
API requests use JWT claims (no DB lookup!)
```

## Step 1: Extend Organization Schema

In `gateway/src/auth/better-auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'

export const auth = betterAuth({
  plugins: [
    organization({
      schema: {
        organization: {
          fields: {
            // Add your custom fields here
            org_secret: {
              type: 'string',
              required: true,
              unique: true
            },
            billing_tier: {
              type: 'string',
              required: true,
              defaultValue: 'free'
            },
            allowed_models: {
              type: 'string', // JSON stored as string
              required: true,
              defaultValue: '[]'
            },
            requests_per_minute: {
              type: 'number',
              required: true,
              defaultValue: 60
            },
            tokens_per_day: {
              type: 'number',
              required: true,
              defaultValue: 500000
            }
          }
        }
      }
    })
  ]
})
```

This adds columns to the `organization` table in your database.

## Step 2: Add Custom Claims to JWT

Use the after-hook to populate JWT claims:

```typescript
export const auth = betterAuth({
  advanced: {
    hooks: {
      after: [
        {
          // Run after sign-in and sign-up
          matcher: (ctx) =>
            ctx.endpoint === '/sign-in/email' ||
            ctx.endpoint === '/sign-up/email',

          handler: async (ctx) => {
            const userId = ctx.session?.user?.id
            if (!userId) return ctx

            // Query organization data
            const membership = db.prepare(`
              SELECT
                o.slug as org_id,
                o.name as org_name,
                o.org_secret,
                o.billing_tier,
                o.allowed_models,
                o.requests_per_minute,
                o.tokens_per_day,
                m.role as org_role
              FROM organization_member m
              JOIN organization o ON m.organization_id = o.id
              WHERE m.user_id = ?
              ORDER BY m.created_at ASC
              LIMIT 1
            `).get(userId) as any

            if (!membership) return ctx

            // Add custom claims to session/JWT
            ctx.session = {
              ...ctx.session,
              // Custom claims
              org_id: membership.org_id,
              org_name: membership.org_name,
              org_role: membership.org_role,
              org_secret: membership.org_secret,
              billing_tier: membership.billing_tier,
              allowed_models: JSON.parse(membership.allowed_models),
              rate_limits: {
                requests_per_minute: membership.requests_per_minute,
                tokens_per_day: membership.tokens_per_day
              }
            }

            return ctx
          }
        }
      ]
    }
  }
})
```

## Step 3: Use Claims in API Routes

Access custom claims from the verified JWT:

```typescript
import { auth } from './auth/better-auth'

// Verify JWT and get session
app.derive(async ({ headers, set }) => {
  const token = headers.authorization?.replace('Bearer ', '')

  if (!token) {
    set.status = 401
    return { error: 'Unauthorized' }
  }

  const session = await auth.api.getSession({
    headers: { authorization: `Bearer ${token}` }
  })

  if (!session) {
    set.status = 401
    return { error: 'Invalid token' }
  }

  return { session }
})

// Use custom claims in routes
app.post('/chat/completions', async ({ body, session, set }) => {
  const { model, messages } = body

  // Check allowed models from JWT claim
  if (!session.allowed_models.includes(model)) {
    set.status = 403
    return { error: `Model ${model} not allowed for org ${session.org_id}` }
  }

  // Check rate limits from JWT claim
  const currentRate = await getRateForOrg(session.org_id)
  if (currentRate >= session.rate_limits.requests_per_minute) {
    set.status = 429
    return { error: 'Rate limit exceeded' }
  }

  // Process request with org context
  const response = await openai.chat.completions.create({
    model,
    messages
  })

  // Log usage with org from JWT
  await logUsage({
    org_id: session.org_id,
    billing_tier: session.billing_tier,
    tokens: response.usage.total_tokens,
    cost: calculateCost(response.usage)
  })

  return response
})
```

## Step 4: TypeScript Types

Define types for your custom claims:

```typescript
// gateway/src/types/session.ts
export interface TokenHouseSession {
  user: {
    id: string
    email: string
    name: string
  }
  // Custom claims
  org_id: string
  org_name: string
  org_role: 'owner' | 'admin' | 'member'
  org_secret: string
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  allowed_models: string[]
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }
}

// Use in route handlers
declare module 'elysia' {
  interface Context {
    session: TokenHouseSession
  }
}
```

## Common Patterns

### 1. Organization Switching

When user switches active organization, refresh JWT:

```typescript
app.post('/organizations/:slug/activate', async ({ params, session }) => {
  const { slug } = params

  // Verify user has access to org
  const membership = db.prepare(`
    SELECT role FROM organization_member
    WHERE user_id = ? AND organization_id = (
      SELECT id FROM organization WHERE slug = ?
    )
  `).get(session.user.id, slug)

  if (!membership) {
    return { error: 'Not a member of this organization' }
  }

  // Generate new JWT with updated org claims
  const newToken = await auth.api.createSession({
    userId: session.user.id,
    organizationId: slug
  })

  return { token: newToken }
})
```

### 2. Dynamic Rate Limits

Update rate limits without regenerating JWT:

```typescript
// Store in Redis with short TTL
async function updateRateLimits(orgId: string, limits: RateLimits) {
  await redis.setex(
    `org:${orgId}:limits`,
    3600, // 1 hour TTL
    JSON.stringify(limits)
  )
}

// Check Redis first, fall back to JWT claim
async function getRateLimits(session: TokenHouseSession) {
  const cached = await redis.get(`org:${session.org_id}:limits`)
  return cached
    ? JSON.parse(cached)
    : session.rate_limits // From JWT
}
```

### 3. Model Access Control

Centralized model access checking:

```typescript
function checkModelAccess(session: TokenHouseSession, model: string) {
  if (!session.allowed_models.includes(model)) {
    throw new Error(`Model ${model} not allowed for org ${session.org_id}`)
  }

  // Additional tier-based restrictions
  const restrictedModels = ['o1', 'claude-3-opus']
  if (restrictedModels.includes(model) && session.billing_tier === 'free') {
    throw new Error(`Model ${model} requires paid tier`)
  }

  return true
}
```

### 4. Usage Tracking

Log all usage with org context:

```typescript
async function logUsage(session: TokenHouseSession, usage: Usage) {
  await db.insert('usage_logs', {
    org_id: session.org_id,
    org_name: session.org_name,
    billing_tier: session.billing_tier,
    user_id: session.user.id,
    user_email: session.user.email,
    model: usage.model,
    tokens: usage.total_tokens,
    cost: usage.cost_usd,
    timestamp: new Date()
  })

  // Also publish to NATS for real-time analytics
  await nats.publish('usage.logged', {
    org_id: session.org_id,
    tokens: usage.total_tokens,
    cost: usage.cost_usd
  })
}
```

## Benefits

✅ **No Database Lookups**: All org data in JWT
✅ **Fast Authorization**: Check claims without queries
✅ **Offline Verification**: JWTs can be verified without DB
✅ **Easy Scaling**: Stateless authentication
✅ **Audit Trail**: All claims visible in JWT
✅ **Type Safety**: Full TypeScript support

## Limitations

⚠️ **JWT Size**: Don't add too many claims (keep under 4KB)
⚠️ **Stale Data**: Claims don't update until next sign-in
⚠️ **Sensitive Data**: Never put secrets in JWTs (only references)
⚠️ **Refresh Strategy**: Need mechanism to refresh stale claims

## Refreshing Claims

When org data changes, refresh the JWT:

```typescript
// After updating org settings
app.patch('/organizations/:slug', async ({ params, body, session }) => {
  const { slug } = params

  // Update organization
  await db.update('organization')
    .set(body)
    .where({ slug })

  // Generate new token with updated claims
  const newToken = await auth.api.createSession({
    userId: session.user.id,
    organizationId: slug,
    fresh: true // Force claim refresh
  })

  return {
    success: true,
    token: newToken,
    message: 'Organization updated. Use new token for future requests.'
  }
})
```

## Testing Claims

Decode JWT to inspect claims:

```bash
# Get JWT
TOKEN=$(curl -s -X POST http://localhost:8187/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"johnny@tokenhouse.ai","password":"secure123"}' \
  | jq -r '.token')

# Decode JWT (using jwt.io or jwt-cli)
echo $TOKEN | jwt decode -

# Should show custom claims:
{
  "sub": "user-id-here",
  "email": "johnny@tokenhouse.ai",
  "org_id": "tokenhouse-super-org",
  "org_role": "owner",
  "billing_tier": "enterprise",
  "allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"],
  "rate_limits": {
    "requests_per_minute": 1000,
    "tokens_per_day": 100000000
  }
}
```

## Next Steps

1. Add custom claims to better-auth config
2. Update API routes to use claims
3. Add TypeScript types for type safety
4. Implement claim refresh strategy
5. Add monitoring for stale claims
6. Document claims for API consumers

## Resources

- [Better Auth JWT Docs](https://better-auth.com/docs/concepts/jwt)
- [Better Auth Hooks](https://better-auth.com/docs/concepts/hooks)
- [Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [JWT.io Debugger](https://jwt.io)
