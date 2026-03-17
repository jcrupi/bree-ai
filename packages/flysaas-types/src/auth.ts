/**
 * FlySaaS Auth Types
 * JWT and authentication structures
 */

import type { OrgRole } from './org';

export interface JWTPayload {
  sub: string;                // user_id
  email: string;
  name: string;
  org_id: string;
  org_slug: string;
  org_role: OrgRole;
  org_status: string;
  iat: number;                // issued at
  exp: number;                // expiration
}

export interface OrgClaims {
  org_id: string;
  org_slug: string;
  org_role: OrgRole;
  org_status: string;
}

export interface AuthSession {
  user_id: string;
  org_id: string;
  org_role: OrgRole;
  token: string;
}

export interface JWKSResponse {
  keys: JWK[];
}

export interface JWK {
  kty: string;
  use: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
}
