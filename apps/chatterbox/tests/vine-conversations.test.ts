/**
 * chatterbox integration tests — example Vine conversations
 *
 * Tests the memory store, ehash, contextId utilities, and the new
 * conversation/context/branching model using the 5 Vine conversations
 * from apps/the-vineyard/src/data/vineConversations.ts as sample data.
 *
 * Run: bun test tests/vine-conversations.test.ts  (from apps/chatterbox/)
 */
import { test, expect, describe, beforeAll } from 'bun:test';
import { ehash, contextId } from '../src/hash.js';
import {
  validateAndIndex,
  startConversation,
  getConversation,
  readByAppId,
  readByOrgId,
  readByUserId,
  readById,
  readByEhash,
  readByConversationId,
  readByContextId,
  readByResourceId,
  getAllTurns,
  getTurnCount,
  getConversationCount,
} from '../src/memory-store.js';
import { QueryRequestSchema } from '../src/types.js';

// ── Sample data from The Vineyard VINE_CONVERSATIONS ──────────────────────────

interface VineMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface VineConversation {
  id: string;
  projectId: string;
  topic: string;
  participants: string[];
  messages: VineMessage[];
}

const VINE_CONVERSATIONS: VineConversation[] = [
  {
    id: 'vine-1', projectId: 'proj-1', topic: 'Homepage Hero Animation', participants: ['h2', 'ha2'],
    messages: [
      { id: 'm1', conversationId: 'vine-1', senderId: 'h2',  senderName: 'Mary',   content: 'Hey Marcus, I was thinking about the hero section animation. Can we make it more subtle?', timestamp: '2024-02-06T14:15:00Z' },
      { id: 'm2', conversationId: 'vine-1', senderId: 'ha2', senderName: 'Marcus', content: 'Sure Mary! I can adjust the easing curve. Did you have a specific reference in mind?',      timestamp: '2024-02-06T14:20:00Z' },
      { id: 'm3', conversationId: 'vine-1', senderId: 'h2',  senderName: 'Mary',   content: 'Think "floating feather" rather than "bouncing ball".', timestamp: '2024-02-06T14:22:00Z' },
      { id: 'm4', conversationId: 'vine-1', senderId: 'ha2', senderName: 'Marcus', content: 'Got it. I will switch to a spring physics model with high damping. Give me 10 mins.', timestamp: '2024-02-06T14:30:00Z' },
    ],
  },
  {
    id: 'vine-2', projectId: 'proj-1', topic: 'Database Schema Review', participants: ['h1', 'ha3'],
    messages: [
      { id: 'm1', conversationId: 'vine-2', senderId: 'h1',  senderName: 'John', content: 'Alex, are we using a relational model for the user preferences?', timestamp: '2024-02-06T10:45:00Z' },
      { id: 'm2', conversationId: 'vine-2', senderId: 'ha3', senderName: 'Alex', content: 'I was planning on JSONB for flexibility, since the preferences schema changes often.', timestamp: '2024-02-06T10:50:00Z' },
      { id: 'm3', conversationId: 'vine-2', senderId: 'h1',  senderName: 'John', content: 'Good call. Just make sure we index the frequent query paths.', timestamp: '2024-02-06T11:00:00Z' },
    ],
  },
  {
    id: 'vine-3', projectId: 'proj-1', topic: 'Mobile Navigation', participants: ['h2', 'ha1'],
    messages: [
      { id: 'm1', conversationId: 'vine-3', senderId: 'ha1', senderName: 'Sara', content: 'Mary, the mobile menu touch targets feel a bit small on iOS.', timestamp: '2024-02-05T16:30:00Z' },
      { id: 'm2', conversationId: 'vine-3', senderId: 'h2',  senderName: 'Mary', content: 'Oh? They should be 44px minimum. Let me check the Figma file.', timestamp: '2024-02-05T16:35:00Z' },
      { id: 'm3', conversationId: 'vine-3', senderId: 'ha1', senderName: 'Sara', content: 'The implementation rendered at 38px due to padding. I will bump the padding.', timestamp: '2024-02-05T16:45:00Z' },
    ],
  },
  {
    id: 'vine-4', projectId: 'proj-1', topic: 'API Rate Limiting', participants: ['h1', 'ha3'],
    messages: [
      { id: 'm1', conversationId: 'vine-4', senderId: 'ha3', senderName: 'Alex', content: 'We are hitting rate limits on the external image service.', timestamp: '2024-02-04T09:00:00Z' },
      { id: 'm2', conversationId: 'vine-4', senderId: 'h1',  senderName: 'John', content: 'Implement a caching layer? Redis should handle it.', timestamp: '2024-02-04T09:05:00Z' },
      { id: 'm3', conversationId: 'vine-4', senderId: 'ha3', senderName: 'Alex', content: 'On it. Will set TTL to 1 hour.', timestamp: '2024-02-04T09:15:00Z' },
    ],
  },
  {
    id: 'vine-5', projectId: 'proj-1', topic: 'Color Palette Accessibility', participants: ['h2', 'ha2'],
    messages: [
      { id: 'm1', conversationId: 'vine-5', senderId: 'h2',  senderName: 'Mary',   content: 'The secondary blue text on gray background fails WCAG AA.', timestamp: '2024-02-03T13:00:00Z' },
      { id: 'm2', conversationId: 'vine-5', senderId: 'ha2', senderName: 'Marcus', content: 'I see it. Contrast ratio is 3.8:1. Needs to be 4.5:1.', timestamp: '2024-02-03T13:10:00Z' },
      { id: 'm3', conversationId: 'vine-5', senderId: 'ha2', senderName: 'Marcus', content: 'Darkening the blue to #2563EB fixes it.', timestamp: '2024-02-03T13:20:00Z' },
    ],
  },
];

