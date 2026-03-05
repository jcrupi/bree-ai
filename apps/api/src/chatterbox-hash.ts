import { createHash } from 'node:crypto';

/**
 * Produces a stable, salted one-way fingerprint of conversational content.
 * Must match the logic in apps/chatterbox/src/hash.ts
 */
export function ehash(orgId: string, userId: string, content: string): string {
  return createHash('blake2b256')
    .update(`${orgId}:${userId}:${content}`)
    .digest('hex');
}

/**
 * Produces a deterministic context ID from a set of resource UUIDs.
 */
export function contextId(resourceIds: string[]): string {
  if (!resourceIds || resourceIds.length === 0) {
    return '0'.repeat(64);
  }
  const sorted = [...resourceIds].sort().join(':');
  return createHash('blake2b256').update(sorted).digest('hex');
}
