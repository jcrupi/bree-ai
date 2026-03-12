import { Elysia, t } from 'elysia'
import { createOrg, createUser, addUserToOrg, listOrgs, listUsers } from '../db/orgs'

// Simple admin authentication (replace with proper auth in production)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-change-me'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .derive(async ({ headers, set }) => {
    const adminAuth = headers['x-admin-secret']
    if (adminAuth !== ADMIN_SECRET) {
      set.status = 401
      throw new Error('Unauthorized: Invalid admin secret')
    }
    return {}
  })
  .get('/orgs', async () => {
    const orgs = await listOrgs()
    return {
      orgs: orgs.map(org => ({
        org_id: org.org_id,
        org_name: org.org_name,
        billing_tier: org.billing_tier,
        users: org.users,
        allowed_models: org.allowed_models,
        rate_limits: org.rate_limits,
        created_at: org.created_at
      }))
    }
  })
  .get('/users', async () => {
    const users = await listUsers()
    return {
      users: users.map(user => ({
        email: user.email,
        name: user.name,
        org_ids: user.org_ids,
        created_at: user.created_at
      }))
    }
  })
  .post('/orgs', async ({ body, set }) => {
    const { org_name, initial_user_email, billing_tier, allowed_models } = body

    // Generate org_id from org_name
    const org_id = `org_${org_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`

    // Generate secret
    const org_secret = `ths_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`

    const org = await createOrg({
      org_id,
      org_name,
      org_secret,
      billing_tier: billing_tier || 'free',
      allowed_models: allowed_models || ['gpt-4o-mini'],
      initial_user_email
    })

    return {
      org_id: org.org_id,
      org_name: org.org_name,
      org_secret,  // Return secret once on creation
      billing_tier: org.billing_tier,
      users: org.users,
      allowed_models: org.allowed_models,
      message: '⚠️  Save the org_secret - it will not be shown again!'
    }
  }, {
    body: t.Object({
      org_name: t.String(),
      initial_user_email: t.Optional(t.String()),
      billing_tier: t.Optional(t.Union([
        t.Literal('free'),
        t.Literal('starter'),
        t.Literal('pro'),
        t.Literal('enterprise')
      ])),
      allowed_models: t.Optional(t.Array(t.String()))
    })
  })
  .post('/users', async ({ body, set }) => {
    const { email, name, org_id } = body

    const user = await createUser({
      email,
      name,
      org_id
    })

    return {
      email: user.email,
      name: user.name,
      org_ids: user.org_ids,
      message: 'User created successfully'
    }
  }, {
    body: t.Object({
      email: t.String(),
      name: t.Optional(t.String()),
      org_id: t.String()
    })
  })
  .post('/orgs/:org_id/users', async ({ params, body, set }) => {
    const { org_id } = params
    const { email } = body

    await addUserToOrg(email, org_id)

    return {
      message: `User ${email} added to org ${org_id}`,
      org_id,
      email
    }
  }, {
    params: t.Object({
      org_id: t.String()
    }),
    body: t.Object({
      email: t.String()
    })
  })
