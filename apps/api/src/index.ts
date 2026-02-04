import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { getNatsService, type AgentMessage } from './nats';
import { authService, seedDatabase, type JWTPayload } from './auth';

// Configuration (use environment variables or defaults)
const RAGSTER_API_URL = process.env.RAGSTER_API_URL || 'https://agent-collective-ragster.fly.dev/api';
const AGENTX_URL = process.env.AGENTX_URL || 'https://agent-collective-agentx.fly.dev';
const ANTIMATTER_URL = process.env.ANTIMATTER_URL || 'https://agent-collective-antimatter.fly.dev';

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

  // Agents (NATS) Group - AI Agent Communication
  .group('/api/agents', (app) =>
    app
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
  );

// Only listen if this file is run directly (not imported)
if (import.meta.main) {
  app.listen(3000);
  console.log(
    `🦊 BREE AI Gateway is running at ${app.server?.hostname}:${app.server?.port}`
  );
}

export type App = typeof app;
