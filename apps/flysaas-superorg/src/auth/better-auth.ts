/**
 * Better-Auth Configuration
 * Auth server with organization support and custom JWT claims
 */

import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret-change-in-production';

const sql = postgres(DATABASE_URL);

export const auth = betterAuth({
  database: {
    db: sql,
    type: 'postgres'
  },
  baseURL: BASE_URL,
  secret: JWT_SECRET,

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // Set to true in production
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update session every 24 hours
  },

  // JWT configuration with custom claims
  advanced: {
    generateId: () => crypto.randomUUID(),
    customizeToken: async (token, user, session) => {
      // Get user's active organization
      const orgMember = await sql`
        SELECT om.org_id, om.role, o.slug, o.status
        FROM org_members om
        JOIN organizations o ON o.id = om.org_id
        WHERE om.user_id = ${user.id}
        AND o.status = 'active'
        ORDER BY om.created_at ASC
        LIMIT 1
      `.then(rows => rows[0]);

      if (!orgMember) {
        // No organization yet - user needs to create one
        return {
          ...token,
          org_id: null,
          org_slug: null,
          org_role: null,
          org_status: null
        };
      }

      // Add custom org claims to token
      return {
        ...token,
        org_id: orgMember.org_id,
        org_slug: orgMember.slug,
        org_role: orgMember.role,
        org_status: orgMember.status
      };
    }
  },

  // Organization plugin
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      schema: {
        organization: {
          fields: {
            fly_app_name: {
              type: 'string',
              unique: true,
              required: false
            },
            fly_machine_id: {
              type: 'string',
              required: false
            },
            status: {
              type: 'string',
              defaultValue: 'provisioning'
            }
          }
        }
      }
    })
  ]
});

export type AuthType = typeof auth;
