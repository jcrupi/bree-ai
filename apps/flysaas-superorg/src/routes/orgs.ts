/**
 * Organization Management API
 * Create, manage, and provision organizations
 */

import { Elysia, t } from 'elysia';
import postgres from 'postgres';
import type { JWTPayload } from "../auth/jwt";
import { verifyToken } from "../auth/jwt";
import { ProvisioningService } from '@bree-ai/flysaas-provisioning';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const FLY_API_TOKEN = process.env.FLY_API_TOKEN || '';

const sql = postgres(DATABASE_URL);
const provisioningService = new ProvisioningService(FLY_API_TOKEN);

export const orgsRoutes = new Elysia({ prefix: '/api/orgs' })

  // List user's organizations
  .get('/', async ({ headers, set }) => {
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

    const orgs = await sql`
      SELECT o.id, o.slug, o.name, o.fly_app_name, o.fly_machine_id, o.status,
             o.created_at, o.updated_at, om.role
      FROM organizations o
      JOIN org_members om ON om.org_id = o.id
      WHERE om.user_id = ${userId}
      ORDER BY o.created_at DESC
    `;

    return { organizations: orgs };
  })

  // Get organization by slug
  .get('/:slug', async ({ params, headers, set }) => {
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

    const org = await sql`
      SELECT o.id, o.slug, o.name, o.fly_app_name, o.fly_machine_id, o.status,
             o.created_at, o.updated_at, om.role
      FROM organizations o
      JOIN org_members om ON om.org_id = o.id
      WHERE o.slug = ${params.slug} AND om.user_id = ${userId}
    `.then(rows => rows[0]);

    if (!org) {
      set.status = 404;
      return { error: 'Organization not found' };
    }

    return { organization: org };
  })

  // Create new organization (with provisioning)
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

    // Start provisioning
    console.log(`Provisioning org: ${body.org_slug}`);
    const result = await provisioningService.provisionOrg({
      org_slug: body.org_slug,
      org_name: body.org_name,
      region: body.region,
      owner_user_id: userId
    });

    if (!result.success) {
      return {
        error: 'Provisioning failed',
        details: result.error
      };
    }

    // Save to database
    const org = await sql`
      INSERT INTO organizations (slug, name, fly_app_name, fly_machine_id, status)
      VALUES (
        ${body.org_slug},
        ${body.org_name},
        ${result.organization!.fly_app_name},
        ${result.organization!.fly_machine_id},
        'active'
      )
      RETURNING id, slug, name, fly_app_name, fly_machine_id, status, created_at, updated_at
    `.then(rows => rows[0]);

    // Add user as owner
    await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${org.id}, ${userId}, 'owner')
    `;

    return {
      organization: org,
      fly_url: `https://${result.organization!.fly_app_name}.fly.dev`
    };
  }, {
    body: t.Object({
      org_slug: t.String({ minLength: 3, maxLength: 50 }),
      org_name: t.String({ minLength: 1, maxLength: 100 }),
      region: t.Optional(t.String())
    })
  })

  // Update organization status
  .patch('/:slug', async ({ params, body, headers, set }) => {
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

    // Check if user has admin/owner role
    const member = await sql`
      SELECT om.role
      FROM org_members om
      JOIN organizations o ON o.id = om.org_id
      WHERE o.slug = ${params.slug} AND om.user_id = ${userId}
    `.then(rows => rows[0]);

    if (!member || !['owner', 'admin'].includes(member.role)) {
      set.status = 403;
      return { error: 'Insufficient permissions' };
    }

    const org = await sql`
      UPDATE organizations
      SET status = COALESCE(${body.status}, status)
      WHERE slug = ${params.slug}
      RETURNING id, slug, name, fly_app_name, fly_machine_id, status, created_at, updated_at
    `.then(rows => rows[0]);

    if (!org) {
      set.status = 404;
      return { error: 'Organization not found' };
    }

    return { organization: org };
  }, {
    body: t.Object({
      status: t.Optional(t.String())
    })
  });
