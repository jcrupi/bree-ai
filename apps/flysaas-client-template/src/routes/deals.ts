/**
 * Deals API for Client Org
 * Tenant-specific deal/opportunity management with SQLite
 */

import { Elysia, t } from 'elysia';
import { Database } from 'bun:sqlite';
import type { JWTPayload } from '@bree-ai/flysaas-types';
import { authMiddleware } from '../middleware/auth';

const DB_PATH = process.env.DB_PATH || './data/client.db';
const db = new Database(DB_PATH);

export const dealsRoutes = new Elysia({ prefix: '/api/deals' })
  .use(authMiddleware)

  // List deals
  .get('/', ({ session }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const deals = db.query(`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.org_id = ?
      ORDER BY d.created_at DESC
    `).all(orgId);

    return { deals };
  }, { requireAuth: true })

  // Get deal by ID
  .get('/:id', ({ params, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const deal = db.query(`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.id = ? AND d.org_id = ?
    `).get(params.id, orgId);

    if (!deal) {
      return error(404, { error: 'Deal not found' });
    }

    return { deal };
  }, { requireAuth: true })

  // Create deal
  .post('/', ({ body, session }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;
    const id = crypto.randomUUID();

    db.query(`
      INSERT INTO deals (id, org_id, contact_id, title, amount, stage, probability, expected_close_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orgId,
      body.contact_id,
      body.title,
      body.amount,
      body.stage || 'lead',
      body.probability,
      body.expected_close_date
    );

    const deal = db.query(`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.id = ?
    `).get(id);

    return { deal };
  }, {
    requireAuth: true,
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
  .patch('/:id', ({ params, body, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.contact_id !== undefined) {
      updates.push('contact_id = ?');
      values.push(body.contact_id);
    }
    if (body.amount !== undefined) {
      updates.push('amount = ?');
      values.push(body.amount);
    }
    if (body.stage !== undefined) {
      updates.push('stage = ?');
      values.push(body.stage);
    }
    if (body.probability !== undefined) {
      updates.push('probability = ?');
      values.push(body.probability);
    }
    if (body.expected_close_date !== undefined) {
      updates.push('expected_close_date = ?');
      values.push(body.expected_close_date);
    }

    if (updates.length === 0) {
      return error(400, { error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id, orgId);

    const result = db.query(`
      UPDATE deals
      SET ${updates.join(', ')}
      WHERE id = ? AND org_id = ?
    `).run(...values);

    if (result.changes === 0) {
      return error(404, { error: 'Deal not found' });
    }

    const deal = db.query(`
      SELECT d.id, d.org_id, d.contact_id, d.title, d.amount, d.stage,
             d.probability, d.expected_close_date, d.created_at, d.updated_at,
             c.name as contact_name
      FROM deals d
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE d.id = ?
    `).get(params.id);

    return { deal };
  }, {
    requireAuth: true,
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
  .delete('/:id', ({ params, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const result = db.query(`
      DELETE FROM deals
      WHERE id = ? AND org_id = ?
    `).run(params.id, orgId);

    if (result.changes === 0) {
      return error(404, { error: 'Deal not found' });
    }

    return { success: true };
  }, { requireAuth: true });
