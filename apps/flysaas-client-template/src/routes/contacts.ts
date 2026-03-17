/**
 * Contacts API for Client Org
 * Tenant-specific contact management with SQLite
 */

import { Elysia, t } from 'elysia';
import { Database } from 'bun:sqlite';
import type { JWTPayload } from '@bree-ai/flysaas-types';
import { authMiddleware } from '../middleware/auth';

const DB_PATH = process.env.DB_PATH || './data/client.db';
const db = new Database(DB_PATH);

export const contactsRoutes = new Elysia({ prefix: '/api/contacts' })
  .use(authMiddleware)

  // List contacts
  .get('/', ({ session }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const contacts = db.query(`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts
      WHERE org_id = ?
      ORDER BY created_at DESC
    `).all(orgId);

    return { contacts };
  }, { requireAuth: true })

  // Get contact by ID
  .get('/:id', ({ params, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const contact = db.query(`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts
      WHERE id = ? AND org_id = ?
    `).get(params.id, orgId);

    if (!contact) {
      return error(404, { error: 'Contact not found' });
    }

    return { contact };
  }, { requireAuth: true })

  // Create contact
  .post('/', ({ body, session }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;
    const id = crypto.randomUUID();

    db.query(`
      INSERT INTO contacts (id, org_id, name, email, phone, company, title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, orgId, body.name, body.email, body.phone, body.company, body.title);

    const contact = db.query(`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts WHERE id = ?
    `).get(id);

    return { contact };
  }, {
    requireAuth: true,
    body: t.Object({
      name: t.String(),
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      company: t.Optional(t.String()),
      title: t.Optional(t.String())
    })
  })

  // Update contact
  .patch('/:id', ({ params, body, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      values.push(body.email);
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?');
      values.push(body.phone);
    }
    if (body.company !== undefined) {
      updates.push('company = ?');
      values.push(body.company);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }

    if (updates.length === 0) {
      return error(400, { error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(params.id, orgId);

    const result = db.query(`
      UPDATE contacts
      SET ${updates.join(', ')}
      WHERE id = ? AND org_id = ?
    `).run(...values);

    if (result.changes === 0) {
      return error(404, { error: 'Contact not found' });
    }

    const contact = db.query(`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts WHERE id = ?
    `).get(params.id);

    return { contact };
  }, {
    requireAuth: true,
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      company: t.Optional(t.String()),
      title: t.Optional(t.String())
    })
  })

  // Delete contact
  .delete('/:id', ({ params, session, error }) => {
    const token = session as JWTPayload;
    const orgId = token.org_slug;

    const result = db.query(`
      DELETE FROM contacts
      WHERE id = ? AND org_id = ?
    `).run(params.id, orgId);

    if (result.changes === 0) {
      return error(404, { error: 'Contact not found' });
    }

    return { success: true };
  }, { requireAuth: true });
