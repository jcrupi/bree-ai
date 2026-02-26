/**
 * bree-api-realtime
 * ─────────────────
 * BREE Real-Time Plane — Bun + Elysia + NATS
 *
 * Owns all WebSocket and NATS pub/sub traffic:
 *   /api/agents  — AI agent terminal streaming (WebSocket + NATS logs/lifecycle)
 *   /api/village — Village Vine real-time chat  (WebSocket + NATS messages)
 *
 * Everything else (auth, AI proxies, file persistence, config) stays in bree-api.
 *
 * Env vars (same as bree-api so secrets can be shared):
 *   NATS_URL, NATS_USER, NATS_PASSWORD, NATS_TOKEN
 *   JWT_SECRET
 *   DATABASE_URL  (Postgres) or DB_PATH (SQLite fallback)
 *   TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE_NUMBER
 *   DEMO_MODE=true  (skip auth for all routes)
 *   AUTH_PROVIDER=identity-zero|better-auth
 */

import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import twilio from 'twilio';
import { openAIStreamRoutes, startOpenAIWorker } from './openai-stream';
import { getNatsService, type AgentMessage } from '../../api/src/nats';
import { conversationDb } from '../../api/src/conversation-db';
import { contactDb } from '../../api/src/db';
import { authService, type JWTPayload } from '../../api/src/auth';
import { AUTH_PROVIDER, verifyToken, isBetterAuth } from '../../api/src/auth-provider';
import * as jose from 'jose';
import { sql, decryptKey } from '../../api/src/routes/identity-zero/db';

// ── Auth helpers (mirror of bree-api, token verified identically) ─────

async function identityZeroVerifyToken(token: string): Promise<jose.JWTPayload> {
  const unverifiedPayload = jose.decodeJwt(token);
  const clientId = unverifiedPayload.iss;
  if (!clientId) throw new Error('Invalid token format');
  const clients = await sql`SELECT jwt_secret FROM client WHERE client_id = ${clientId}`;
  const client = clients[0];
  if (!client?.jwt_secret) throw new Error('Client configuration error');
  const decryptedSecret = await decryptKey(client.jwt_secret);
  const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(decryptedSecret));
  return payload;
}

async function requireAuth(
  headers: Record<string, string | undefined>,
  jwtPluginContext: any,
  set: any
): Promise<JWTPayload | null> {
  const authHeader = headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    if (process.env.DEMO_MODE === 'true') {
      return { userId: 0, email: 'guest@bree.ai', name: 'Guest User', roles: [{ role: 'member' }] } as JWTPayload;
    }
    set.status = 401;
    return null;
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, identityZeroVerifyToken);
    if (!payload) return null;
    return payload;
  } catch {
    if (process.env.DEMO_MODE === 'true') {
      return { userId: 0, email: 'guest@bree.ai', name: 'Guest User', roles: [{ role: 'member' }] } as JWTPayload;
    }
    set.status = 401;
    return null;
  }
}

async function getTenantEncryptionKey(
  headers: Record<string, string | undefined>
): Promise<string | undefined> {
  if (isBetterAuth()) return undefined;
  try {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return undefined;
    const token = authHeader.substring(7);
    const unverified = jose.decodeJwt(token);
    if (!unverified.iss) return undefined;
    const clients = await sql`SELECT encryption_key FROM client WHERE client_id = ${unverified.iss}`;
    const client = clients[0];
    if (!client?.encryption_key) return undefined;
    return await decryptKey(client.encryption_key);
  } catch {
    return undefined;
  }
}

// ── WebSocket connection state ─────────────────────────────────────────

const wsConnections = new Map<any, () => void>();

// Village vine state (ephemeral in-process — survives for the lifetime of this machine)
const villageVines = new Map<string, {
  topic: string;
  invited: string[];
  claimed: Set<string>;
}>();

// ── App ───────────────────────────────────────────────────────────────

