import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import {
  storeTurn,
  startConvo,
  getConvo,
  readByAppId,
  readByOrgId,
  readByUserId,
  readById,
  readByEhash,
  readByConvoId,
  readByContextId,
  readByResourceId,
  getAllTurns,
  getTurnCount,
  getAllConvos,
  getConvosByUser,
  getConvosByOrg,
  getConvoCount,
} from './store.js';
import { QueryRequestSchema } from './types.js';
import { contextId as computeContextId } from './hash.js';
import { assembleContext } from './context.js';
import { generateAndStoreMemory, getMemories, getMemory, getLatestMemory } from './memory-handler.js';

const parseOpts = (query: Record<string, string | undefined>) =>
  QueryRequestSchema.parse({
    limit:  query.limit ? parseInt(query.limit, 10) : undefined,
    cursor: query.cursor ?? null,
  });

export const routes = new Elysia()
  .use(cors())

  // ── Health ────────────────────────────────────────────────────────────────
  .get('/health', () => ({
    status:        'healthy',
    service:       'chatterbox',
    turns:         getTurnCount(),
    convos:        getConvoCount(),
    timestamp:     new Date().toISOString(),
  }))

  // ── Convo: start ───────────────────────────────────────────────────
  // POST /api/convos
  // Returns a new convoId + initial contextId
  .post('/api/convos', ({ body, set }) => {
    try {
      const { appId, orgId, userId, resourceIds } = body as any;
      const convo = startConvo({ appId, orgId, userId, resourceIds });
      set.status = 201;
      return { success: true, convo };
    } catch (err: any) {
      set.status = 400;
      return { success: false, error: err.message };
    }
  }, {
    body: t.Object({
      appId:       t.String(),
      orgId:       t.String(),
      userId:      t.String(),
      resourceIds: t.Optional(t.Array(t.String())),
    })
  })

  // ── Convo: get by ID ───────────────────────────────────────────────
  .get('/api/convos/:convoId', ({ params: { convoId }, query, set }) => {
    const includeTurns = query.includeTurns === 'true';
    const convo = getConvo(convoId, includeTurns);
    if (!convo) { set.status = 404; return { error: 'Convo not found' }; }
    return convo;
  }, {
    query: t.Object({
      includeTurns: t.Optional(t.String()),
    })
  })

  // ── Convo: list all turns in a convo (all branches) ─────────
  .get('/api/convos/:convoId/turns', ({ params: { convoId }, query }) => {
    return readByConvoId(convoId, parseOpts(query as any));
  }, {
    query: t.Object({
      limit:  t.Optional(t.String()),
      cursor: t.Optional(t.String()),
    })
  })

  // ── Convo: list turns for a specific context branch ────────────────
  .get('/api/convos/:convoId/contexts/:contextId/turns', ({ params, query }) => {
    return readByContextId(params.contextId, parseOpts(query as any));
  }, {
    query: t.Object({
      limit:  t.Optional(t.String()),
      cursor: t.Optional(t.String()),
    })
  })

  // ── Convos: list ───────────────────────────────────────────────────
  .get('/api/convos', ({ query }) => {
    const opts = parseOpts(query as any);
    const { userId, orgId } = query as any;
    if (userId) return getConvosByUser(userId, opts);
    if (orgId)  return getConvosByOrg(orgId, opts);
    return getAllConvos(opts);
  }, {
    query: t.Object({
      userId: t.Optional(t.String()),
      orgId:  t.Optional(t.String()),
      limit:  t.Optional(t.String()),
      cursor: t.Optional(t.String()),
    })
  })

  // ── Context: generate context for next AI turn ────────────────────────────
  .get('/api/convos/:convoId/context', ({ params: { convoId }, set }) => {
    const ctx = assembleContext(convoId);
    if (!ctx) { set.status = 404; return { error: 'Convo not found' }; }
    return ctx;
  })

  // ── Smart Memory: list memories for a convo ────────────────────────
  .get('/api/convos/:convoId/memory', ({ params: { convoId } }) => {
    return { memories: getMemories(convoId) };
  })

  // ── Smart Memory: get latest memory for a convo ────────────────────
  .get('/api/convos/:convoId/memory/latest', ({ params: { convoId }, set }) => {
    const mem = getLatestMemory(convoId);
    if (!mem) { set.status = 404; return { error: 'No memories found for this convo' }; }
    return mem;
  })

  // ── Smart Memory: fetch specific memory by ID ─────────────────────────────
  .get('/api/memory/:memoryId', ({ params: { memoryId }, set }) => {
    const mem = getMemory(memoryId);
    if (!mem) { set.status = 404; return { error: 'Memory not found' }; }
    return mem;
  })

  // ── Smart Memory: trigger generation manually (REST) ──────────────────────
  .post('/api/convos/:convoId/memory', async ({ params: { convoId }, body, set }) => {
    try {
      const { turns, model } = body as any;
      const mem = await generateAndStoreMemory({ convoId, turns, model });
      set.status = 201;
      return { success: true, memory: mem };
    } catch (err: any) {
      set.status = 400;
      return { success: false, error: err.message };
    }
  }, {
    body: t.Object({
      turns: t.Array(t.Object({
        q: t.String(),
        a: t.String(),
      })),
      model: t.Optional(t.String()),
    })
  })

  // ── Utility: compute a contextId from resource IDs ────────────────────────
  // POST /api/context-id  { resourceIds: string[] }
  .post('/api/context-id', ({ body }) => {
    const { resourceIds } = body as any;
    return { contextId: computeContextId(resourceIds ?? []) };
  }, {
    body: t.Object({
      resourceIds: t.Optional(t.Array(t.String())),
    })
  })

  // ── Turns: query ──────────────────────────────────────────────────────────
  .get('/api/turns', ({ query }) => {
    const opts = parseOpts(query as any);
    const { appId, orgId, userId, ehash, convoId, contextId, resourceId } = query as any;

    if (convoId)    return readByConvoId(convoId, opts);
    if (contextId)  return readByContextId(contextId, opts);
    if (resourceId) return readByResourceId(resourceId, opts);
    if (ehash)      return readByEhash(ehash, opts);
    if (userId)     return readByUserId(userId, opts);
    if (orgId)      return readByOrgId(orgId, opts);
    if (appId)      return readByAppId(appId, opts);
    return getAllTurns(opts);
  }, {
    query: t.Object({
      appId:          t.Optional(t.String()),
      orgId:          t.Optional(t.String()),
      userId:         t.Optional(t.String()),
      ehash:          t.Optional(t.String()),
      convoId:        t.Optional(t.String()),
      contextId:      t.Optional(t.String()),
      resourceId:     t.Optional(t.String()),
      limit:          t.Optional(t.String()),
      cursor:         t.Optional(t.String()),
    })
  })

  // ── Turns: single ─────────────────────────────────────────────────────────
  .get('/api/turns/:turnId', ({ params: { turnId }, set }) => {
    const turn = readById(turnId);
    if (!turn) { set.status = 404; return { error: 'Turn not found' }; }
    return turn;
  })

  // ── Turns: store directly ─────────────────────────────────────────────────
  .post('/api/turns', async ({ body, set }) => {
    try {
      const turn = await storeTurn(body);
      set.status = 201;
      return { success: true, turn };
    } catch (err: any) {
      set.status = 400;
      return { success: false, error: err.message };
    }
  }, {
    body: t.Object({
      turnId:          t.Optional(t.String()),
      convoId:         t.String(),
      contextId:       t.Optional(t.String()),   // derived from resourceIds if omitted
      parentContextId: t.Optional(t.String()),
      appId:           t.String(),
      orgId:           t.String(),
      userId:          t.String(),
      claims:          t.Optional(t.Record(t.String(), t.Any())),
      questionEhash:   t.String(),
      answerEhash:     t.String(),
      resourceIds:     t.Optional(t.Array(t.String())),
      metadata:        t.Optional(t.Record(t.String(), t.Any())),
      ts:              t.Optional(t.String()),
    })
  });
