/**
 * JWKS Validator for Client Org
 * Validates JWT tokens from SuperOrg using JWKS endpoint
 */

import { validateJWT, validateJWTWithOrgCheck } from '@bree-ai/flysaas-auth';
import type { JWTPayload } from '@bree-ai/flysaas-types';

const SUPERORG_JWKS_URL = process.env.SUPERORG_JWKS_URL || 'http://localhost:3000/auth/jwks';
const ORG_ID = process.env.ORG_ID || '';

/**
 * Validate token from SuperOrg
 */
export async function validateToken(token: string): Promise<JWTPayload> {
  return await validateJWT(token, SUPERORG_JWKS_URL);
}

/**
 * Validate token and verify it matches this org
 */
export async function validateTokenForOrg(token: string): Promise<JWTPayload> {
  const payload = await validateJWT(token, SUPERORG_JWKS_URL);

  // Verify org_id or org_slug matches
  if (payload.org_id !== ORG_ID && payload.org_slug !== ORG_ID) {
    throw new Error(
      `Token org mismatch: expected '${ORG_ID}', got org_id='${payload.org_id}', org_slug='${payload.org_slug}'`
    );
  }

  return payload;
}