export const app = new Elysia()
  .use(cors())
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'bree-secret-key' }))
  .use(openAIStreamRoutes)

  // ── Health check ───────────────────────────────────────────────────
  .get('/health', () => ({
    status: 'ok',
    service: 'bree-api-realtime',
    ts: new Date().toISOString(),
  }))

  // ── /api/agents — AI Agent NATS terminal streaming ─────────────────
  .group('/api/agents', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async () => {
        try {
          const nats = await getNatsService();
          const agents = await nats.discoverAgents();
          return { success: true, count: agents.length, agents };
        } catch (error: any) {
          return { success: false, error: error.message || 'Failed to discover agents', agents: [] };
        }
      })
      .get('/:id', async ({ params: { id } }) => {
        try {
          const nats = await getNatsService();
          const status = await nats.getAgentStatus(id);
          if (!status) return { success: false, error: `Agent ${id} not found or not responding` };
          return { success: true, agent: { agentId: id, status } };
        } catch (error: any) {
          return { success: false, error: error.message || `Failed to get agent ${id}` };
        }
      })
      .post('/:id/message', async ({ params: { id }, body, headers }) => {
        try {
          const encryptionKey = await getTenantEncryptionKey(headers);
          const nats = await getNatsService();
          const message: AgentMessage = {
            agentId: id,
            content: body.content,
            timestamp: new Date().toISOString(),
            metadata: body.metadata,
          };
          const customHeaders = encryptionKey ? { 'x-tenant-encryption-key': encryptionKey } : undefined;
          await nats.sendMessageToAgent(id, message, customHeaders);
          return { success: true, message: 'Message sent successfully', sentTo: id };
        } catch (error: any) {
          return { success: false, error: error.message || 'Failed to send message' };
        }
      }, {
        body: t.Object({
          content: t.String(),
          metadata: t.Optional(t.Any()),
        }),
      })

      // Agent terminal WebSocket (1-hour idle timeout for long-running sessions)
      .ws('/:id/ws', {
        idleTimeout: 3600,
        async open(ws) {
          const { id } = ws.data.params;
          console.log(`🔌 Agent WS open: ${id}`);
          try {
            const nats = await getNatsService();
            ws.send({ type: 'connected', agentId: id, message: `Connected to agent ${id} stream` });
            const unsubLogs = await nats.subscribe(`logs.${id}.>`, (message) => {
              ws.send({ type: 'log', ...message });
            });
            const unsubLifecycle = await nats.subscribe(`lifecycle.${id}.>`, (message) => {
              ws.send({ type: 'lifecycle', ...message });
            });
            wsConnections.set(ws, () => { unsubLogs(); unsubLifecycle(); });
          } catch (error) {
            console.error(`❌ WS open error for agent ${id}:`, error);
            ws.send({ type: 'error', message: 'Failed to connect to agent stream on NATS' });
            ws.close();
          }
        },
        async message(ws, message: any) {
          const { id } = ws.data.params;
          if (message?.type === 'ping') {
            ws.send({ type: 'pong', timestamp: new Date().toISOString() });
            return;
          }
          if (message?.type === 'command') {
            try {
              const encryptionKey = await getTenantEncryptionKey(ws.data.headers as any);
              const customHeaders = encryptionKey ? { 'x-tenant-encryption-key': encryptionKey } : undefined;
              const nats = await getNatsService();
              const subject = message.action ? `agent.${id}.${message.action}` : `agents.${id}.messages`;
              await nats.publish(subject, message.payload || message.content, customHeaders);
            } catch (error) {
              console.error(`❌ WS command error for agent ${id}:`, error);
            }
          }
        },
        close(ws) {
          const { id } = ws.data.params;
          console.log(`🔌 Agent WS closed: ${id}`);
          const unsub = wsConnections.get(ws);
          if (unsub) { unsub(); wsConnections.delete(ws); }
        },
      })
  )

  // ── /api/village — Village Vine NATS real-time chat ─────────────────
  .group('/api/village', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set, request }) => {
        // WebSocket upgrades bypass auth — the WS open handler manages access
        if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') return;
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })

      // Start a new village vine (creates ephemeral in-process state + NATS notification)
      .post('/start', async ({ body }) => {
        const vineId = `village-${crypto.randomUUID()}`;
        const nats = await getNatsService();
        villageVines.set(vineId, {
          topic: body.topic,
          invited: body.invited,
          claimed: new Set<string>(),
        });
        await nats.publish('village.vines.created', {
          vineId,
          topic: body.topic,
          invited: body.invited,
          createdAt: new Date().toISOString(),
        });
        return { success: true, vineId, topic: body.topic };
      }, {
        body: t.Object({
          topic: t.String(),
          invited: t.Array(t.String()),
        }),
      })

      // HTTP message send (fire-and-forget REST alternative to WS)
      .post('/:id/message', async ({ params: { id }, body }) => {
        try {
          const nats = await getNatsService();
          const timestamp = new Date().toISOString();
          const message = { vineId: id, sender: body.sender, content: body.content, timestamp };
          await nats.publish(`village.vine.${id}.messages`, message);
          await conversationDb.insert({
            id: `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            vineId: id,
            sender: body.sender,
            content: body.content,
            timestamp,
          });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }, {
        body: t.Object({ sender: t.String(), content: t.String() }),
      })

      // SMS invite via Twilio
      .post('/send-invite-sms', async ({ body, set }) => {
        const twilioSid = process.env.TWILIO_SID;
        const twilioToken = process.env.TWILIO_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        if (!twilioSid || !twilioToken || !twilioPhone) {
          set.status = 500;
          return { success: false, error: 'SMS service not configured' };
        }
        try {
          const client = twilio(twilioSid, twilioToken);
          await client.messages.create({
            body: `🌿 Village Vine Invite: You've been invited by ${body.name} to join "${body.topic}". Join here: ${body.link}`,
            from: twilioPhone,
            to: body.phoneNumber,
          });
          contactDb.upsert(body.phoneNumber, body.name);
          console.log(`📱 SMS sent to ${body.phoneNumber} (${body.name})`);
          return { success: true };
        } catch (error: any) {
          set.status = 500;
          return { success: false, error: error.message };
        }
      }, {
        body: t.Object({
          phoneNumber: t.String(),
          link: t.String(),
          topic: t.String(),
          name: t.String(),
        }),
      })

      // Contacts
      .get('/contacts', async () => {
        try {
          return { success: true, contacts: contactDb.findAll() };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })
      .get('/contacts/lookup', async ({ query }) => {
        const phone = query.phone as string;
        if (!phone) return { success: false, error: 'Phone number required' };
        try {
          return { success: true, contact: contactDb.findByPhone(phone) };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })

      // Message history (REST polling fallback)
      .get('/:id/messages', async ({ params: { id }, query }) => {
        try {
          const since = query.since as string | undefined;
          const limit = query.limit ? parseInt(query.limit as string, 10) : 500;
          const messages = await conversationDb.findByVineId(id, { since, limit });
          return { success: true, messages, vineId: id };
        } catch (error: any) {
          return { success: false, error: error.message, messages: [] };
        }
      })

      // Village Vine WebSocket (4-minute idle timeout — keepalive pings reset it)
      .ws('/:id/ws', {
        idleTimeout: 240,
        async open(ws) {
          const { id } = ws.data.params;
          const { name } = ws.data.query as any;
          console.log(`🔌 Village WS open: ${id} as ${name}`);
          try {
            const vine = villageVines.get(id);
            if (vine) {
              if (!vine.invited.includes(name)) {
                ws.send({ type: 'error', message: 'You are not invited to this village vine.' });
                ws.close();
                return;
              }
              if (vine.claimed.has(name)) {
                ws.send({ type: 'error', message: 'This name is already active in the vine.' });
                ws.close();
                return;
              }
              vine.claimed.add(name);
            }
            const nats = await getNatsService();
            ws.send({ type: 'connected', vineId: id, name });
            const unsub = await nats.subscribe(`village.vine.${id}.messages`, (message) => {
              ws.send({ type: 'message', ...message });
            });
            wsConnections.set(ws, unsub);
          } catch (error) {
            console.error(`❌ Village WS open error ${id}:`, error);
            ws.close();
          }
        },
        async message(ws, message: any) {
          const { id } = ws.data.params;
          if (message?.type === 'ping') {
            ws.send({ type: 'pong', timestamp: new Date().toISOString() });
            return;
          }
          if (message?.type === 'message') {
            try {
              const nats = await getNatsService();
              const timestamp = new Date().toISOString();
              const msg = { vineId: id, sender: message.sender, content: message.content, timestamp };
              await nats.publish(`village.vine.${id}.messages`, msg);
              await conversationDb.insert({
                id: `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                vineId: id,
                sender: message.sender,
                content: message.content,
                timestamp,
              });
            } catch (error) {
              console.error(`❌ Village WS message error ${id}:`, error);
            }
          }
        },
        close(ws) {
          const { id } = ws.data.params;
          const { name } = ws.data.query as any;
          console.log(`🔌 Village WS closed: ${id} (${name})`);
          const vine = villageVines.get(id);
          if (vine && name) vine.claimed.delete(name);
          const unsub = wsConnections.get(ws);
          if (unsub) { unsub(); wsConnections.delete(ws); }
        },
      })
  );

// ── Boot ──────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001;

// Pre-warm NATS connection then start the OpenAI worker
try {
  await getNatsService();
  // Start the NATS OpenAI streaming worker (runs indefinitely)
  await startOpenAIWorker();
} catch (err) {
  console.warn('⚠️  NATS not available at startup — will retry on first request:', err);
}

app.listen({ port: PORT, hostname: '0.0.0.0' });
console.log(`⚡ bree-api-realtime running on 0.0.0.0:${PORT}`);
console.log(`🔐 Auth provider: ${AUTH_PROVIDER}`);
