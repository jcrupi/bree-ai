import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { getNatsService, type AgentMessage } from './nats';
import { authService, seedDatabase, type JWTPayload } from './auth';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';

async function requireAuth(headers: Record<string, string | undefined>, jwt: any, set: any): Promise<JWTPayload | null> {
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
  const payload = await jwt.verify(token);
  if (!payload) {
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

  return payload as JWTPayload;
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
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'bree-secret-change-in-production',
      exp: '7d' // Token expires in 7 days
    })
  )
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
      .post('/:id/message', async ({ params: { id }, body }) => {
        try {
          const nats = await getNatsService();
          
          const message: AgentMessage = {
            agentId: id,
            content: body.content,
            timestamp: new Date().toISOString(),
            metadata: body.metadata
          };

          await nats.sendMessageToAgent(id, message);

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
  );

// Only listen if this file is run directly (not imported)
if (import.meta.main) {
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
