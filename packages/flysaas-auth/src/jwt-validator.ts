/**
 * JWT Validator using JWKS
 * Validates JWT tokens using remote JWKS endpoint
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import type { JWTPayload } from '@bree-ai/flysaas-types';

/**
 * Validate JWT token using JWKS endpoint
 * @param token - JWT token to validate
 * @param jwksUrl - URL of the JWKS endpoint
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or verification fails
 */
export async function validateJWT(
  token: string,
  jwksUrl: string
): Promise<JWTPayload> {
  try {
    const jwks = createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jwtVerify(token, jwks);

    // Type assertion - Better-Auth will ensure these fields exist
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new Error(
      `JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate JWT and verify org_id claim matches expected value
 * @param token - JWT token to validate
 * @param jwksUrl - URL of the JWKS endpoint
 * @param expectedOrgId - Expected org_id to verify against
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or org_id doesn't match
 */
export async function validateJWTWithOrgCheck(
  token: string,
  jwksUrl: string,
  expectedOrgId: string
): Promise<JWTPayload> {
  const payload = await validateJWT(token, jwksUrl);

  if (payload.org_id !== expectedOrgId) {
    throw new Error(
      `Organization mismatch: token org_id '${payload.org_id}' does not match expected '${expectedOrgId}'`
    );
  }

  return payload;
}

/**
 * Extract JWT payload without full validation (for development/debugging)
 * WARNING: Do not use in production for security decisions
 * @param token - JWT token to decode
 * @returns Decoded payload (unverified)
 */
export function decodeJWT(token: string): JoseJWTPayload {
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Error('Invalid JWT format');
  }

  const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(decoded);
}
