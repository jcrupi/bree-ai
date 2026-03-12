/**
 * Better Auth Configuration for TokenHouse
 *
 * Integrates better-auth with organization-based JWT claims:
 * - org_id: Active organization ID
 * - org_role: User role in organization (owner, admin, member)
 * - org_secret: Organization API secret
 * - allowed_models: Models this org can access
 * - rate_limits: Per-org rate limits
 * - billing_tier: Organization billing tier
 */

import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { Database } from 'bun:sqlite'

// Initialize SQLite database for better-auth using bun:sqlite
const db = new Database('tokenhouse.db')

export const auth = betterAuth({
  database: {
    db,
    type: 'sqlite'
  },

  // Base URL for auth endpoints
  baseURL: process.env.BASE_URL || 'http://localhost:8187',

  // JWT secret for signing tokens
  secret: process.env.JWT_SECRET || 'tokenhouse-secret-change-me',

  // Enable organization plugin
  plugins: [
    organization({
      // Allow users to create organizations
      allowUserToCreateOrganization: true,

      // Custom organization schema with TokenHouse fields
      schema: {
        organization: {
          fields: {
            // TokenHouse-specific fields
            org_secret: {
              type: 'string',
              required: true,
              unique: true
            },
            org_token: {
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
              type: 'string', // JSON array stored as string
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
  ],

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },

  // Custom JWT claims - add TokenHouse organization data
  advanced: {
    generateId: () => crypto.randomUUID(),

    // Hook to add custom claims to JWT
    hooks: {
      after: [
        {
          matcher: (ctx) => ctx.endpoint === '/sign-in/email' || ctx.endpoint === '/sign-up/email',
          handler: async (ctx) => {
            // Get user's active organization
            const userId = ctx.session?.user?.id
            if (!userId) return ctx

            // Fetch user's organization memberships
            const memberships = db.prepare(`
              SELECT
                o.id as org_id,
                o.name as org_name,
                o.slug as org_slug,
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

            if (memberships) {
              // Add custom claims to session
              ctx.session = {
                ...ctx.session,
                // Custom TokenHouse claims
                org_id: memberships.org_slug,
                org_name: memberships.org_name,
                org_role: memberships.org_role,
                org_secret: memberships.org_secret,
                billing_tier: memberships.billing_tier,
                allowed_models: JSON.parse(memberships.allowed_models || '[]'),
                rate_limits: {
                  requests_per_minute: memberships.requests_per_minute,
                  tokens_per_day: memberships.tokens_per_day
                }
              }
            }

            return ctx
          }
        }
      ]
    }
  }
})

// Export auth handler for Elysia
export const authHandler = auth.handler

// Export types
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

/**
 * Helper to create organization with TokenHouse-specific data
 */
export async function createOrganization(params: {
  name: string
  slug: string
  userId: string
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  allowed_models: string[]
}) {
  const { name, slug, userId, billing_tier, allowed_models } = params

  // Generate org credentials
  const org_secret = `ths_${crypto.randomUUID().replace(/-/g, '')}`
  const org_token = `tht_${crypto.randomUUID().replace(/-/g, '')}`

  // Rate limits based on tier
  const rateLimits = {
    free: { requests_per_minute: 60, tokens_per_day: 500_000 },
    starter: { requests_per_minute: 150, tokens_per_day: 3_000_000 },
    pro: { requests_per_minute: 200, tokens_per_day: 5_000_000 },
    enterprise: { requests_per_minute: 300, tokens_per_day: 10_000_000 }
  }

  const limits = rateLimits[billing_tier]

  // Insert organization
  const result = db.prepare(`
    INSERT INTO organization (
      id, name, slug, created_at, updated_at,
      org_secret, org_token, billing_tier, allowed_models,
      requests_per_minute, tokens_per_day
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    name,
    slug,
    new Date().toISOString(),
    new Date().toISOString(),
    org_secret,
    org_token,
    billing_tier,
    JSON.stringify(allowed_models),
    limits.requests_per_minute,
    limits.tokens_per_day
  )

  const orgId = result.lastInsertRowid

  // Add user as owner
  db.prepare(`
    INSERT INTO organization_member (
      id, organization_id, user_id, role, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    orgId,
    userId,
    'owner',
    new Date().toISOString()
  )

  return {
    id: orgId,
    name,
    slug,
    org_secret,
    org_token,
    billing_tier,
    allowed_models,
    rate_limits: limits
  }
}

/**
 * Helper to get organization by slug with TokenHouse data
 */
export function getOrganization(slug: string) {
  return db.prepare(`
    SELECT
      id, name, slug, created_at, updated_at,
      org_secret, org_token, billing_tier, allowed_models,
      requests_per_minute, tokens_per_day
    FROM organization
    WHERE slug = ?
  `).get(slug) as any
}

/**
 * Helper to verify org credentials and return organization data
 */
export function verifyOrgCredentials(orgId: string, orgSecret: string) {
  const org = db.prepare(`
    SELECT
      id, name, slug, billing_tier, allowed_models,
      requests_per_minute, tokens_per_day
    FROM organization
    WHERE slug = ? AND org_secret = ?
  `).get(orgId, orgSecret) as any

  if (!org) return null

  return {
    org_id: org.slug,
    org_name: org.name,
    billing_tier: org.billing_tier,
    allowed_models: JSON.parse(org.allowed_models || '[]'),
    rate_limits: {
      requests_per_minute: org.requests_per_minute,
      tokens_per_day: org.tokens_per_day
    }
  }
}
