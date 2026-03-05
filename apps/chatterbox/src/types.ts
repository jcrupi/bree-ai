import { z } from 'zod';
import { ulid } from 'ulid';

// ── ConvoTurn ──────────────────────────────────────────────────────────

export const ConvoTurnSchema = z.object({
  turnId:          z.string().default(() => ulid()),

  // Session identity
  convoId:         z.string().min(1),          // ULID — assigned at convo start
  contextId:       z.string().default(''),         // derived from sorted(resourceIds) if omitted
  parentContextId: z.string().optional(),      // contextId this branched from (if any)

  // Participant identity
  appId:           z.string().min(1),
  orgId:           z.string().min(1),
  userId:          z.string().min(1),
  claims:          z.record(z.unknown()).default({}),

  // Content fingerprints (no plaintext ever stored)
  questionEhash:   z.string().regex(/^[0-9a-f]{64}$/, 'must be 64-char hex (BLAKE2b-256)'),
  answerEhash:     z.string().regex(/^[0-9a-f]{64}$/, 'must be 64-char hex (BLAKE2b-256)'),

  // Resource context — the active set at this turn (drives contextId)
  resourceIds:     z.array(z.string()).default([]),

  metadata:        z.record(z.unknown()).default({}),
  ts:              z.string().datetime().default(() => new Date().toISOString()),
});

export type ConvoTurn = z.infer<typeof ConvoTurnSchema>;

// ── Convo (the session envelope) ──────────────────────────────────────

export interface Convo {
  convoId:         string;           // ULID
  appId:           string;
  orgId:           string;
  userId:          string;
  currentContextId: string;          // most recent contextId
  contextHistory:  string[];         // ordered list of contextIds (branches)
  
  // Embedded turns (optional, when fetched as part of the convo)
  turns?:          ConvoTurn[];
  
  // Smart Memory
  smartMemoryEnabled:   boolean;
  memoryThreshold:      number;      // N turns between memories
  turnsSinceLastMemory: number;      // counter
  latestMemoryId?:      string;      // ULID of the most recent SmartMemory attached to this convo
  
  turnCount:       number;
  createdAt:       string;
  updatedAt:       string;
}

// ── Smart Memory ─────────────────────────────────────────────────────────────

export const SmartMemorySchema = z.object({
  memoryId:         z.string().default(() => ulid()),
  convoId:          z.string().min(1),
  contextId:        z.string().min(1),             // the context branch this was generated in
  parentMemoryId:   z.string().optional(),         // the memory this builds upon
  
  summary:          z.string().min(1),             // AI-generated compressed context (PLAINTEXT)
  
  turnsIncluded:    z.number().int().min(1),       // how many turns went into this summary
  turnRangeStart:   z.string().min(1),             // ULID of first turn in segment
  turnRangeEnd:     z.string().min(1),             // ULID of last turn in segment
  
  model:            z.string().default('claude-3-5-haiku-20241022'),
  promptTokens:     z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  createdAt:        z.string().datetime().default(() => new Date().toISOString()),
});

export type SmartMemory = z.infer<typeof SmartMemorySchema>;

// ── Context Assembly ─────────────────────────────────────────────────────────

export interface AssembledContext {
  convoId:              string;
  contextId:            string;
  smartMemoryEnabled:   boolean;
  latestMemory?:        SmartMemory;
  recentTurns:          ConvoTurn[]; // The ehash records for the un-summarized turns
  recentTurnCount:      number;
  turnsUntilNextMemory: number;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export const QueryRequestSchema = z.object({
  limit:  z.number().int().min(1).max(500).default(50),
  cursor: z.string().nullable().default(null),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;

export interface QueryResult {
  turns:      ConvoTurn[];
  nextCursor: string | null;
  total:      number;
}

export interface ConvoResult {
  convos:     Convo[];
  nextCursor: string | null;
  total:      number;
}
