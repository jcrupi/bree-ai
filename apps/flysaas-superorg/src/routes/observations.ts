/**
 * Observations API
 * Observer AI - User feedback and feature requests
 */

import { Elysia, t } from 'elysia';
import postgres from 'postgres';
import type { JWTPayload } from "../auth/jwt";
import { verifyToken } from "../auth/jwt";

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const sql = postgres(DATABASE_URL);

export const observationsRoutes = new Elysia({ prefix: '/api/observations' })

  // Submit new observation
  .post('/', async ({ body, headers, set }) => {
    // Verify auth token
    const authHeader = headers['authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    let payload: JWTPayload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const userId = payload.user_id;

    // Get user's current org (using the first org they're a member of)
    const membership = await sql`
      SELECT org_id FROM org_members WHERE user_id = ${userId} LIMIT 1
    `.then(rows => rows[0]);

    if (!membership) {
      return { error: 'User is not a member of any organization' };
    }

    const observation = await sql`
      INSERT INTO observations (org_id, user_id, type, description, url)
      VALUES (
        ${membership.org_id},
        ${userId},
        ${body.type},
        ${body.description},
        ${body.url || null}
      )
      RETURNING id, org_id, user_id, type, description, url, status, priority, created_at, updated_at
    `.then(rows => rows[0]);

    return { observation };
  }, {
    requireAuth: true,
    body: t.Object({
      type: t.Union([t.Literal('bug'), t.Literal('enhancement'), t.Literal('feature')]),
      description: t.String({ minLength: 1, maxLength: 5000 }),
      url: t.Optional(t.String())
    })
  })

  // List observations (Observer Admin only)
  .get('/', async ({ query, headers, set }) => {
    // Verify auth token
    const authHeader = headers['authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    let payload: JWTPayload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }

    const userId = payload.user_id;

    // Check if user is Observer Admin in any org
    const membership = await sql`
      SELECT om.org_id, om.is_observer_admin, om.role
      FROM org_members om
      WHERE om.user_id = ${userId}
        AND (om.is_observer_admin = true OR om.role IN ('owner', 'admin'))
      LIMIT 1
    `.then(rows => rows[0]);

    if (!membership) {
      return error(403, { error: 'Not authorized as Observer Admin' });
    }

    // Build filters
    const filters = [];
    const params: any[] = [membership.org_id];

    if (query.status) {
      filters.push(`status = $${params.length + 1}`);
      params.push(query.status);
    }

    if (query.type) {
      filters.push(`type = $${params.length + 1}`);
      params.push(query.type);
    }

    if (query.priority) {
      filters.push(`priority = $${params.length + 1}`);
      params.push(query.priority);
    }

    const whereClause = filters.length > 0
      ? `AND ${filters.join(' AND ')}`
      : '';

    const observations = await sql`
      SELECT
        o.id, o.type, o.description, o.url, o.status, o.priority,
        o.notes, o.created_at, o.updated_at,
        u.name as user_name, u.email as user_email,
        a.name as assigned_to_name
      FROM observations o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN users a ON a.id = o.assigned_to
      WHERE o.org_id = ${membership.org_id} ${sql.unsafe(whereClause)}
      ORDER BY o.created_at DESC
      LIMIT ${query.limit || 100}
      OFFSET ${query.offset || 0}
    `;

    const total = await sql`
      SELECT COUNT(*) as count
      FROM observations
      WHERE org_id = ${membership.org_id} ${sql.unsafe(whereClause)}
    `.then(rows => parseInt(rows[0].count));

    return {
      observations,
      total,
      limit: query.limit || 100,
      offset: query.offset || 0
    };
  }, {
    requireAuth: true,
    query: t.Object({
      status: t.Optional(t.String()),
      type: t.Optional(t.String()),
      priority: t.Optional(t.String()),
      limit: t.Optional(t.Number()),
      offset: t.Optional(t.Number())
    })
  })

  // Get single observation
  .get('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const userId = token.user_id;

    // Check if user is Observer Admin or the observation creator
    const observation = await sql`
      SELECT
        o.id, o.org_id, o.user_id, o.type, o.description, o.url,
        o.status, o.priority, o.assigned_to, o.notes,
        o.created_at, o.updated_at,
        u.name as user_name, u.email as user_email,
        a.name as assigned_to_name,
        om.is_observer_admin, om.role
      FROM observations o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN users a ON a.id = o.assigned_to
      LEFT JOIN org_members om ON om.org_id = o.org_id AND om.user_id = ${userId}
      WHERE o.id = ${params.id}
    `.then(rows => rows[0]);

    if (!observation) {
      return error(404, { error: 'Observation not found' });
    }

    // Check permissions
    const canView =
      observation.user_id === userId ||
      observation.is_observer_admin === true ||
      ['owner', 'admin'].includes(observation.role);

    if (!canView) {
      return error(403, { error: 'Not authorized to view this observation' });
    }

    return { observation };
  }, { requireAuth: true })

  // Update observation (Observer Admin only)
  .patch('/:id', async ({ params, body, session, error }) => {
    const token = session as any as JWTPayload;
    const userId = token.user_id;

    // Check if user is Observer Admin
    const existing = await sql`
      SELECT o.org_id, om.is_observer_admin, om.role
      FROM observations o
      LEFT JOIN org_members om ON om.org_id = o.org_id AND om.user_id = ${userId}
      WHERE o.id = ${params.id}
    `.then(rows => rows[0]);

    if (!existing) {
      return error(404, { error: 'Observation not found' });
    }

    const canUpdate =
      existing.is_observer_admin === true ||
      ['owner', 'admin'].includes(existing.role);

    if (!canUpdate) {
      return error(403, { error: 'Not authorized as Observer Admin' });
    }

    const observation = await sql`
      UPDATE observations
      SET
        status = COALESCE(${body.status}, status),
        priority = COALESCE(${body.priority}, priority),
        assigned_to = COALESCE(${body.assigned_to}, assigned_to),
        notes = COALESCE(${body.notes}, notes)
      WHERE id = ${params.id}
      RETURNING id, org_id, user_id, type, description, url, status, priority,
                assigned_to, notes, created_at, updated_at
    `.then(rows => rows[0]);

    return { observation };
  }, {
    requireAuth: true,
    body: t.Object({
      status: t.Optional(t.Union([
        t.Literal('new'),
        t.Literal('reviewing'),
        t.Literal('planned'),
        t.Literal('in_progress'),
        t.Literal('completed'),
        t.Literal('rejected')
      ])),
      priority: t.Optional(t.Union([
        t.Literal('low'),
        t.Literal('medium'),
        t.Literal('high'),
        t.Literal('urgent')
      ])),
      assigned_to: t.Optional(t.String()),
      notes: t.Optional(t.String())
    })
  })

  // Delete observation (Observer Admin only)
  .delete('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const userId = token.user_id;

    // Check if user is Observer Admin
    const existing = await sql`
      SELECT o.org_id, om.is_observer_admin, om.role
      FROM observations o
      LEFT JOIN org_members om ON om.org_id = o.org_id AND om.user_id = ${userId}
      WHERE o.id = ${params.id}
    `.then(rows => rows[0]);

    if (!existing) {
      return error(404, { error: 'Observation not found' });
    }

    const canDelete =
      existing.is_observer_admin === true ||
      ['owner', 'admin'].includes(existing.role);

    if (!canDelete) {
      return error(403, { error: 'Not authorized as Observer Admin' });
    }

    await sql`DELETE FROM observations WHERE id = ${params.id}`;

    return { success: true };
  }, { requireAuth: true })

  // Get observation statistics (Observer Admin only)
  .get('/stats/summary', async ({ session, error }) => {
    const token = session as any as JWTPayload;
    const userId = token.user_id;

    // Check if user is Observer Admin
    const membership = await sql`
      SELECT om.org_id, om.is_observer_admin, om.role
      FROM org_members om
      WHERE om.user_id = ${userId}
        AND (om.is_observer_admin = true OR om.role IN ('owner', 'admin'))
      LIMIT 1
    `.then(rows => rows[0]);

    if (!membership) {
      return error(403, { error: 'Not authorized as Observer Admin' });
    }

    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing,
        COUNT(*) FILTER (WHERE status = 'planned') as planned,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE type = 'bug') as bugs,
        COUNT(*) FILTER (WHERE type = 'enhancement') as enhancements,
        COUNT(*) FILTER (WHERE type = 'feature') as features,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE priority = 'medium') as medium,
        COUNT(*) FILTER (WHERE priority = 'low') as low
      FROM observations
      WHERE org_id = ${membership.org_id}
    `.then(rows => rows[0]);

    return { stats };
  }, { requireAuth: true });
