import { ulid } from 'ulid';
import { contextId as computeContextId } from './hash.js';
import {
  ConvoTurnSchema,
  QueryRequestSchema,
  type ConvoTurn,
  type Convo,
  type QueryRequest,
  type QueryResult,
  type ConvoResult,
} from './types.js';

// ── Storage ───────────────────────────────────────────────────────────────────

const turns: ConvoTurn[] = [];
const convos = new Map<string, Convo>();  // convoId → Convo

// ── Convos ─────────────────────────────────────────────────────────────

/**
 * Start a new convo — returns a fresh convoId.
 * The initial contextId is computed from the starting resourceIds (may be empty).
 */
export function startConvo(opts: {
  appId:               string;
  orgId:               string;
  userId:              string;
  resourceIds?:        string[];
  smartMemoryEnabled?: boolean;
  memoryThreshold?:    number;
}): Convo {
  const convoId  = ulid();
  const initialContextId = computeContextId(opts.resourceIds ?? []);
  const now              = new Date().toISOString();

  const convo: Convo = {
    convoId,
    appId:            opts.appId,
    orgId:            opts.orgId,
    userId:           opts.userId,
    currentContextId:     initialContextId,
    contextHistory:       [initialContextId],
    smartMemoryEnabled:   opts.smartMemoryEnabled ?? false,
    memoryThreshold:      opts.memoryThreshold ?? parseInt(process.env.SMART_MEMORY_THRESHOLD || '10', 10),
    turnsSinceLastMemory: 0,
    turnCount:            0,
    createdAt:            now,
    updatedAt:            now,
  };

  convos.set(convoId, convo);
  return convo;
}

/**
 * Retrieve a convo by ID.
 * Optionally attaches turns.
 */
export function getConvo(convoId: string, includeTurns = false): Convo | null {
  const convo = convos.get(convoId) ?? null;
  if (convo && includeTurns) {
    convo.turns = turns.filter(t => t.convoId === convoId);
  }
  return convo;
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Validate and index a ConvoTurn.
 *
 * - Auto-assigns turnId (ULID) if missing.
 * - Derives contextId from resourceIds if not provided.
 * - Creates/updates the parent Convo record.
 * - Detects branching: if contextId differs from convo's currentContextId,
 *   sets parentContextId and appends the new context to contextHistory.
 */
export function validateAndIndex(raw: unknown): ConvoTurn {
  const parsed = ConvoTurnSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid ConvoTurn: ${parsed.error.message}`);
  }

  const turn = parsed.data;
  if (!turn.turnId) turn.turnId = ulid();

  // Derive contextId from resourceIds if caller didn't provide one
  const derivedCtx = computeContextId(turn.resourceIds);
  if (!turn.contextId || turn.contextId === derivedCtx) {
    (turn as any).contextId = derivedCtx;
  }

  // upsert the Convo envelope
  let convo = convos.get(turn.convoId);
  if (!convo) {
    // First turn in this convo — auto-create the convo record
    convo = {
      convoId:         turn.convoId,
      appId:           turn.appId,
      orgId:           turn.orgId,
      userId:          turn.userId,
      currentContextId:     turn.contextId,
      contextHistory:       [turn.contextId],
      smartMemoryEnabled:   false,
      memoryThreshold:      parseInt(process.env.SMART_MEMORY_THRESHOLD || '10', 10),
      turnsSinceLastMemory: 0,
      turnCount:            0,
      createdAt:            turn.ts,
      updatedAt:            turn.ts,
    };
    convos.set(turn.convoId, convo);
  }

  // Detect branch: resources changed since last turn in this convo
  if (convo.currentContextId !== turn.contextId) {
    // Tag the turn with the parent context it branched from
    (turn as any).parentContextId = convo.currentContextId;
    // Record the new branch in history (avoid duplicates)
    if (!convo.contextHistory.includes(turn.contextId)) {
      convo.contextHistory.push(turn.contextId);
    }
    convo.currentContextId = turn.contextId;
  }

  convo.turnCount += 1;
  convo.turnsSinceLastMemory += 1;
  convo.updatedAt = turn.ts;

  turns.push(turn);
  return turn;
}

// ── Pagination helper ─────────────────────────────────────────────────────────

function paginate(items: ConvoTurn[], req: QueryRequest): QueryResult {
  const { limit, cursor } = req;
  let startIdx = 0;
  if (cursor) {
    const idx = items.findIndex((t) => t.turnId === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }
  const page = items.slice(startIdx, startIdx + limit);
  const nextCursor =
    page.length === limit && startIdx + limit < items.length
      ? page[page.length - 1].turnId
      : null;
  return { turns: page, nextCursor, total: items.length };
}

function paginateConvos(
  items: Convo[],
  req: QueryRequest,
): ConvoResult {
  const { limit, cursor } = req;
  let startIdx = 0;
  if (cursor) {
    const idx = items.findIndex((c) => c.convoId === cursor);
    if (idx !== -1) startIdx = idx + 1;
  }
  const page = items.slice(startIdx, startIdx + limit);
  const nextCursor =
    page.length === limit && startIdx + limit < items.length
      ? page[page.length - 1].convoId
      : null;
  return { convos: page, nextCursor, total: items.length };
}

// ── Turn queries ──────────────────────────────────────────────────────────────

export function readByAppId(appId: string, req: QueryRequest): QueryResult {
  return paginate(turns.filter((t) => t.appId === appId), req);
}

export function readByOrgId(orgId: string, req: QueryRequest): QueryResult {
  return paginate(turns.filter((t) => t.orgId === orgId), req);
}

export function readByUserId(userId: string, req: QueryRequest): QueryResult {
  return paginate(turns.filter((t) => t.userId === userId), req);
}

export function readById(turnId: string): ConvoTurn | null {
  return turns.find((t) => t.turnId === turnId) ?? null;
}

export function readByEhash(hash: string, req: QueryRequest): QueryResult {
  return paginate(
    turns.filter((t) => t.questionEhash === hash || t.answerEhash === hash),
    req,
  );
}

/** All turns in a convo (all contexts/branches). */
export function readByConvoId(convoId: string, req: QueryRequest): QueryResult {
  return paginate(turns.filter((t) => t.convoId === convoId), req);
}

/** All turns in a specific context branch (exact resource set). */
export function readByContextId(ctxId: string, req: QueryRequest): QueryResult {
  return paginate(turns.filter((t) => t.contextId === ctxId), req);
}

/** All turns that include a specific resourceId in their context window. */
export function readByResourceId(resourceId: string, req: QueryRequest): QueryResult {
  return paginate(
    turns.filter((t) => (t.resourceIds as string[]).includes(resourceId)),
    req,
  );
}

export function getAllTurns(req: QueryRequest): QueryResult {
  return paginate([...turns].reverse(), req);
}

export function getTurnCount(): number {
  return turns.length;
}

// ── Convo queries ──────────────────────────────────────────────────────

export function getAllConvos(req: QueryRequest): ConvoResult {
  return paginateConvos([...convos.values()].reverse(), req);
}

export function getConvosByUser(userId: string, req: QueryRequest): ConvoResult {
  return paginateConvos(
    [...convos.values()].filter((c) => c.userId === userId),
    req,
  );
}

export function getConvosByOrg(orgId: string, req: QueryRequest): ConvoResult {
  return paginateConvos(
    [...convos.values()].filter((c) => c.orgId === orgId),
    req,
  );
}

export function getConvoCount(): number {
  return convos.size;
}
