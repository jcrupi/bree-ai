/**
 * Auth Middleware for Client Org
 * Validates JWT and extracts org context
 */

import { Elysia } from 'elysia';
import { validateTokenForOrg } from '../auth/jwks-validator';
import type { JWTPayload } from '@bree-ai/flysaas-types';

/**
 * Auth middleware for client org
 */
export const authMiddleware = new Elysia({ name: 'client-auth' })
  .derive(async ({ request, headers }) => {
    // Extract token
    const authHeader = headers['authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return { session: null };
    }

    try {
      const payload = await validateTokenForOrg(token);
      return { session: payload };
    } catch (error) {
      console.error('Token validation error:', error);
      return { session: null };
    }
  })
  .macro(({ onBeforeHandle }) => ({
    /**
     * Require authentication
     */
    requireAuth(enabled: boolean) {
      if (!enabled) return;

      onBeforeHandle(({ session, error }) => {
        if (!session) {
          return error(401, { error: 'Unauthorized' });
        }
      });
    }
  }));