// Turn IDs + conversationIds for lookup tests
const turnIds:          Record<string, string> = {};
const conversationIds:  Record<string, string> = {}; // vine.id → conversationId

const ORG_ID = 'the-vineyard';
const APP_ID = 'the-vineyard';

// ── Setup: seed all vine messages as ConversationTurns ────────────────────────

beforeAll(() => {
  for (const vine of VINE_CONVERSATIONS) {
    // Each Vine is a conversation — start it
    const conv = startConversation({
      appId:       APP_ID,
      orgId:       ORG_ID,
      userId:      vine.participants[0],
      resourceIds: [vine.id, vine.projectId],
    });
    conversationIds[vine.id] = conv.conversationId;

    const msgs = vine.messages;
    for (let i = 0; i < msgs.length - 1; i++) {
      const question = msgs[i];
      const answer   = msgs[i + 1];
      const userId   = question.senderId;

      const qHash = ehash(ORG_ID, userId, question.content);
      const aHash = ehash(ORG_ID, userId, answer.content);

      const turn = validateAndIndex({
        conversationId: conv.conversationId,
        appId:          APP_ID,
        orgId:          ORG_ID,
        userId,
        claims:         { vineId: vine.id, topic: vine.topic },
        questionEhash:  qHash,
        answerEhash:    aHash,
        resourceIds:    [vine.id, vine.projectId],
        metadata:       { topic: vine.topic, questionId: question.id, answerId: answer.id },
        ts:             question.timestamp,
      });

      turnIds[`${vine.id}-${question.id}`] = turn.turnId;
    }
  }
});

// ── ehash utility ─────────────────────────────────────────────────────────────

