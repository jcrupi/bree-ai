import {
  connect,
  StringCodec,
  AckPolicy,
  DeliverPolicy,
  RetentionPolicy,
  StorageType,
  DiscardPolicy,
  type NatsConnection,
  type JetStreamManager,
} from 'nats';
import { validateAndIndex, getConvo } from './memory-store.js';
import type { ConvoTurn } from './types.js';

export {
  validateAndIndex,
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
} from './memory-store.js';

const STREAM_NAME   = 'CHATTERBOX_STORE';
const CONSUMER_NAME = 'chatterbox-store-worker';

const RETENTION_DAYS = parseInt(process.env.CHATTERBOX_RETENTION_DAYS || '90', 10);
const MAX_MSGS       = parseInt(process.env.CHATTERBOX_MAX_MSGS       || '100000', 10);

const codec = StringCodec();

// ── NATS connection (optional — memory store works without it) ────────────────

let nc: NatsConnection | null = null;
let jsm: JetStreamManager | null = null;
let streamEnsured  = false;

export async function connectNats(): Promise<NatsConnection> {
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  console.log(`📡 [chatterbox] Connecting to NATS at ${url}...`);

  nc = await connect({
    servers: url,
    user:    process.env.NATS_USER     || undefined,
    pass:    process.env.NATS_PASSWORD || undefined,
    token:   process.env.NATS_TOKEN    || undefined,
    timeout: 3000,            // fail fast if NATS not reachable
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 2000,
  });

  console.log('✅ [chatterbox] Connected to NATS');

  (async () => {
    if (!nc) return;
    for await (const s of nc.status()) {
      console.log(`📡 [chatterbox] NATS: ${s.type}`);
    }
  })();

  return nc;
}

export function getNatsConnection(): NatsConnection | null {
  return nc;
}

// ── JetStream stream ──────────────────────────────────────────────────────────

export async function ensureChatterboxStream(): Promise<void> {
  if (streamEnsured || !nc) return;

  jsm = await nc.jetstreamManager();
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1_000_000_000;

  try {
    await jsm.streams.info(STREAM_NAME);
    console.log(`✅ [chatterbox] Stream '${STREAM_NAME}' exists`);
  } catch {
    await jsm.streams.add({
      name:             STREAM_NAME,
      subjects:         ['chatterbox.convos.store'],
      storage:          StorageType.Memory,   // shared Fly.io NATS — memory only
      retention:        RetentionPolicy.Limits,
      max_age:          maxAge,
      max_msgs:         MAX_MSGS,
      num_replicas:     1,
      discard:          DiscardPolicy.Old,
      duplicate_window: 2 * 60 * 1_000_000_000,
    });
    console.log(`✅ [chatterbox] Stream '${STREAM_NAME}' created`);
  }

  try {
    await jsm!.consumers.info(STREAM_NAME, CONSUMER_NAME);
  } catch {
    await jsm!.consumers.add(STREAM_NAME, {
      durable_name:   CONSUMER_NAME,
      ack_policy:     AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.New,
      max_deliver:    3,
      ack_wait:       30 * 1_000_000_000,
      filter_subject: 'chatterbox.convos.store',
    });
    console.log(`✅ [chatterbox] Consumer '${CONSUMER_NAME}' created`);
  }

  streamEnsured = true;
}

// ── Store (wraps memory-store + optional NATS ack) ────────────────────────────

export async function storeTurn(raw: unknown): Promise<ConvoTurn> {
  const turn = validateAndIndex(raw);
  const convo = getConvo(turn.convoId);

  if (nc) {
    try {
      nc.publish(
        `chatterbox.convos.ack.${turn.turnId}`,
        codec.encode(JSON.stringify({ turnId: turn.turnId, ts: turn.ts })),
      );

      // Trigger Smart Memory if enabled and threshold reached
      if (convo && convo.smartMemoryEnabled && convo.turnsSinceLastMemory >= convo.memoryThreshold) {
        nc.publish(
          `chatterbox.memory.trigger.${turn.convoId}`,
          codec.encode(JSON.stringify({
            convoId:        convo.convoId,
            contextId:      turn.contextId,
            turnCount:      convo.turnsSinceLastMemory,
            latestMemoryId: convo.latestMemoryId,
          }))
        );
      }
    } catch { /* best-effort */ }
  }

  return turn;
}
