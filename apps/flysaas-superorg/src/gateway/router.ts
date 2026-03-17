/**
 * API Gateway Router
 * Proxies requests to client org machines
 */

import { Elysia } from 'elysia';
import postgres from 'postgres';
import { validateJWT } from '@bree-ai/flysaas-auth';
import type { JWTPayload } from '@bree-ai/flysaas-types';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const JWKS_URL = process.env.JWKS_URL || 'http://localhost:3000/auth/jwks';

const sql = postgres(DATABASE_URL);

export const gatewayRouter = new Elysia()
  .all('/api/orgs/:orgSlug/apps/*', async ({ params, request, set }) => {
    try {
      const { orgSlug } = params;

      // 1. Validate JWT
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        set.status = 401;
        return { error: 'Missing authorization header' };
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      let claims: JWTPayload;

      try {
        claims = await validateJWT(token, JWKS_URL);
      } catch (error) {
        set.status = 401;
        return { error: 'Invalid token', details: error instanceof Error ? error.message : 'Unknown' };
      }

      // 2. Verify org_slug matches token
      if (claims.org_slug !== orgSlug) {
        set.status = 403;
        return {
          error: 'Organization mismatch',
          details: `Token org_slug '${claims.org_slug}' does not match route '${orgSlug}'`
        };
      }

      // 3. Lookup org's Fly app
      const org = await sql`
        SELECT fly_app_name, status
        FROM organizations
        WHERE slug = ${orgSlug}
      `.then(rows => rows[0]);

      if (!org) {
        set.status = 404;
        return { error: 'Organization not found' };
      }

      if (org.status !== 'active') {
        set.status = 403;
        return { error: 'Organization not active', status: org.status };
      }

      // 4. Build target URL
      const url = new URL(request.url);
      const appPath = url.pathname.split('/apps')[1] || '/';

      // In local dev, use localhost:3001
      // In production, use Fly.io internal URL
      const isDev = process.env.NODE_ENV !== 'production';
      const targetUrl = isDev
        ? `http://localhost:3001${appPath}${url.search}`
        : `http://${org.fly_app_name}.internal:3000${appPath}${url.search}`;

      console.log(`Proxying ${request.method} ${url.pathname} → ${targetUrl}`);

      // 5. Proxy request to client org
      const headers = new Headers(request.headers);
      headers.set('X-Org-Id', orgSlug);
      headers.set('X-Original-URL', url.toString());

      const proxyResponse = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD'
          ? await request.text()
          : undefined
      });

      // 6. Return proxied response
      const responseBody = await proxyResponse.text();
      set.status = proxyResponse.status;

      // Copy relevant headers
      for (const [key, value] of proxyResponse.headers.entries()) {
        if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          set.headers[key] = value;
        }
      }

      return responseBody;

    } catch (error) {
      console.error('Gateway error:', error);
      set.status = 500;
      return {
        error: 'Internal gateway error',
        details: error instanceof Error ? error.message : 'Unknown'
      };
    }
  });
