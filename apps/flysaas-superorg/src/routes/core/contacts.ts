/**
 * Contacts API - FatCRM Core
 * Multi-tenant contact management
 */

import { Elysia, t } from 'elysia';
import postgres from 'postgres';
import type { JWTPayload } from "../auth/jwt";
import { authMiddleware } from '../../middleware/auth';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const sql = postgres(DATABASE_URL);

export const contactsRoutes = new Elysia({ prefix: '/api/core/contacts' })
  .use(authMiddleware)

  // List contacts for org
  .get('/', async ({ session }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const contacts = await sql`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
    `;

    return { contacts };
  }, { requireOrg: true })

  // Get contact by ID
  .get('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const contact = await sql`
      SELECT id, org_id, name, email, phone, company, title, created_at, updated_at
      FROM contacts
      WHERE id = ${params.id} AND org_id = ${orgId}
    `.then(rows => rows[0]);

    if (!contact) {
      return error(404, { error: 'Contact not found' });
    }

    return { contact };
  }, { requireOrg: true })

  // Create contact
  .post('/', async ({ body, session }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const contact = await sql`
      INSERT INTO contacts (org_id, name, email, phone, company, title)
      VALUES (${orgId}, ${body.name}, ${body.email}, ${body.phone}, ${body.company}, ${body.title})
      RETURNING id, org_id, name, email, phone, company, title, created_at, updated_at
    `.then(rows => rows[0]);

    return { contact };
  }, {
    requireOrg: true,
    body: t.Object({
      name: t.String(),
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      company: t.Optional(t.String()),
      title: t.Optional(t.String())
    })
  })

  // Update contact
  .patch('/:id', async ({ params, body, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const contact = await sql`
      UPDATE contacts
      SET
        name = COALESCE(${body.name}, name),
        email = COALESCE(${body.email}, email),
        phone = COALESCE(${body.phone}, phone),
        company = COALESCE(${body.company}, company),
        title = COALESCE(${body.title}, title)
      WHERE id = ${params.id} AND org_id = ${orgId}
      RETURNING id, org_id, name, email, phone, company, title, created_at, updated_at
    `.then(rows => rows[0]);

    if (!contact) {
      return error(404, { error: 'Contact not found' });
    }

    return { contact };
  }, {
    requireOrg: true,
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      company: t.Optional(t.String()),
      title: t.Optional(t.String())
    })
  })

  // Delete contact
  .delete('/:id', async ({ params, session, error }) => {
    const token = session as any as JWTPayload;
    const orgId = token.org_id;

    const result = await sql`
      DELETE FROM contacts
      WHERE id = ${params.id} AND org_id = ${orgId}
      RETURNING id
    `;

    if (result.length === 0) {
      return error(404, { error: 'Contact not found' });
    }

    return { success: true };
  }, { requireOrg: true });
