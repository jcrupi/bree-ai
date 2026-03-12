import { Elysia, t } from 'elysia'
import { compare } from 'bcrypt'
import { getOrg } from '../db/orgs'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/token', async ({ body, jwt, set }) => {
    const { org_id, org_secret } = body

    // Look up org in database (mock for now)
    const org = await getOrg(org_id)

    if (!org) {
      set.status = 401
      return { error: 'Invalid credentials' }
    }

    // Verify secret
    const isValid = await compare(org_secret, org.org_secret_hash)
    if (!isValid) {
      set.status = 401
      return { error: 'Invalid credentials' }
    }

    // Generate JWT with claims
    const token = await jwt.sign({
      iss: 'tokenhouse.ai',
      sub: org_id,
      aud: 'tokenhouse-api',
      exp: Math.floor(Date.now() / 1000) + (60 * 60),  // 1 hour
      iat: Math.floor(Date.now() / 1000),

      org_id: org.org_id,
      org_name: org.org_name,
      org_token_hash: org.org_token_hash,

      allowed_models: org.allowed_models,
      rate_limits: org.rate_limits,
      billing_tier: org.billing_tier,
      usage_tracking_id: crypto.randomUUID()
    })

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600
    }
  }, {
    body: t.Object({
      org_id: t.String(),
      org_secret: t.String()
    })
  })
