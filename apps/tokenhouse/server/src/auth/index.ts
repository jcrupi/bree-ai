import { betterAuth } from 'better-auth'
import { organization, bearer, jwt } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET ?? 'fallback-secret-change-in-production',

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,    // 7 days
    updateAge: 60 * 60 * 24,         // refresh daily
  },

  plugins: [
    // ── Bearer token support (for API clients / agents) ─────────────────────
    bearer(),

    // ── Organization / multi-tenant support ─────────────────────────────────
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: 'owner',
      membershipLimit: 100,
    }),

    // ── JWT plugin — injects custom Token House claims ───────────────────────
    jwt({
      jwt: {
        expirationTime: '1h',
        issuer: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',

        // This is where we enrich the JWT with Token House data
        definePayload: async (data) => {
          const { user, session } = data
          const orgId = session.activeOrganizationId ?? null

          // Fetch wallet — prefer org wallet, fall back to personal
          let walletRecord = null

          if (orgId) {
            const [orgWallet] = await db
              .select()
              .from(schema.wallet)
              .where(eq(schema.wallet.organizationId, orgId))
              .limit(1)
            walletRecord = orgWallet
          }

          if (!walletRecord) {
            const [personalWallet] = await db
              .select()
              .from(schema.wallet)
              .where(
                and(
                  eq(schema.wallet.userId, user.id),
                  // personal wallets have no org
                )
              )
              .limit(1)
            walletRecord = personalWallet
          }

          // Fetch org membership + role
          let orgRole: string | null = null
          if (orgId) {
            const [membership] = await db
              .select()
              .from(schema.member)
              .where(
                and(
                  eq(schema.member.userId, user.id),
                  eq(schema.member.organizationId, orgId)
                )
              )
              .limit(1)
            orgRole = membership?.role ?? null
          }

          return {
            sub: user.id,
            email: user.email,
            name: user.name,
            org_id: orgId,
            org_role: orgRole,
            token_balance: walletRecord?.balance ?? 0,
            token_budget: walletRecord?.monthlyBudget ?? null,
            allowed_models: walletRecord?.allowedModels ?? ['gpt-4o-mini'],
            plan_tier: walletRecord?.planTier ?? 'free',
          }
        },
      },
    }),
  ],

  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
  ],
})

export type Auth = typeof auth
