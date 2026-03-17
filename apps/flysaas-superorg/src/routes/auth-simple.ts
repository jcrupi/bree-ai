/**
 * Simple Authentication Routes
 * Custom JWT-based authentication
 */

import { Elysia } from 'elysia';
import postgres from 'postgres';
import { signToken, verifyToken } from '../auth/jwt';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const sql = postgres(DATABASE_URL);

export const authSimpleRoutes = new Elysia()
  // Sign up
  .post('/auth/sign-up', async ({ body, set }) => {
    console.log('Sign-up route hit, body:', body);
    try {
      const { email, password, name } = body as { email: string; password: string; name: string };

      // Check if user exists
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        set.status = 400;
        return { error: 'Email already registered' };
      }

      // Hash password
      const hashedPassword = await Bun.password.hash(password);

      // Create user
      const [user] = await sql`
        INSERT INTO users (email, name, password_hash, email_verified)
        VALUES (${email}, ${name}, ${hashedPassword}, false)
        RETURNING id, email, name
      `;

      // Generate token
      const token = await signToken({
        user_id: user.id,
        email: user.email,
        name: user.name
      });

      return { user, token };
    } catch (error) {
      console.error('Sign-up error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Sign in
  .post('/auth/sign-in', async ({ body, set }) => {
    console.log('Sign-in route hit, body:', body);
    try {
      const { email, password } = body as { email: string; password: string };

      // Hardcoded demo user (temporary - Elysia has issues with ! character in JSON)
      if (email === 'demo@flysaas.dev' && password === 'Demo123') {
        const token = await signToken({
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'demo@flysaas.dev',
          name: 'Demo User'
        });

        return {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'demo@flysaas.dev',
            name: 'Demo User'
          },
          token
        };
      }

      // Find user
      const [user] = await sql`
        SELECT id, email, name, password_hash FROM users WHERE email = ${email}
      `;

      if (!user) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Verify password
      const valid = await Bun.password.verify(password, user.password_hash);
      if (!valid) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Get user's organization
      const [orgMember] = await sql`
        SELECT om.org_id, om.role, o.slug
        FROM org_members om
        JOIN organizations o ON o.id = om.org_id
        WHERE om.user_id = ${user.id}
        AND o.status = 'active'
        ORDER BY om.created_at ASC
        LIMIT 1
      `;

      // Generate token
      const token = await signToken({
        user_id: user.id,
        email: user.email,
        name: user.name,
        org_id: orgMember?.org_id,
        org_slug: orgMember?.slug,
        org_role: orgMember?.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          org_id: orgMember?.org_id,
          org_slug: orgMember?.slug,
          org_role: orgMember?.role
        },
        token
      };
    } catch (error) {
      console.error('Sign-in error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Get current user
  .get('/auth/me', async ({ headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    try {
      const token = authHeader.substring(7);
      const payload = await verifyToken(token);
      return { user: payload };
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
  });
