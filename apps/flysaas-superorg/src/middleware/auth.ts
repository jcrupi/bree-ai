/**
 * Auth Middleware
 * Protect routes and extract org context
 */

import { Elysia } from 'elysia';
import { verifyToken } from '../auth/jwt';
import type { JWTPayload } from '../auth/jwt';

/**
 * Auth middleware plugin
 * Adds session to context using onBeforeHandle
 */
export const authMiddleware = new Elysia({ name: 'auth' })
  .onBeforeHandle(async ({ request, headers, store }: any) => {
    // Extract token from Authorization header
    const authHeader = headers['authorization'];
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    console.log('[Auth Middleware] Authorization header:', authHeader ? 'present' : 'missing');
    console.log('[Auth Middleware] Extracted token:', token ? `${token.substring(0, 20)}...` : 'none');

    if (!token) {
      console.log('[Auth Middleware] No token, setting null session');
      store.session = null;
      return;
    }

    try {
      // Verify JWT token
      const session = await verifyToken(token);
      console.log('[Auth Middleware] Session verified:', session ? 'yes' : 'no');
      console.log('[Auth Middleware] Session payload:', session);
      store.session = session;
    } catch (error) {
      console.error('[Auth Middleware] Session validation error:', error);
      store.session = null;
    }
  })
  .derive(({ store }: any) => {
    return {
      session: store.session
    };
  });
