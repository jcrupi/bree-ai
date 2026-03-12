/**
 * JWT Verification Middleware
 *
 * Supports two authentication methods:
 * 1. Better-auth JWTs (RS256) - User authentication with custom claims
 * 2. Legacy API tokens (HS256) - Organization API authentication
 */

import * as jose from 'jose'
import { auth } from '../auth/better-auth'

const JWKS_URL = process.env.BASE_URL || 'http://localhost:8187'

// Create JWKS client for better-auth JWT verification
const jwks = jose.createRemoteJWKSet(new URL(`${JWKS_URL}/auth/.well-known/jwks.json`))

export interface TokenClaims {
  // Standard JWT claims
  sub: string
  email?: string
  exp: number
  iat: number

  // TokenHouse custom claims (from better-auth)
  org_id?: string
  org_name?: string
  org_role?: string
  org_secret?: string
  billing_tier?: string
  allowed_models?: string[]
  rate_limits?: {
    requests_per_minute: number
    tokens_per_day: number
  }

  // Legacy API token claims
  usage_tracking_id?: string
}

/**
 * Verify JWT token from Authorization header
 * Attempts better-auth verification first, falls back to legacy JWT
 */
export async function verifyToken(token: string, legacyJwt?: any): Promise<TokenClaims | null> {
  // Try better-auth JWT verification first (RS256)
  try {
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: JWKS_URL,
      audience: JWKS_URL
    })

    return payload as TokenClaims
  } catch (betterAuthError) {
    // If better-auth verification fails, try legacy JWT (HS256)
    if (legacyJwt) {
      try {
        const claims = await legacyJwt.verify(token)
        if (claims) {
          return claims as TokenClaims
        }
      } catch (legacyError) {
        console.error('Both JWT verification methods failed:', {
          betterAuth: betterAuthError,
          legacy: legacyError
        })
      }
    }
  }

  return null
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}
