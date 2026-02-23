import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import twilio from 'twilio';

import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { getNatsService, type AgentMessage } from './nats';
import { authService, seedDatabase, type JWTPayload } from './auth';
import { contactDb, bubbleDb } from './db';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { mightyRoutes as habitawareMighty } from './routes/habitaware/mighty';
import { chatRoutes as habitawareChat } from './routes/habitaware/chat';
import { agentxRoutes as habitawareAgentx } from './routes/habitaware/agentx';
import { identityZeroRoutes } from './routes/identity-zero';
import { assessmentQuestionsRoutes } from './routes/assessment-questions';
import * as jose from 'jose';
import { sql, decryptKey } from './routes/identity-zero/db';

// For WebSocket connection state (NATS subscriptions)
const wsConnections = new Map<any, () => void>();

// For Village Vine state tracking (ephemeral)
const villageVines = new Map<string, { 
  topic: string, 
  invited: string[], 
  claimed: Set<string> 
}>();

export async function requireAuth(headers: Record<string, string | undefined>, jwtPluginContext: any, set: any): Promise<JWTPayload | null> {
  const authHeader = headers['authorization'];
  
  // Allow guest access if no auth header is provided and we are in demo mode
  if (!authHeader?.startsWith('Bearer ')) {
    if (process.env.DEMO_MODE === 'true') {
      return {
        userId: 0,
        email: 'guest@bree.ai',
        name: 'Guest User',
        roles: [{ role: 'member' }]
      } as JWTPayload;
    }
    set.status = 401;
    return null;
  }

  const token = authHeader.slice(7);

  try {
    // 1. Decode token to find the Issuer (Client ID)
    const unverifiedPayload = jose.decodeJwt(token);
    const clientId = unverifiedPayload.iss;

    if (!clientId) {
       console.error("JWT is missing issuer (client_id)");
       throw new Error("Invalid token format");
    }

    // 2. Lookup the dynamic Client Secret from Identity Zero
    const clients = await sql`
      SELECT jwt_secret FROM client WHERE client_id = ${clientId}
    `;
    const client = clients[0];

    if (!client || !client.jwt_secret) {
        console.error(`Missing encryption key configuration for client: ${clientId}`);
        throw new Error("Client configuration error");
    }

    // 3. Decrypt the envelope-encrypted secret from DB
    const decryptedSecret = await decryptKey(client.jwt_secret);

    // 4. Verify the token cryptographically using the specific client plaintext secret
    const secretKey = new TextEncoder().encode(decryptedSecret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    return payload as unknown as JWTPayload;
  } catch (err) {
    if (process.env.DEMO_MODE === 'true') {
      return {
        userId: 0,
        email: 'guest@bree.ai',
        name: 'Guest User',
        roles: [{ role: 'member' }]
      } as JWTPayload;
    }
    set.status = 401;
    return null;
  }
}

/**
 * Helper to dynamically extract and decrypt the tenant's exact Envelope Encryption key
 * without running the full signature verification (which requireAuth handles globally).
 * This is used to pass the key downstream over NATS to isolated AgentX instances.
 */
export async function getTenantEncryptionKey(headers: Record<string, string | undefined>): Promise<string | undefined> {
  try {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return undefined;
    
    const token = authHeader.substring(7);
    const unverified = jose.decodeJwt(token);
    
    if (!unverified.iss) return undefined;
    
    const clients = await sql`SELECT encryption_key FROM client WHERE client_id = ${unverified.iss}`;
    const client = clients[0];
    if (!client || !client.encryption_key) return undefined;
    
    return await decryptKey(client.encryption_key);
  } catch (error) {
    return undefined;
  }
}

// Configuration (use environment variables or defaults)
const RAGSTER_API_URL = process.env.RAGSTER_API_URL || 'https://agent-collective-ragster.fly.dev/api';
const AGENTX_URL = process.env.AGENTX_URL || 'https://agent-collective-agentx.fly.dev';
const ANTIMATTER_URL = process.env.ANTIMATTER_URL || 'https://agent-collective-antimatter.fly.dev';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FEEDBACK_DIR = process.env.FEEDBACK_DIR || 'data/feedback';

async function ensureFeedbackDir() {
  try {
    await mkdir(FEEDBACK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create feedback directory:', err);
  }
}

export const app = new Elysia()
  .use(cors())
  
  .use(swagger({
    documentation: {
      info: {
        title: 'BREE AI Gateway API',
        version: '1.0.0',
        description: 'BREE Gateway for BREE AI services'
      }
    }
  }))
  // Base endpoints
  .get('/', () => ({
    message: 'Welcome to BREE AI Gateway',
    version: '1.0.0',
    status: 'running'
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))

  // Habitaware Routes
  .use(habitawareMighty)
  .use(habitawareChat)
  .use(habitawareAgentx)
  .use(identityZeroRoutes)
  .use(assessmentQuestionsRoutes)

  // Knowledge (Ragster) Proxy Group
  .group('/api/knowledge', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/collections', async ({ query: { org_id } }) => {
        const url = `${RAGSTER_API_URL}/collections?org_id=${org_id || 'default-org'}`;
        const res = await fetch(url, {
          headers: { 'x-org-id': (org_id as string) || 'default-org' }
        });
        return res.json();
      }, {
        query: t.Object({
          org_id: t.Optional(t.String())
        })
      })
      .get('/collections/:id', async ({ params: { id } }) => {
        const res = await fetch(`${RAGSTER_API_URL}/collections/${id}`);
        return res.json();
      })

      .get('/resources', async ({ query: { org_id, user_id, collection_id } }) => {
        const params = new URLSearchParams({
          org_id: (org_id as string) || 'default-org',
          user_id: (user_id as string) || 'default-user',
        });
        const res = await fetch(`${RAGSTER_API_URL}/resources?${params}`);
        const data = await res.json();
        
        // Filter by collection_id if provided (Ragster returns all resources for org/user)
        if (collection_id && data.resources) {
          data.resources = data.resources.filter((r: any) => 
            r.metadata?.collection_id === collection_id || 
            r.collection_id === collection_id ||
            r.metadata?.collection === collection_id
          );
        }
        return data;
      }, {
        query: t.Object({
          org_id: t.Optional(t.String()),
          user_id: t.Optional(t.String()),
          collection_id: t.Optional(t.String())
        })
      })
      .post('/search', async ({ body }) => {

        const res = await fetch(`${RAGSTER_API_URL}/search`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-org-id': body.org_id || 'default-org'
          },
          body: JSON.stringify(body)
        });
        return res.json();
      }, {
        body: t.Object({
          query: t.String(),
          collection: t.String(),
          topK: t.Optional(t.Number()),
          min_score: t.Optional(t.Number()),
          org_id: t.Optional(t.String()),
          filter: t.Optional(t.Any())
        })
      })
      .post('/chat', async ({ body }) => {
        const res = await fetch(`${RAGSTER_API_URL}/chat`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-org-id': body.org_id || 'default-org'
          },
          body: JSON.stringify(body)
        });

        if (body.options?.stream) {
          return res;
        }

        return res.json();
      }, {
        body: t.Object({
          messages: t.Array(t.Object({
            role: t.String(),
            content: t.String()
          })),
          org_id: t.Optional(t.String()),
          options: t.Optional(t.Any())
        })
      })
  )

  // Collective Proxy Group
  .group('/api/collective', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .post('/chat', async ({ body }) => {
        const res = await fetch(`${AGENTX_URL}/api/collective/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (body.options?.stream) {
          return res;
        }

        return res.json();
      }, {
        body: t.Object({
          messages: t.Array(t.Any()),
          userEmail: t.String(),
          orgSlug: t.String(),
          options: t.Optional(t.Any())
        })
      })
  )

  // Identity Proxy Group
  .group('/api/identity', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/instructions', async () => {
        const res = await fetch(`${AGENTX_URL}/api/identity/entries?path=config/instructions.md`);
        const data = await res.json();
        return data.success ? data.data.content : null;
      })
      .post('/instructions', async ({ body }) => {
        const res = await fetch(`${AGENTX_URL}/api/identity/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'config/instructions.md',
            content: body.content,
            frontMatter: {
              type: 'config',
              updatedAt: new Date().toISOString()
            }
          })
        });
        return res.json();
      }, {
        body: t.Object({
          content: t.String()
        })
      })
  )

  // Configuration Group (Database Level Persistence)
  .group('/api/config', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/:brandId', async ({ params: { brandId } }) => {
        const url = `${AGENTX_URL}/api/identity/entries?path=config/${brandId}.json`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data && data.data.content) {
          try {
            return JSON.parse(data.data.content);
          } catch (e) {
            return { error: 'Invalid config format' };
          }
        }
        return { success: false, message: 'Config not found' };
      })
      .post('/:brandId', async ({ params: { brandId }, body }) => {
        const res = await fetch(`${AGENTX_URL}/api/identity/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `config/${brandId}.json`,
            content: JSON.stringify(body),
            frontMatter: {
              type: 'config',
              brandId: brandId,
              updatedAt: new Date().toISOString()
            }
          })
        });
        return res.json();
      }, {
        body: t.Any()
      })
  )

  // Authentication Group
  .group('/api/auth', (app) =>
    app
      .post('/register', async ({ body, jwt }) => {
        try {
          const user = await authService.register(
            body.email,
            body.password,
            body.name,
            body.role,
            body.organizationSlug
          );
          
          const payload = authService.createJWTPayload(user);
          const accessToken = await jwt.sign(payload);
          
          return {
            success: true,
            accessToken,
            user
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Registration failed'
          };
        }
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          name: t.String(),
          role: t.Optional(t.String()),
          organizationSlug: t.Optional(t.String())
        })
      })
      .post('/login', async ({ body, jwt }) => {
        try {
          const user = await authService.login(body.email, body.password);
          const payload = authService.createJWTPayload(user);
          const accessToken = await jwt.sign(payload);
          
          return {
            success: true,
            accessToken,
            user
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Login failed'
          };
        }
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String()
        })
      })
      .post('/refresh', async ({ jwt, headers }) => {
        // In a real app, you'd verify a refresh token
        // For simplicity, we'll just check if the current token is valid and issue a new one
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          return { success: false, error: 'No token provided' };
        }
        
        const token = authHeader.slice(7);
        const payload = await jwt.verify(token);
        
        if (!payload) {
          return { success: false, error: 'Invalid token' };
        }
        
        // Refresh token logic would go here
        // For now, just return success
        return { success: true, message: 'Token valid' };
      }, {
        headers: t.Object({
          authorization: t.String()
        })
      })
      .get('/me', async ({ jwt, headers }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          return { success: false, error: 'Unauthorized' };
        }
        
        const token = authHeader.slice(7);
        const payload = await jwt.verify(token);
        
        if (!payload) {
          return { success: false, error: 'Invalid token' };
        }

        // Return user info from token (stateless)
        // Or fetch fresh from DB
        try {
          const user = authService.getUserWithRoles((payload as any).userId);
          return { success: true, user };
        } catch (e) {
          return { success: false, error: 'User not found' };
        }
      }, {
        headers: t.Object({
          authorization: t.String()
        })
      })
  )

  // HabitAware Group
  .group('/api/habitaware', (app) =>
    app
      .use(habitawareMighty) // mighty.ts still has internal prefix: "/mighty"
      .group('/chat', (app) => app.use(habitawareChat))
      .group('/agentx', (app) => app.use(habitawareAgentx))
  )

  // OpenAI Proxy Group
  .group('/api/openai', (app) =>
    app
      .post('/chat', async ({ body, headers, jwt, set }) => {
        if (!OPENAI_API_KEY) {
          set.status = 500;
          return { error: 'OPENAI_API_KEY not configured on server' };
        }
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };

        const {
          query,
          context,
          options = {},
        } = body as {
          query: string;
          context: string;
          options?: {
            model?: string;
            temperature?: number;
            max_tokens?: number;
            systemPrompt?: string;
          };
        };

        const {
          model = 'gpt-4o',
          temperature = 0.7,
          max_tokens = 2000,
          systemPrompt = 'You are KAT.ai, a helpful document assistant.'
        } = options;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Context information from documents:\n\n${context}\n\nQuestion: ${query}\n\nPlease answer the question based on the provided context and follow your system instructions.`
              }
            ],
            temperature,
            max_tokens
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          set.status = response.status;
          return { error: error.error?.message || response.statusText };
        }

        const result = await response.json();
        return { response: result.choices?.[0]?.message?.content || '' };
      }, {
        headers: t.Object({
          authorization: t.String()
        }),
        body: t.Object({
          query: t.String(),
          context: t.String(),
          options: t.Optional(t.Object({
            model: t.Optional(t.String()),
            temperature: t.Optional(t.Number()),
            max_tokens: t.Optional(t.Number()),
            systemPrompt: t.Optional(t.String())
          }))
        })
      })
      .post('/tts', async ({ body, headers, jwt, set }) => {
        if (!OPENAI_API_KEY) {
          set.status = 500;
          return { error: 'OPENAI_API_KEY not configured on server' };
        }
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };

        const { text, voice = 'alloy', speed = 1.0 } = body as {
          text: string;
          voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
          speed?: number;
        };

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice,
            speed
          })
        });

        if (!response.ok) {
          set.status = response.status;
          return { error: response.statusText };
        }

        const audioBuffer = await response.arrayBuffer();
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg'
          }
        });
      }, {
        headers: t.Object({
          authorization: t.String()
        }),
        body: t.Object({
          text: t.String(),
          voice: t.Optional(t.String()),
          speed: t.Optional(t.Number())
        })
      })
      .post('/stt', async ({ request, headers, jwt, set }) => {
        if (!OPENAI_API_KEY) {
          set.status = 500;
          return { error: 'OPENAI_API_KEY not configured on server' };
        }
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };

        const form = await request.formData();
        const file = form.get('file') as File | null;
        if (!file) {
          set.status = 400;
          return { error: 'No audio file provided' };
        }

        const formData = new FormData();
        formData.append('file', file, file.name || 'audio.webm');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: formData
        });

        if (!response.ok) {
          set.status = response.status;
          return { error: response.statusText };
        }

        const result = await response.json();
        return { text: result.text || '' };
      }, {
        headers: t.Object({
          authorization: t.String()
        })
      })
  )

  // Agents (NATS) Group - AI Agent Communication
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
          return {
            success: true,
            count: agents.length,
            agents
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Failed to discover agents',
            agents: []
          };
        }
      })
      .get('/:id', async ({ params: { id } }) => {
        try {
          const nats = await getNatsService();
          const status = await nats.getAgentStatus(id);
          
          if (!status) {
            return {
              success: false,
              error: `Agent ${id} not found or not responding`
            };
          }

          return {
            success: true,
            agent: {
              agentId: id,
              status
            }
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || `Failed to get agent ${id}`
          };
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
            metadata: body.metadata
          };

          const customHeaders = encryptionKey ? { 'x-tenant-encryption-key': encryptionKey } : undefined;
          await nats.sendMessageToAgent(id, message, customHeaders);

          return {
            success: true,
            message: 'Message sent successfully',
            sentTo: id
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Failed to send message'
          };
        }
      }, {
        body: t.Object({
          content: t.String(),
          metadata: t.Optional(t.Any())
        })
      })
      
      // Real-time terminal/log connection via WebSocket
      .ws('/:id/ws', {
        idleTimeout: 3600, // 1 hour
        async open(ws) {
          const { id } = ws.data.params;
          console.log(`🔌 Agent WebSocket connection attempt for agent: ${id}`);
          
          try {
            const nats = await getNatsService();
            
            ws.send({ type: 'connected', agentId: id, message: `Connected to grape/agent ${id} stream` });
            
            // Subscribe to both logs and lifecycle events
            const unsubLogs = await nats.subscribe(`logs.${id}.>`, (message) => {
              ws.send({ type: 'log', ...message });
            });
            const unsubLifecycle = await nats.subscribe(`lifecycle.${id}.>`, (message) => {
              ws.send({ type: 'lifecycle', ...message });
            });
            
            // Store metadata in a map to clean up on close
            wsConnections.set(ws, () => {
              unsubLogs();
              unsubLifecycle();
            });
          } catch (error) {
            console.error(`❌ Error opening WS for agent ${id}:`, error);
            ws.send({ type: 'error', message: 'Failed to connect to agent stream on NATS' });
            ws.close();
          }
        },
        async message(ws, message: any) {
          const { id } = ws.data.params;
          
          if (message && message.type === 'ping') {
            ws.send({ type: 'pong', timestamp: new Date().toISOString() });
            return;
          }

          if (message && message.type === 'command') {
            try {
              const encryptionKey = await getTenantEncryptionKey(ws.data.headers as any);
              const customHeaders = encryptionKey ? { 'x-tenant-encryption-key': encryptionKey } : undefined;
              
              const nats = await getNatsService();
              // Publish the command to the agent's action subject if specified, else generic messages
              const subject = message.action ? `agent.${id}.${message.action}` : `agents.${id}.messages`;
              await nats.publish(subject, message.payload || message.content, customHeaders);
            } catch (error) {
              console.error(`❌ Error publishing command to agent ${id}:`, error);
            }
          }
        },
        close(ws) {
          const { id } = ws.data.params;
          console.log(`🔌 Agent WebSocket disconnected from agent: ${id}`);
          
          const unsubscribe = wsConnections.get(ws);
          if (unsubscribe) {
            unsubscribe();
            wsConnections.delete(ws);
          }
        }
      })
  )
  
  // Village (Human-Agent NATS) Group
  .group('/api/village', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set, request }) => {
        // Exempt WebSocket upgrade requests from this check
        if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') return;
        
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      // Start a village vine
      .post('/start', async ({ body }) => {
        const vineId = `village-${crypto.randomUUID()}`;
        const nats = await getNatsService();

        // Store vine metadata for participant tracking
        villageVines.set(vineId, {
          topic: body.topic,
          invited: body.invited,
          claimed: new Set<string>()
        });

        // Notify the collective about a new village vine
        await nats.publish('village.vines.created', {
          vineId,
          topic: body.topic,
          invited: body.invited,
          createdAt: new Date().toISOString()
        });
        
        return {
          success: true,
          vineId,
          topic: body.topic
        };
      }, {
        body: t.Object({
          topic: t.String(),
          invited: t.Array(t.String())
        })
      })
      // Send message to village vine
      .post('/:id/message', async ({ params: { id }, body }) => {
        try {
          const nats = await getNatsService();
          const message = {
            vineId: id,
            sender: body.sender,
            content: body.content,
            timestamp: new Date().toISOString()
          };
          
          await nats.publish(`village.vine.${id}.messages`, message);
          
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }, {
        body: t.Object({
          sender: t.String(),
          content: t.String()
        })
      })
      // Send SMS invitation via Twilio
      .post('/send-invite-sms', async ({ body, set }) => {
        const twilioSid = process.env.TWILIO_SID;
        const twilioToken = process.env.TWILIO_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        if (!twilioSid || !twilioToken || !twilioPhone) {
          console.error('❌ Twilio credentials missing');
          set.status = 500;
          return { success: false, error: 'SMS service not configured' };
        }

        try {
          const client = twilio(twilioSid, twilioToken);
          await client.messages.create({
            body: `🌿 Village Vine Invite: You've been invited by ${body.name} to join "${body.topic}". Join here: ${body.link}`,
            from: twilioPhone,
            to: body.phoneNumber
          });
          
          // Save or update contact
          contactDb.upsert(body.phoneNumber, body.name);
          
          console.log(`📱 SMS invite sent to ${body.phoneNumber} (${body.name})`);
          return { success: true };
        } catch (error: any) {
          console.error('❌ Failed to send SMS:', error);
          set.status = 500;
          return { success: false, error: error.message };
        }
      }, {
        body: t.Object({
          phoneNumber: t.String(),
          link: t.String(),
          topic: t.String(),
          name: t.String()
        })
      })
      // List all saved contacts
      .get('/contacts', async () => {
        try {
          const contacts = contactDb.findAll();
          return { success: true, contacts };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })
      // Search contact by phone
      .get('/contacts/lookup', async ({ query }) => {
        const phone = query.phone as string;
        if (!phone) return { success: false, error: 'Phone number required' };
        
        try {
          const contact = contactDb.findByPhone(phone);
          return { success: true, contact };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })
      // Get messages for a vine (polling alternative to SSE)
      .get('/:id/messages', async ({ params: { id }, query }) => {
        try {
          const nats = await getNatsService();
          const since = query.since ? new Date(query.since as string) : new Date(Date.now() - 3600000);
          
          // In a real implementation, you'd store messages in a database or JetStream
          // For now, we'll return an empty array and rely on real-time NATS pub/sub
          return {
            success: true,
            messages: [],
            vineId: id
          };
        } catch (error: any) {
          return { success: false, error: error.message, messages: [] };
        }
      })
      
      // Real-time messaging via WebSocket
      .ws('/:id/ws', {
        idleTimeout: 240, // 4 minutes
        async open(ws) {
          const { id } = ws.data.params;
          const { name } = ws.data.query as any;
          console.log(`🔌 WebSocket connection attempt for vine: ${id} as ${name}`);
          
          try {
            const vine = villageVines.get(id);
            
            // Enrollment/Claim check
            if (vine) {
              const isInvited = vine.invited.includes(name);
              const alreadyClaimed = vine.claimed.has(name);
              
              if (!isInvited) {
                console.log(`🚫 Name ${name} not invited to vine ${id}`);
                ws.send({ type: 'error', message: 'You are not invited to this village vine.' });
                ws.close();
                return;
              }

              if (alreadyClaimed) {
                console.log(`🚫 Name ${name} already active in vine ${id}`);
                ws.send({ type: 'error', message: 'This name is already active in the vine. Please use a different name or close other sessions.' });
                ws.close();
                return;
              }

              // Mark as active
              vine.claimed.add(name);
              console.log(`✅ Name ${name} joined vine ${id}`);
            }

            const nats = await getNatsService();
            
            ws.send({ type: 'connected', vineId: id, name });
            
            const unsubscribe = await nats.subscribe(
              `village.vine.${id}.messages`,
              (message) => {
                ws.send({
                  type: 'message',
                  ...message
                });
              }
            );
            
            // Store metadata in a map to clean up on close
            wsConnections.set(ws, unsubscribe);
          } catch (error) {
            console.error(`❌ Error opening WS for vine ${id}:`, error);
            ws.close();
          }
        },
        async message(ws, message: any) {
          const { id } = ws.data.params;
          
          if (message && message.type === 'ping') {
            ws.send({ type: 'pong', timestamp: new Date().toISOString() });
            return;
          }

          if (message && message.type === 'message') {
            try {
              const nats = await getNatsService();
              const msg = {
                vineId: id,
                sender: message.sender,
                content: message.content,
                timestamp: new Date().toISOString()
              };
              
              await nats.publish(`village.vine.${id}.messages`, msg);
            } catch (error) {
              console.error(`❌ Error publishing message to vine ${id}:`, error);
            }
          }
        },
        close(ws) {
          const { id } = ws.data.params;
          const { name } = ws.data.query as any;
          console.log(`🔌 WebSocket disconnected from vine: ${id} (${name})`);
          
          // Cleanup active participant status
          const vine = villageVines.get(id);
          if (vine && name) {
            vine.claimed.delete(name);
          }

          const unsubscribe = wsConnections.get(ws);
          if (unsubscribe) {
            unsubscribe();
            wsConnections.delete(ws);
          }
        }
      })
  )
  
  // Feedback Group - Save feedback to filesystem
  .group('/api/feedback', (app) =>
    app
      .post('/', async ({ body, set }) => {
        try {
          await ensureFeedbackDir();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `feedback-${timestamp}-${crypto.randomUUID().slice(0, 8)}.json`;
          const filepath = join(FEEDBACK_DIR, filename);
          
          await writeFile(filepath, JSON.stringify({
            ...body,
            receivedAt: new Date().toISOString()
          }, null, 2));
          
          console.log(`📝 Feedback saved to ${filepath}`);
          return { success: true, message: 'Feedback saved' };
        } catch (error: any) {
          console.error('Failed to save feedback:', error);
          set.status = 500;
          return { success: false, error: error.message || 'Failed to save feedback' };
        }
      }, {
        body: t.Object({
          type: t.String(),
          name: t.String(),
          email: t.Optional(t.String()),
          description: t.String(),
          metadata: t.Optional(t.Any())
        })
      })
      .get('/', async ({ headers, jwt, set }) => {
        try {
          const payload = await requireAuth(headers, jwt, set);
          if (!payload) return { error: 'Unauthorized' };

          await ensureFeedbackDir();
          const files = await readdir(FEEDBACK_DIR);
          const feedbackFiles = files.filter(f => f.endsWith('.json'));
          
          const feedbacks = await Promise.all(
            feedbackFiles.map(async (file) => {
              const content = await readFile(join(FEEDBACK_DIR, file), 'utf-8');
              return {
                filename: file,
                ...JSON.parse(content)
              };
            })
          );
          
          // Sort by receivedAt descending
          return feedbacks.sort((a, b) => 
            new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
          );
        } catch (error: any) {
          console.error('Failed to list feedback:', error);
          set.status = 500;
          return { success: false, error: error.message || 'Failed to list feedback' };
        }
      })
      .get('/:filename', async ({ params: { filename }, headers, jwt, set }) => {
        try {
          const payload = await requireAuth(headers, jwt, set);
          if (!payload) return { error: 'Unauthorized' };

          const filepath = join(FEEDBACK_DIR, filename);
          const content = await readFile(filepath, 'utf-8');
          return JSON.parse(content);
        } catch (error: any) {
          console.error(`Failed to read feedback file ${filename}:`, error);
          set.status = 404;
          return { success: false, error: 'Feedback file not found' };
        }
      })
  )
  
  // Bubbles Management Group
  .group('/api/bubbles', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/:brandId', async ({ params: { brandId } }) => {
        return bubbleDb.findAllByBrand(brandId);
      })
      .post('/', async ({ body }) => {
        return bubbleDb.create(body.brandId, body.text, body.instructions);
      }, {
        body: t.Object({
          brandId: t.String(),
          text: t.String(),
          instructions: t.Optional(t.String())
        })
      })
      .patch('/:id', async ({ params: { id }, body }) => {
        bubbleDb.update(Number(id), body);
        return { success: true };
      }, {
        body: t.Object({
          text: t.Optional(t.String()),
          active: t.Optional(t.Boolean()),
          instructions: t.Optional(t.String())
        })
      })
      .delete('/:id', async ({ params: { id } }) => {
        bubbleDb.delete(Number(id));
        return { success: true };
      })
  )

  // Vineyard Projects Group
  .group('/api/projects', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async () => {
        // Proxy to AgentX or return mock data
        // For now, returning empty array - implement storage later
        return { success: true, projects: [] };
      })
      .get('/:id', async ({ params: { id } }) => {
        return { success: true, project: null };
      })
      .post('/', async ({ body }) => {
        return { success: true, project: body };
      }, {
        body: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          color: t.String(),
          icon: t.String(),
          repoUrl: t.Optional(t.String())
        })
      })
      .patch('/:id', async ({ params: { id }, body }) => {
        return { success: true };
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          description: t.Optional(t.String()),
          color: t.Optional(t.String()),
          icon: t.Optional(t.String())
        })
      })
      .delete('/:id', async ({ params: { id } }) => {
        return { success: true };
      })
  )

  // Vineyard Tasks Group
  .group('/api/tasks', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async ({ query: { projectId } }) => {
        return { success: true, tasks: [] };
      }, {
        query: t.Object({
          projectId: t.Optional(t.String())
        })
      })
      .get('/:id', async ({ params: { id } }) => {
        return { success: true, task: null };
      })
      .post('/', async ({ body }) => {
        return { success: true, task: body };
      }, {
        body: t.Object({
          title: t.String(),
          description: t.Optional(t.String()),
          status: t.String(),
          priority: t.String(),
          projectId: t.String(),
          areaId: t.String(),
          assigneeId: t.String(),
          specialties: t.Optional(t.Array(t.String()))
        })
      })
      .patch('/:id', async ({ params: { id }, body }) => {
        return { success: true };
      }, {
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          status: t.Optional(t.String()),
          priority: t.Optional(t.String()),
          projectId: t.Optional(t.String())
        })
      })
      .delete('/:id', async ({ params: { id } }) => {
        return { success: true };
      })
  )

  // Vineyard Agents Group
  .group('/api/vineyard/agents', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async () => {
        return { success: true, agents: [] };
      })
      .get('/:id', async ({ params: { id } }) => {
        return { success: true, agent: null };
      })
  )

  // Vineyard AI Lenses Group
  .group('/api/lenses', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async () => {
        return { success: true, lenses: [] };
      })
      .get('/:id', async ({ params: { id } }) => {
        return { success: true, lens: null };
      })
      .post('/', async ({ body }) => {
        return { success: true, lens: body };
      }, {
        body: t.Object({
          name: t.String(),
          icon: t.String(),
          color: t.String(),
          description: t.String(),
          systemPrompt: t.String(),
          category: t.String()
        })
      })
      .post('/:id/analyze', async ({ params: { id }, body, headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };

        try {
          const startTime = Date.now();

          // Call AgentX Collective for AI analysis
          const agentxResponse = await fetch(`${AGENTX_URL}/api/collective/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: body.systemPrompt || 'You are an AI lens analyzing project data. Provide actionable insights.'
                },
                {
                  role: 'user',
                  content: `Analyze the following ${body.targetType}: ${JSON.stringify(body.contextData)}`
                }
              ],
              userEmail: payload.email || 'vineyard@bree.ai',
              orgSlug: 'the-vineyard',
              options: { stream: false }
            })
          });

          if (!agentxResponse.ok) {
            throw new Error(`AgentX request failed: ${agentxResponse.statusText}`);
          }

          const agentxData = await agentxResponse.json();
          const analysisText = agentxData.content || agentxData.message || 'Analysis completed';

          // Parse action items from the response
          const actionItems = analysisText.match(/[-•]\s+(.+)/g)?.map((item: string) =>
            item.replace(/^[-•]\s+/, '').trim()
          ) || [];

          return {
            success: true,
            analysis: {
              id: crypto.randomUUID(),
              lensId: id,
              targetType: body.targetType,
              targetId: body.targetId,
              status: 'complete',
              result: analysisText,
              summary: analysisText.substring(0, 200) + '...',
              severity: 'info',
              actionItems: actionItems.slice(0, 5),
              createdAt: new Date().toISOString(),
              durationMs: Date.now() - startTime
            }
          };
        } catch (error: any) {
          console.error('AI Lens analysis error:', error);
          return {
            success: false,
            error: error.message || 'Analysis failed'
          };
        }
      }, {
        body: t.Object({
          targetType: t.String(),
          targetId: t.String(),
          projectId: t.Optional(t.String()),
          contextData: t.Optional(t.Any())
        })
      })
  )

  // Vineyard Areas Group
  .group('/api/areas', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .get('/', async () => {
        return { success: true, areas: [] };
      })
  )

  // Vineyard Knowledge Search (Ragster Integration)
  .group('/api/vineyard/knowledge', (app) =>
    app
      .onBeforeHandle(async ({ headers, jwt, set }) => {
        const payload = await requireAuth(headers, jwt, set);
        if (!payload) return { error: 'Unauthorized' };
      })
      .post('/search', async ({ body }) => {
        try {
          // Search Ragster for project-related knowledge
          const res = await fetch(`${RAGSTER_API_URL}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-org-id': 'the-vineyard'
            },
            body: JSON.stringify({
              query: body.query,
              collection: body.collection || 'the-vineyard-v1',
              topK: body.topK || 5,
              min_score: body.min_score || 0.7,
              org_id: 'the-vineyard'
            })
          });

          if (!res.ok) {
            throw new Error(`Ragster search failed: ${res.statusText}`);
          }

          const data = await res.json();
          return { success: true, results: data.results || [] };
        } catch (error: any) {
          console.error('Knowledge search error:', error);
          return {
            success: false,
            error: error.message || 'Search failed',
            results: []
          };
        }
      }, {
        body: t.Object({
          query: t.String(),
          collection: t.Optional(t.String()),
          topK: t.Optional(t.Number()),
          min_score: t.Optional(t.Number())
        })
      })
      .post('/chat', async ({ body }) => {
        try {
          // Use Ragster chat for context-aware Q&A
          const res = await fetch(`${RAGSTER_API_URL}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-org-id': 'the-vineyard'
            },
            body: JSON.stringify({
              messages: body.messages,
              org_id: 'the-vineyard',
              options: body.options
            })
          });

          if (!res.ok) {
            throw new Error(`Ragster chat failed: ${res.statusText}`);
          }

          return res.json();
        } catch (error: any) {
          console.error('Knowledge chat error:', error);
          return {
            success: false,
            error: error.message || 'Chat failed'
          };
        }
      }, {
        body: t.Object({
          messages: t.Array(t.Object({
            role: t.String(),
            content: t.String()
          })),
          options: t.Optional(t.Any())
        })
      })
  );

// Only listen if this file is run directly (not imported)
if (import.meta.main) {
  // Ensure feedback directory exists
  await ensureFeedbackDir();
  
  // Seed initial data (idempotent)
  await seedDatabase();

  // Serve static assets if configured (for single-container deployment)
  if (process.env.STATIC_ASSETS_PATH) {
    const { staticPlugin } = await import('@elysiajs/static');
    app.use(staticPlugin({
      assets: process.env.STATIC_ASSETS_PATH,
      prefix: '/'
    }));
    console.log(`📦 Serving static assets from ${process.env.STATIC_ASSETS_PATH}`);
  }

  app.listen(3000);
  console.log(
    `🦊 BREE AI Gateway is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

export type App = typeof app;
