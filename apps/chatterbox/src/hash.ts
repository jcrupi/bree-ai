import { createHash } from 'crypto';

/**
 * Produces a stable, salted one-way fingerprint of conversational content.
 * The salt (orgId + userId) ensures the same question from different tenants
 * produces a different hash — privacy isolation by design.
 *
 * Algorithm: BLAKE2b-256 (built into Bun's crypto module — no extra dependency)
 *
 * IMPORTANT: This is NOT reversible. The original text cannot be recovered.
 */
export function ehash(orgId: string, userId: string, content: string): string {
  return createHash('blake2b256')
    .update(`${orgId}:${userId}:${content}`)
    .digest('hex');
}

/**
 * Produces a deterministic context ID from a set of resource UUIDs.
 *
 * The contextId uniquely identifies a specific resource window in a conversation.
 * Sorting ensures order doesn't matter — the same set of resources always
 * produces the same contextId regardless of the order they were passed in.
 *
 * When resources change, the contextId changes → automatic branch detection.
 *
 * Returns a 64-char hex string (BLAKE2b-256 of sorted, joined resource IDs).
 * Returns '0'.repeat(64) for empty resource sets (no-context sentinel).
 */
export function contextId(resourceIds: string[]): string {
  if (!resourceIds || resourceIds.length === 0) {
    return '0'.repeat(64);
  }
  const sorted = [...resourceIds].sort().join(':');
  return createHash('blake2b256').update(sorted).digest('hex');
}
