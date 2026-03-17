/**
 * JWKS Endpoint
 * Exposes public keys for JWT verification
 */

import { exportJWK, generateKeyPair } from 'jose';
import type { JWKSResponse } from '@bree-ai/flysaas-types';

// In production, these should be stored securely and rotated regularly
let cachedKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;

/**
 * Generate or retrieve cached RSA key pair
 */
async function getOrGenerateKeyPair() {
  if (!cachedKeyPair) {
    const keyPair = await generateKeyPair('RS256', { extractable: true });
    cachedKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }
  return cachedKeyPair;
}

/**
 * Generate JWKS (JSON Web Key Set) response
 */
export async function generateJWKS(): Promise<JWKSResponse> {
  const keyPair = await getOrGenerateKeyPair();
  const jwk = await exportJWK(keyPair.publicKey);

  return {
    keys: [
      {
        ...jwk,
        kid: 'superorg-key-1', // Key ID
        use: 'sig',            // Signature use
        alg: 'RS256'           // Algorithm
      } as any
    ]
  };
}

/**
 * Get private key for signing JWTs
 * Used by Better-Auth internally
 */
export async function getPrivateKey(): Promise<CryptoKey> {
  const keyPair = await getOrGenerateKeyPair();
  return keyPair.privateKey;
}

/**
 * Rotate keys (for production key rotation)
 */
export function rotateKeys(): void {
  cachedKeyPair = null;
}
