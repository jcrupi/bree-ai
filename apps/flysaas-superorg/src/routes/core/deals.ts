/**
 * Deals API - FatCRM Core
 * Multi-tenant deal/opportunity management
 */

import { Elysia, t } from 'elysia';
import postgres from 'postgres';
import type { JWTPayload } from "../auth/jwt";
import { authMiddleware } from '../../middleware/auth';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const sql = postgres(DATABASE_URL);

export const dealsRoutes = new Elysia({ prefix: '/api/core/deals' })
  .use(authMiddleware)

  // List deals for org
  .get('/', async ({ session }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const deals = await sql`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.org_id = ${orgId}
      ORDER BY d.created_at DESC
    `;

    return { deals };
  }, { requireOrg: true })

  // Get deal by ID
  .get('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const deal = await sql`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.id = ${params.id} AND d.org_id = ${orgId}
    `.then(rows => rows[0]);

    if (!deal) {
      return error(404, { error: 'Deal not found' });
    }

    return { deal };
  }, { requireOrg: true })

  // Create deal
  .post('/', async ({ body, session }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const deal = await sql`
      INSERT INTO deals (org_id, contact_id, title, amount, stage, probability, expected_close_date)
      VALUES (
        ${orgId},
        ${body.contact_id},
        ${body.title},
        ${body.amount},
        ${body.stage || 'lead'},
        ${body.probability},
        ${body.expected_close_date}
      )
      RETURNING id, org_id, contact_id, title, amount, stage, probability, expected_close_date, created_at, updated_at
    `.then(rows => rows[0]);

    return { deal };
  }, {
    requireOrg: true,
    body: t.Object({
      title: t.String(),
      contact_id: t.Optional(t.String()),
      amount: t.Optional(t.Number()),
      stage: t.Optional(t.String()),
      probability: t.Optional(t.Number()),
      expected_close_date: t.Optional(t.String())
    })
  })

  // Update deal
  .patch('/:id', async ({ params, body, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const deal = await sql`
      UPDATE deals
      SET
        title = COALESCE(${body.title}, title),
        contact_id = COALESCE(${body.contact_id}, contact_id),
        amount = COALESCE(${body.amount}, amount),
        stage = COALESCE(${body.stage}, stage),
        probability = COALESCE(${body.probability}, probability),
        expected_close_date = COALESCE(${body.expected_close_date}, expected_close_date)
      WHERE id = ${params.id} AND org_id = ${orgId}
      RETURNING id, org_id, contact_id, title, amount, stage, probability, expected_close_date, created_at, updated_at
    `.then(rows => rows[0]);

    if (!deal) {
      return error(404, { error: 'Deal not found' });
    }

    return { deal };
  }, {
    requireOrg: true,
    body: t.Object({
      title: t.Optional(t.String()),
      contact_id: t.Optional(t.String()),
      amount: t.Optional(t.Number()),
      stage: t.Optional(t.String()),
      probability: t.Optional(t.Number()),
      expected_close_date: t.Optional(t.String())
    })
  })

  // Delete deal
  .delete('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const result = await sql`
      DELETE FROM deals
      WHERE id = ${params.id} AND org_id = ${orgId}
      RETURNING id
    `;

    if (result.length === 0) {
      return error(404, { error: 'Deal not found' });
    }

    return { success: true };
  }, { requireOrg: true });
