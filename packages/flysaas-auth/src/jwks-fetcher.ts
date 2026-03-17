/**
 * JWKS Fetcher with Caching
 * Fetches and caches JWKS (JSON Web Key Sets) for JWT validation
 */

import type { JWKSResponse } from '@bree-ai/flysaas-types';

interface CacheEntry {
  jwks: JWKSResponse;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetch JWKS from a URL with caching
 * @param jwksUrl - URL to fetch JWKS from
 * @returns JWKS response
 */
export async function fetchJWKS(jwksUrl: string): Promise<JWKSResponse> {
  const now = Date.now();
  const cached = cache.get(jwksUrl);

  // Return cached if valid
  if (cached && cached.expiresAt > now) {
    return cached.jwks;
  }

  // Fetch fresh JWKS
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
  }

  const jwks = await response.json() as JWKSResponse;

  // Cache the result
  cache.set(jwksUrl, {
    jwks,
    expiresAt: now + CACHE_TTL
  });

  return jwks;
}

/**
 * Clear cached JWKS for a specific URL or all URLs
 * @param jwksUrl - Optional specific URL to clear, omit to clear all
 */
export function clearJWKSCache(jwksUrl?: string): void {
  if (jwksUrl) {
    cache.delete(jwksUrl);
  } else {
    cache.clear();
  }
}
