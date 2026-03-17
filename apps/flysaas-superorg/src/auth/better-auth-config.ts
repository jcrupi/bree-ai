/**
 * Better Auth Configuration
 */

import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  trustedOrigins: ['http://localhost:3002', 'http://localhost:7800'],
});
