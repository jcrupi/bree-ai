import Elysia from 'elysia'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { db } from '../db'
import { wallet } from '../db/schema'
import { eq, and, isNull } from 'drizzle-orm'

const JWKS_URL = `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/api/auth/jwks`

// Cache the JWKS — it changes infrequently
let jwksSet: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!jwksSet) {
    jwksSet = createRemoteJWKSet(new URL(JWKS_URL))
  }
  return jwksSet
}

export interface TokenHouseUser {
  id: string
  email: string
  name: string
  orgId: string | null
  orgRole: string | null
  tokenBalance: number
  tokenBudget: number | null
  allowedModels: string[]
  planTier: string
}

// Elysia plugin — attach to any route group that needs auth
export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .derive({ as: 'global' }, async ({ headers, set }): Promise<{ user: TokenHouseUser | null }> => {
    const authHeader = headers['authorization']
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.slice(7)

    try {
      const { payload } = await jwtVerify(token, getJWKS(), {
        issuer: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      })

      return {
        user: {
          id: payload.sub as string,
          email: payload['email'] as string,
          name: payload['name'] as string,
          orgId: (payload['org_id'] as string) ?? null,
          orgRole: (payload['org_role'] as string) ?? null,
          tokenBalance: (payload['token_balance'] as number) ?? 0,
          tokenBudget: (payload['token_budget'] as number) ?? null,
          allowedModels: (payload['allowed_models'] as string[]) ?? [],
          planTier: (payload['plan_tier'] as string) ?? 'free',
        },
      }
    } catch (err) {
      // Invalid or expired token — return null, let routes decide
      return { user: null }
    }
  })

// Guard plugin — use on routes that REQUIRE auth
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authPlugin)
  .macro({
    authenticated: (enabled: boolean) => ({
      beforeHandle({ user, set }: { user: TokenHouseUser | null; set: { status: number } }) {
        if (enabled && !user) {
          set.status = 401
          return { error: 'Unauthorized — valid bearer token required' }
        }
      },
    }),
  })
