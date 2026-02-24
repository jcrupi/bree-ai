/**
 * Auth Provider Configuration
 *
 * Switch between Identity Zero (envelope-encrypted per-tenant JWTs) and
 * Better Auth (JWKS-validated JWTs with org context, token balance, etc.).
 *
 * Env:
 *   AUTH_PROVIDER = 'identity-zero' | 'better-auth'  (default: identity-zero)
 *   BETTER_AUTH_JWKS_URL = full URL to JWKS endpoint (e.g. https://api.bree.ai/api/auth/jwks)
 *   BETTER_AUTH_URL = base URL (used if JWKS URL not set: BETTER_AUTH_URL + /api/auth/jwks)
 */

import * as jose from 'jose';
import type { JWTPayload } from './auth';

export type AuthProvider = 'identity-zero' | 'better-auth';

export const AUTH_PROVIDER: AuthProvider =
  (process.env.AUTH_PROVIDER as AuthProvider) || 'identity-zero';

function getBetterAuthJwksUrl(): string | null {
  const url =
    process.env.BETTER_AUTH_JWKS_URL ||
    (process.env.BETTER_AUTH_URL
      ? `${process.env.BETTER_AUTH_URL.replace(/\/$/, '')}/api/auth/jwks`
      : null);
  return url || null;
}

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJwks() {
  const url = getBetterAuthJwksUrl();
  if (!url) {
    throw new Error(
      'BETTER_AUTH_JWKS_URL or BETTER_AUTH_URL must be set when AUTH_PROVIDER=better-auth'
    );
  }
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

/**
 * Map Better Auth JWT claims to JWTPayload-compatible shape.
 * Better Auth JWTs carry: sub, org_id, org_role, org_permissions,
 * token_balance, allowed_models, plan_tier, email?, name?
 */
function mapBetterAuthToPayload(raw: jose.JWTPayload): JWTPayload {
  const sub = raw.sub as string;
  const orgId = raw.org_id as string | undefined;
  const orgRole = (raw.org_role as string) || 'member';
  const orgPermissions = (raw.org_permissions as string[] | undefined) || [];

  return {
    userId: sub as unknown as number,
    email: (raw.email as string) || `${sub}@bree.ai`,
    name: (raw.name as string) || sub,
    roles: [
      {
        role: orgRole as 'super_org' | 'org' | 'admin' | 'member',
        organizationSlug: orgId,
        organizationName: orgId
      }
    ],
    // Better Auth / Token House extensions (available for downstream NATS, etc.)
    org_id: orgId,
    org_role: orgRole,
    org_permissions: orgPermissions,
    token_balance: raw.token_balance as number | undefined,
    token_budget: raw.token_budget as number | undefined,
    allowed_models: raw.allowed_models as string[] | undefined,
    plan_tier: raw.plan_tier as string | undefined
  };
}

/**
 * Verify JWT using the configured auth provider.
 * Returns JWTPayload (with optional Better Auth claims when using better-auth).
 */
export async function verifyToken(
  token: string,
  identityZeroVerify: (token: string) => Promise<jose.JWTPayload>
): Promise<JWTPayload | null> {
  if (AUTH_PROVIDER === 'better-auth') {
    try {
      const jwksSet = getJwks();
      const { payload } = await jose.jwtVerify(token, jwksSet);
      return mapBetterAuthToPayload(payload);
    } catch (err) {
      console.error('Better Auth JWT verification failed:', err);
      return null;
    }
  }

  return identityZeroVerify(token) as Promise<JWTPayload | null>;
}

export function isBetterAuth(): boolean {
  return AUTH_PROVIDER === 'better-auth';
}
