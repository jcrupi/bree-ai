/**
 * Authentication Routes
 * Better-Auth integration for Elysia
 */

import { Elysia } from 'elysia';
import { auth } from '../auth/better-auth';

export const authRoutes = new Elysia()
  // Catch-all handler for all auth routes
  // Better-Auth handles routing internally
  .all('/auth/*', async ({ request }) => {
    return await auth.handler(request);
  });
