import { StringCodec } from 'nats';
import {
  getNatsConnection,
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
} from './store.js';
import { QueryRequestSchema } from './types.js';
import { generateAndStoreMemory, getLatestMemory } from './memory-handler.js';
import { assembleContext } from './context.js';

const codec = StringCodec();

function decode(data: Uint8Array): unknown {
  try {
    return JSON.parse(codec.decode(data));
  } catch {
    return {};
  }
}

function respond(msg: any, payload: unknown): void {
  if (msg.reply) {
    msg.respond(codec.encode(JSON.stringify(payload)));
  }
}

/**
 * Start NATS workers:
 *   1. Durable JetStream consumer — reads chatterbox.turns.store, persists each turn
 *   2. Wildcard request/reply handler — all chatterbox.query.* and chatterbox.conversation.*
 */
export async function startWorkers(): Promise<void> {
  const nc = getNatsConnection();
  if (!nc) {
    console.warn('⚠️  [chatterbox] startWorkers called without NATS — skipping');
    return;
  }

  // ── 1. Durable consumer (JetStream) ────────────────────────────────────────
  try {
    const js = nc.jetstream();
    const consumer = await js.consumers.get('CHATTERBOX_STORE', 'chatterbox-store-worker');
    const messages = await consumer.consume();

    console.log('🔄 [chatterbox] Store worker started (durable consumer)');

    (async () => {
      for await (const msg of messages) {
        try {
          const raw = decode(msg.data);
          const turn = await storeTurn(raw);
          console.log(`💾 [chatterbox] Stored turn ${turn.turnId} (convo=${turn.convoId} ctx=${turn.contextId.slice(0, 8)})`);
          msg.ack();
        } catch (err) {
          console.error('❌ [chatterbox] Failed to store turn:', err);
          msg.nak();
        }
      }
    })();
  } catch (err) {
    console.warn('⚠️  [chatterbox] JetStream consumer unavailable, falling back to core NATS:', err);
    const sub = nc.subscribe('chatterbox.convos.store');
    (async () => {
      for await (const msg of sub) {
        try {
          const raw = decode(msg.data);
          const turn = await storeTurn(raw);
          console.log(`💾 [chatterbox] Stored turn ${turn.turnId} via core NATS`);
        } catch (err) {
          console.error('❌ [chatterbox] Failed to store turn (fallback):', err);
        }
      }
    })();
  }

  // ── 2. Convo start handler ──────────────────────────────────────────
  // chatterbox.convo.start  { appId, orgId, userId, resourceIds? }
  const convoStartSub = nc.subscribe('chatterbox.convo.start');
  console.log('💬 [chatterbox] Convo handler started (chatterbox.convo.start)');

  (async () => {
    for await (const msg of convoStartSub) {
      try {
        const body = decode(msg.data) as any;
        const convo = startConvo({
          appId:       body.appId,
          orgId:       body.orgId,
          userId:      body.userId,
          resourceIds: body.resourceIds,
        });
        respond(msg, { success: true, convo });
      } catch (err: any) {
        respond(msg, { success: false, error: err.message });
      }
    }
  })();

  // ── 3. Query handler (wildcard request/reply) ──────────────────────────────
  const defaultOpts = QueryRequestSchema.parse({});
  const querySub    = nc.subscribe('chatterbox.query.>');
  console.log('🔍 [chatterbox] Query handler started (chatterbox.query.>)');

  (async () => {
    for await (const msg of querySub) {
      let opts = defaultOpts;
      try {
        const body = decode(msg.data) as any;
        opts = QueryRequestSchema.parse({ limit: body?.limit, cursor: body?.cursor ?? null });
      } catch { /* use defaults */ }

      const subject = msg.subject;

      try {
        // Turn queries
        if      (subject.startsWith('chatterbox.query.app.'))
          respond(msg, readByAppId(subject.slice('chatterbox.query.app.'.length), opts));

        else if (subject.startsWith('chatterbox.query.org.'))
          respond(msg, readByOrgId(subject.slice('chatterbox.query.org.'.length), opts));

        else if (subject.startsWith('chatterbox.query.user.'))
          respond(msg, readByUserId(subject.slice('chatterbox.query.user.'.length), opts));

        else if (subject.startsWith('chatterbox.query.turn.')) {
          const turn = readById(subject.slice('chatterbox.query.turn.'.length));
          respond(msg, turn
            ? { turns: [turn], nextCursor: null, total: 1 }
            : { turns: [],     nextCursor: null, total: 0 });

        } else if (subject.startsWith('chatterbox.query.ehash.'))
          respond(msg, readByEhash(subject.slice('chatterbox.query.ehash.'.length), opts));

        // Convo / context queries
        else if (subject.startsWith('chatterbox.query.convo.'))
          respond(msg, readByConvoId(subject.slice('chatterbox.query.convo.'.length), opts));

        else if (subject.startsWith('chatterbox.query.context.'))
          respond(msg, readByContextId(subject.slice('chatterbox.query.context.'.length), opts));

        else if (subject.startsWith('chatterbox.query.resource.'))
          respond(msg, readByResourceId(subject.slice('chatterbox.query.resource.'.length), opts));

        // Convo envelope fetch (with turns)
        else if (subject.startsWith('chatterbox.query.conv.')) {
          const convo = getConvo(subject.slice('chatterbox.query.conv.'.length), true);
          respond(msg, convo
            ? { convo }
            : { error: 'Convo not found' });

        } else {
          respond(msg, { error: `Unknown query subject: ${subject}` });
        }

      } catch (err: any) {
        console.error(`❌ [chatterbox] Query error (${subject}):`, err);
        respond(msg, { error: err.message || 'Internal error' });
      }
    }
  })();

  // ── 4. Smart Memory handlers ────────────────────────────────────────────────
  const memorySub = nc.subscribe('chatterbox.memory.create');
  console.log('🧠 [chatterbox] Smart Memory creation handler started (chatterbox.memory.create)');
  
  (async () => {
    for await (const msg of memorySub) {
      try {
        const body = decode(msg.data) as any;
        const memory = await generateAndStoreMemory({
          convoId: body.convoId,
          turns:   body.turns,
          model:   body.model,
        });
        respond(msg, { success: true, memory });
      } catch (err: any) {
        respond(msg, { success: false, error: err.message });
      }
    }
  })();

  const contextSub = nc.subscribe('chatterbox.context.*');
  console.log('🔗 [chatterbox] Context assembly handler started (chatterbox.context.*)');
  
  (async () => {
    for await (const msg of contextSub) {
      try {
        const convoId = msg.subject.slice('chatterbox.context.'.length);
        const ctx = assembleContext(convoId);
        if (ctx) {
          respond(msg, { success: true, context: ctx });
        } else {
          respond(msg, { success: false, error: 'Convo not found' });
        }
      } catch (err: any) {
        respond(msg, { success: false, error: err.message });
      }
    }
  })();

  // Memory latest handler
  const memoryLatestSub = nc.subscribe('chatterbox.memory.latest.*');
  
  (async () => {
    for await (const msg of memoryLatestSub) {
      try {
        const convoId = msg.subject.slice('chatterbox.memory.latest.'.length);
        const mem = getLatestMemory(convoId);
        respond(msg, mem ? { success: true, memory: mem } : { success: false, error: 'No memories found' });
      } catch (err: any) {
        respond(msg, { success: false, error: err.message });
      }
    }
  })();
}
