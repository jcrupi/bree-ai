import { Elysia, t } from 'elysia'
import { getUsageStats } from '../tracking/usage-logger'
import { verifyToken, extractToken } from '../middleware/jwt-verify'

export const usageRoutes = new Elysia({ prefix: '/usage' })
  .derive(async ({ headers, jwt, set }) => {
    const token = extractToken(headers.authorization)
    if (!token) {
      set.status = 401
      throw new Error('Missing authorization token')
    }

    // Verify JWT (supports both better-auth and legacy tokens)
    const claims = await verifyToken(token, jwt)
    if (!claims) {
      set.status = 401
      throw new Error('Invalid or expired token')
    }

    return { org: claims }
  })
  .get('/stats', async ({ query, org }) => {
    const { start_date, end_date, model } = query

    const stats = await getUsageStats({
      org_id: org.org_id,
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: end_date || new Date().toISOString().split('T')[0],
      model
    })

    return stats
  }, {
    query: t.Object({
      start_date: t.Optional(t.String()),
      end_date: t.Optional(t.String()),
      model: t.Optional(t.String())
    })
  })