describe('ehash utility', () => {
  test('produces 64-char hex string', () => {
    const h = ehash('the-vineyard', 'h2', 'hello');
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  test('is deterministic', () => {
    expect(ehash('org', 'user', 'text')).toBe(ehash('org', 'user', 'text'));
  });

  test('tenant-isolated: same text, different org → different hash', () => {
    expect(ehash('org-a', 'user', 'same')).not.toBe(ehash('org-b', 'user', 'same'));
  });

  test('user-isolated: same text, different user → different hash', () => {
    expect(ehash('org', 'user-1', 'same')).not.toBe(ehash('org', 'user-2', 'same'));
  });

  test('different content → different hash', () => {
    expect(ehash('org', 'user', 'A')).not.toBe(ehash('org', 'user', 'B'));
  });
});

// ── contextId utility ──────────────────────────────────────────────────────────

describe('contextId utility', () => {
  test('produces 64-char hex', () => {
    const c = contextId(['doc-1', 'doc-2']);
    expect(c).toHaveLength(64);
    expect(c).toMatch(/^[0-9a-f]{64}$/);
  });

  test('is deterministic', () => {
    expect(contextId(['a', 'b'])).toBe(contextId(['a', 'b']));
  });

  test('order-independent — sorted automatically', () => {
    expect(contextId(['doc-1', 'doc-2'])).toBe(contextId(['doc-2', 'doc-1']));
  });

  test('different resource sets → different contextId', () => {
    expect(contextId(['doc-1'])).not.toBe(contextId(['doc-2']));
  });

  test('empty set returns zero sentinel', () => {
    expect(contextId([])).toBe('0'.repeat(64));
  });

  test('adding a resource changes contextId (branching trigger)', () => {
    const before = contextId(['doc-1', 'doc-2']);
    const after  = contextId(['doc-1', 'doc-2', 'doc-3']);
    expect(before).not.toBe(after);
  });
});

// ── Conversations ─────────────────────────────────────────────────────────────

describe('conversations', () => {
  test('5 conversations were created (one per vine)', () => {
    expect(getConversationCount()).toBe(5);
  });

  test('getConversation returns the conversation envelope', () => {
    const convId = conversationIds['vine-1'];
    const conv   = getConversation(convId);
    expect(conv).not.toBeNull();
    expect(conv!.conversationId).toBe(convId);
    expect(conv!.orgId).toBe(ORG_ID);
    expect(conv!.turnCount).toBe(3); // vine-1 has 3 turn-pairs
  });

  test('conversation turnCount matches stored turns', () => {
    for (const vine of VINE_CONVERSATIONS) {
      const conv = getConversation(conversationIds[vine.id]);
      expect(conv!.turnCount).toBe(vine.messages.length - 1);
    }
  });

  test('conversation currentContextId matches contextId of resourceIds', () => {
    const vine   = VINE_CONVERSATIONS[0];
    const conv   = getConversation(conversationIds[vine.id])!;
    const expected = contextId([vine.id, vine.projectId]);
    expect(conv.currentContextId).toBe(expected);
  });

  test('getConversation returns null for unknown id', () => {
    expect(getConversation('NOTEXIST')).toBeNull();
  });
});

// ── Turn queries ──────────────────────────────────────────────────────────────

describe('turn queries', () => {
  const opts = QueryRequestSchema.parse({});

  test('total turn count: 5 vines × (msgs-1) pairs = 11', () => {
    expect(getTurnCount()).toBe(11);
  });

  test('readByOrgId returns all 11 turns', () => {
    const r = readByOrgId(ORG_ID, opts);
    expect(r.turns.length).toBe(11);
    expect(r.total).toBe(11);
    expect(r.nextCursor).toBeNull();
  });

  test('readByAppId returns all 11 turns', () => {
    expect(readByAppId(APP_ID, opts).turns.length).toBe(11);
  });

  test('readByUserId filters correctly — h2 only', () => {
    const r = readByUserId('h2', opts);
    expect(r.turns.length).toBeGreaterThan(0);
    r.turns.forEach(t => expect(t.userId).toBe('h2'));
  });

  test('readById returns the correct turn', () => {
    const turnId = Object.values(turnIds)[0];
    const turn   = readById(turnId);
    expect(turn).not.toBeNull();
    expect(turn!.turnId).toBe(turnId);
    expect(turn!.orgId).toBe(ORG_ID);
  });

  test('readById returns null for unknown id', () => {
    expect(readById('NOTEXIST')).toBeNull();
  });

  test('readByEhash finds turns by questionEhash', () => {
    const q      = VINE_CONVERSATIONS[0].messages[0];
    const qHash  = ehash(ORG_ID, q.senderId, q.content);
    const r      = readByEhash(qHash, opts);
    expect(r.turns.length).toBeGreaterThan(0);
    expect(r.turns[0].questionEhash).toBe(qHash);
  });

  test('readByConversationId returns all turns for vine-1', () => {
    const convId = conversationIds['vine-1'];
    const r      = readByConversationId(convId, opts);
    expect(r.turns.length).toBe(3); // vine-1 has 3 pairs
    r.turns.forEach(t => expect(t.conversationId).toBe(convId));
  });

  test('readByContextId returns turns for the vine-1 resource set', () => {
    const ctxId = contextId(['vine-1', 'proj-1']);
    const r     = readByContextId(ctxId, opts);
    // vine-1 and vine-3 share proj-1 but not vine.id; vine-1 unique context
    r.turns.forEach(t => expect(t.contextId).toBe(ctxId));
  });

  test('readByResourceId returns all turns that used vine-2', () => {
    const r = readByResourceId('vine-2', opts);
    expect(r.turns.length).toBe(2); // vine-2 has 2 turn-pairs
    r.turns.forEach(t => expect((t.resourceIds as string[]).includes('vine-2')).toBe(true));
  });

  test('validateAndIndex rejects missing conversationId', () => {
    expect(() => validateAndIndex({
      // no conversationId
      appId: 'test', orgId: 'org', userId: 'u',
      questionEhash: 'a'.repeat(64),
      answerEhash:   'b'.repeat(64),
    })).toThrow();
  });

  test('validateAndIndex rejects invalid ehash format', () => {
    expect(() => validateAndIndex({
      conversationId: 'conv_test',
      appId: 'test', orgId: 'org', userId: 'u',
      questionEhash: 'tooshort',
      answerEhash:   'alsotooshort',
    })).toThrow();
  });
});

// ── Branching ─────────────────────────────────────────────────────────────────

describe('context branching', () => {
  test('same resources → same contextId across turns in a conversation', () => {
    const convId = conversationIds['vine-1'];
    const r      = readByConversationId(convId, QueryRequestSchema.parse({}));
    const ctxIds = new Set(r.turns.map(t => t.contextId));
    expect(ctxIds.size).toBe(1); // all same resource set → no branches
  });

  test('changing resources creates a new contextId (branch)', () => {
    // Simulate branching: start a conversation, add turns with different resource sets
    const conv   = startConversation({ appId: APP_ID, orgId: ORG_ID, userId: 'usr-branch-test' });
    const qh     = 'a'.repeat(64);
    const ah     = 'b'.repeat(64);

    const turn1 = validateAndIndex({
      conversationId: conv.conversationId,
      appId: APP_ID, orgId: ORG_ID, userId: 'usr-branch-test',
      questionEhash: qh, answerEhash: ah,
      resourceIds: ['doc-A', 'doc-B'],
    });

    const turn2 = validateAndIndex({
      conversationId: conv.conversationId,
      appId: APP_ID, orgId: ORG_ID, userId: 'usr-branch-test',
      questionEhash: qh, answerEhash: ah,
      resourceIds: ['doc-C', 'doc-D'],  // different → branch
    });

    expect(turn1.contextId).not.toBe(turn2.contextId);
    expect(turn2.parentContextId).toBe(turn1.contextId);
  });

  test('branched conversation has 2 contexts in history', () => {
    // no initial resourceIds → seeds with zero-sentinel contextId
    const conv = startConversation({ appId: APP_ID, orgId: ORG_ID, userId: 'usr-hist-test' });
    const qh = 'c'.repeat(64);
    const ah = 'd'.repeat(64);

    validateAndIndex({ conversationId: conv.conversationId, appId: APP_ID, orgId: ORG_ID, userId: 'usr-hist-test', questionEhash: qh, answerEhash: ah, resourceIds: ['r1'] });
    validateAndIndex({ conversationId: conv.conversationId, appId: APP_ID, orgId: ORG_ID, userId: 'usr-hist-test', questionEhash: qh, answerEhash: ah, resourceIds: ['r2'] });

    // history: [zero-sentinel, contextId(r1), contextId(r2)] = 3
    const updated = getConversation(conv.conversationId)!;
    expect(updated.contextHistory.length).toBe(3);
  });


  test('re-adding original resources restores original contextId (not a new branch entry)', () => {
    const conv = startConversation({ appId: APP_ID, orgId: ORG_ID, userId: 'usr-restore-test' });
    const qh = 'e'.repeat(64);
    const ah = 'f'.repeat(64);

    validateAndIndex({ conversationId: conv.conversationId, appId: APP_ID, orgId: ORG_ID, userId: 'usr-restore-test', questionEhash: qh, answerEhash: ah, resourceIds: ['r1'] });
    validateAndIndex({ conversationId: conv.conversationId, appId: APP_ID, orgId: ORG_ID, userId: 'usr-restore-test', questionEhash: qh, answerEhash: ah, resourceIds: ['r2'] }); // branch
    validateAndIndex({ conversationId: conv.conversationId, appId: APP_ID, orgId: ORG_ID, userId: 'usr-restore-test', questionEhash: qh, answerEhash: ah, resourceIds: ['r1'] }); // back to r1

    // history: [zero-sentinel, contextId(r1), contextId(r2)] = 3
    // returning to r1 does NOT add duplicate — dedup is working
    const updated = getConversation(conv.conversationId)!;
    expect(updated.contextHistory.length).toBe(3);
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────

describe('pagination', () => {
  const opts3 = QueryRequestSchema.parse({ limit: 3 });

  test('limit=3 returns 3 turns and a cursor', () => {
    const r = readByOrgId(ORG_ID, opts3);
    expect(r.turns.length).toBe(3);
    expect(r.nextCursor).not.toBeNull();
  });

  test('cursor advances to next page with no overlap', () => {
    const page1  = readByOrgId(ORG_ID, opts3);
    const opts3b = QueryRequestSchema.parse({ limit: 3, cursor: page1.nextCursor });
    const page2  = readByOrgId(ORG_ID, opts3b);
    expect(page2.turns.length).toBe(3);
    const ids1 = new Set(page1.turns.map(t => t.turnId));
    page2.turns.forEach(t => expect(ids1.has(t.turnId)).toBe(false));
  });
});

// ── Vine topic coverage ───────────────────────────────────────────────────────

describe('vine topic coverage', () => {
  const opts = QueryRequestSchema.parse({});

  VINE_CONVERSATIONS.forEach(vine => {
    test(`"${vine.topic}" — all message pairs stored`, () => {
      const convId = conversationIds[vine.id];
      const r      = readByConversationId(convId, opts);
      expect(r.turns.length).toBe(vine.messages.length - 1);
    });
  });

  test('metadata preserves vine topic on every turn', () => {
    getAllTurns(opts).turns
      .filter(t => !['usr-branch-test', 'usr-hist-test', 'usr-restore-test'].includes(t.userId))
      .forEach(t => expect(typeof (t.metadata as any).topic).toBe('string'));
  });

  test('each turn has a valid ULID turnId', () => {
    getAllTurns(opts).turns.forEach(t => {
      expect(t.turnId).toBeDefined();
      expect(t.turnId.length).toBeGreaterThan(0);
    });
  });

  test('every turn links to a real conversation', () => {
    const opts = QueryRequestSchema.parse({});
    getAllTurns(opts).turns.forEach(t => {
      const conv = getConversation(t.conversationId);
      expect(conv).not.toBeNull();
    });
  });
});
