/**
 * Relativity Workspace API Explorer - Backend
 * BREE Stack: Bun + React + Elysia + Eden
 */

import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { db } from './data/mockData';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const DIST = join(import.meta.dir, '../../frontend/dist');

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Relativity Workspace API Explorer',
        version: '1.0.0',
        description: 'Mock Relativity eDiscovery Workspace APIs with advanced debugging'
      },
      tags: [
        { name: 'workspace', description: 'Workspace operations' },
        { name: 'resource', description: 'Resource management' },
        { name: 'lookup', description: 'Reference data' }
      ]
    }
  }))

  // Health check
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Relativity API Explorer'
  }))

  // ===== WORKSPACE ENDPOINTS =====

  // Get all workspaces
  .get('/api/workspace', () => {
    const workspaces = db.getAllWorkspaces();
    return {
      success: true,
      data: workspaces,
      count: workspaces.length,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Get all workspaces',
      description: 'Retrieve a list of all workspaces in the system'
    }
  })

  // Get workspace by ID
  .get('/api/workspace/:id', ({ params, set }) => {
    const workspace = db.getWorkspace(parseInt(params.id));

    if (!workspace) {
      set.status = 404;
      return {
        success: false,
        error: 'Workspace not found',
        artifactID: parseInt(params.id)
      };
    }

    return {
      success: true,
      data: workspace,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Get workspace by ID',
      description: 'Retrieve a specific workspace by its artifact ID'
    },
    params: t.Object({
      id: t.String()
    })
  })

  // Create workspace
  .post('/api/workspace', ({ body, set }) => {
    // Validate required fields
    if (!body.name || !body.matterArtifactID || !body.clientArtifactID || !body.resourcePoolArtifactID) {
      set.status = 400;
      return {
        success: false,
        error: 'Missing required fields',
        required: ['name', 'matterArtifactID', 'clientArtifactID', 'resourcePoolArtifactID']
      };
    }

    const workspace = db.createWorkspace(body);
    set.status = 201;

    return {
      success: true,
      data: workspace,
      message: 'Workspace created successfully',
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Create workspace',
      description: 'Create a new workspace with the provided configuration'
    },
    body: t.Object({
      name: t.String(),
      matterArtifactID: t.Number(),
      clientArtifactID: t.Number(),
      resourcePoolArtifactID: t.Number(),
      statusArtifactID: t.Optional(t.Number()),
      sqlServerArtifactID: t.Optional(t.Number()),
      enableDataGrid: t.Optional(t.Boolean()),
      keywords: t.Optional(t.String()),
      notes: t.Optional(t.String())
    })
  })

  // Update workspace
  .put('/api/workspace/:id', ({ params, body, set }) => {
    const workspace = db.updateWorkspace(parseInt(params.id), body);

    if (!workspace) {
      set.status = 404;
      return {
        success: false,
        error: 'Workspace not found',
        artifactID: parseInt(params.id)
      };
    }

    return {
      success: true,
      data: workspace,
      message: 'Workspace updated successfully',
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Update workspace',
      description: 'Update an existing workspace'
    },
    params: t.Object({
      id: t.String()
    })
  })

  // Delete workspace
  .delete('/api/workspace/:id', ({ params, set }) => {
    const success = db.deleteWorkspace(parseInt(params.id));

    if (!success) {
      set.status = 404;
      return {
        success: false,
        error: 'Workspace not found',
        artifactID: parseInt(params.id)
      };
    }

    return {
      success: true,
      message: 'Workspace deleted successfully',
      artifactID: parseInt(params.id),
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Delete workspace',
      description: 'Delete a workspace by ID'
    },
    params: t.Object({
      id: t.String()
    })
  })

  // Query eligible saved searches
  .post('/api/workspace/:id/query-eligible-saved-searches', ({ params }) => {
    const workspaceID = parseInt(params.id);
    const searches = db.getSavedSearches(workspaceID);

    return {
      success: true,
      data: searches,
      count: searches.length,
      workspaceID,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Query saved searches',
      description: 'Get all saved searches for a workspace'
    },
    params: t.Object({
      id: t.String()
    })
  })


  // Create workspace from template
  // Uses /api/workspace/from-template/:id (static prefix) to avoid Elysia router
  // collision with /api/workspace/:id — Elysia doesn't allow two different param names
  // at the same dynamic segment position.
  .post('/api/workspace/from-template/:id', ({ params, body, set }) => {
    if (!body.name) {
      set.status = 400;
      return {
        success: false,
        error: 'Missing required field: name'
      };
    }

    const result = db.createWorkspaceFromTemplate(parseInt(params.id), body);

    if (!result) {
      set.status = 404;
      return {
        success: false,
        error: 'Template workspace not found',
        templateId: parseInt(params.id)
      };
    }

    set.status = 201;
    return {
      success: true,
      data: result.workspace,
      templateId: parseInt(params.id),
      templateName: result.templateName,
      message: `Workspace "${result.workspace.name}" created from template "${result.templateName}"`,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['workspace'],
      summary: 'Create workspace from template',
      description: 'Clone an existing workspace as a template, inheriting its resource pool, matter, client, SQL server, and data grid settings. Override any field by providing it in the request body.'
    },
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      name: t.String(),
      matterArtifactID: t.Optional(t.Number()),
      clientArtifactID: t.Optional(t.Number()),
      resourcePoolArtifactID: t.Optional(t.Number()),
      enableDataGrid: t.Optional(t.Boolean()),
      keywords: t.Optional(t.String()),
      notes: t.Optional(t.String())
    })
  })


  // ===== RESOURCE POOL ENDPOINTS =====

  // Get all resource pools
  .get('/api/workspace/eligible-resource-pools', () => {
    const pools = db.getEligibleResourcePools();
    return {
      success: true,
      data: pools,
      count: pools.length,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['resource'],
      summary: 'Get eligible resource pools',
      description: 'Retrieve all available resource pools'
    }
  })

  // Get Azure credentials for resource pool
  .get('/api/workspace/eligible-resource-pools/:poolId/eligible-azure-credentials', ({ params }) => {
    const poolID = parseInt(params.poolId);
    const credentials = db.getAzureCredentials(poolID);

    return {
      success: true,
      data: credentials,
      count: credentials.length,
      resourcePoolID: poolID,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['resource'],
      summary: 'Get Azure credentials',
      description: 'Get Azure storage credentials for a resource pool'
    },
    params: t.Object({
      poolId: t.String()
    })
  })

  // ===== LOOKUP ENDPOINTS =====

  // Get all matters
  .get('/api/matters', () => {
    const matters = db.getMatters();
    return {
      success: true,
      data: matters,
      count: matters.length,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['lookup'],
      summary: 'Get all matters',
      description: 'Retrieve all legal matters'
    }
  })

  // Create a new matter and assign it to a client
  .post('/api/matters', ({ body, set }) => {
    if (!body.name || !body.clientArtifactID) {
      set.status = 400;
      return { success: false, error: 'Missing required fields: name, clientArtifactID' };
    }

    const matter = db.createMatter({
      name: body.name,
      clientArtifactID: body.clientArtifactID,
      matterNumber: body.matterNumber ?? '',
      status: body.status ?? 'Active',
    });

    if (!matter) {
      set.status = 404;
      return { success: false, error: 'Client not found', clientArtifactID: body.clientArtifactID };
    }

    set.status = 201;
    return {
      success: true,
      data: matter,
      message: `Matter "${matter.name}" created and assigned to client ${matter.clientArtifactID}`,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['lookup'],
      summary: 'Create a new matter',
      description: 'Create a new legal matter and assign it to an existing client'
    },
    body: t.Object({
      name:             t.String(),
      clientArtifactID: t.Number(),
      matterNumber:     t.Optional(t.String()),
      status:           t.Optional(t.String()),
    })
  })


  // ===== CLIENT MANAGER APIs =====

  .get('/api/clients', () => {
    const clients = db.getClients();
    return { success: true, data: clients, count: clients.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['clients'], summary: 'List all clients', description: 'Retrieve all Relativity clients' } })

  .get('/api/clients/:id', ({ params, set }) => {
    const client = db.getClient(parseInt(params.id));
    if (!client) { set.status = 404; return { success: false, error: 'Client not found' }; }
    return { success: true, data: client, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['clients'], summary: 'Get client', description: 'Retrieve a single client by artifactID' }, params: t.Object({ id: t.String() }) })

  .post('/api/clients', ({ body, set }) => {
    if (!body.name?.trim())         { set.status = 400; return { success: false, error: 'name is required' }; }
    if (!body.contactEmail?.trim()) { set.status = 400; return { success: false, error: 'contactEmail is required' }; }
    const client = db.createClient({ name: body.name, industry: body.industry ?? 'General', contactEmail: body.contactEmail });
    set.status = 201;
    return { success: true, data: client, message: `Client '${client.name}' created with ID ${client.artifactID}`, timestamp: new Date().toISOString() };
  }, {
    detail: { tags: ['clients'], summary: 'Create client', description: 'Create a new Relativity client' },
    body: t.Object({
      name:         t.String(),
      industry:     t.Optional(t.String()),
      contactEmail: t.String(),
    })
  })

  .patch('/api/clients/:id', ({ params, body, set }) => {
    const id = parseInt(params.id);
    const updated = db.updateClient(id, body);
    if (!updated) { set.status = 404; return { success: false, error: 'Client not found' }; }
    return { success: true, data: updated, message: `Client ${id} updated`, timestamp: new Date().toISOString() };
  }, {
    detail: { tags: ['clients'], summary: 'Update client', description: 'Update name, industry, or contactEmail for an existing client' },
    params: t.Object({ id: t.String() }),
    body: t.Object({
      name:         t.Optional(t.String()),
      industry:     t.Optional(t.String()),
      contactEmail: t.Optional(t.String()),
    })
  })

  .delete('/api/clients/:id', ({ params, set }) => {
    const id = parseInt(params.id);
    const result = db.deleteClient(id);
    if (!result.deleted) {
      set.status = result.reason === 'Client not found' ? 404 : 409;
      return { success: false, error: result.reason };
    }
    return { success: true, message: `Client ${id} deleted`, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['clients'], summary: 'Delete client', description: 'Delete a client. Blocked if they have active workspaces or open matters.' }, params: t.Object({ id: t.String() }) })

  .get('/api/clients/:id/matters', ({ params, set }) => {
    const id = parseInt(params.id);
    const client = db.getClient(id);
    if (!client) { set.status = 404; return { success: false, error: 'Client not found' }; }
    const matters = db.getMatters().filter(m => m.clientArtifactID === id);
    return { success: true, client, data: matters, count: matters.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['clients'], summary: 'Client matters', description: 'All matters belonging to a client' }, params: t.Object({ id: t.String() }) })

  .get('/api/clients/:id/workspaces', ({ params, set }) => {
    const id = parseInt(params.id);
    const client = db.getClient(id);
    if (!client) { set.status = 404; return { success: false, error: 'Client not found' }; }
    const workspaces = db.getWorkspaces().filter(w => w.clientArtifactID === id);
    return { success: true, client, data: workspaces, count: workspaces.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['clients'], summary: 'Client workspaces', description: 'All workspaces belonging to a client' }, params: t.Object({ id: t.String() }) })


  // Get all statuses
  .get('/api/statuses', () => {
    const statuses = db.getStatuses();
    return {
      success: true,
      data: statuses,
      count: statuses.length,
      timestamp: new Date().toISOString()
    };
  }, {
    detail: {
      tags: ['lookup'],
      summary: 'Get all statuses',
      description: 'Retrieve all workspace statuses'
    }
  })

  // ===== USERS ENDPOINTS =====

  .get('/api/users', () => {
    const users = db.getUsers();
    return { success: true, data: users, count: users.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['lookup'], summary: 'Get all users', description: 'Retrieve all Relativity users' } })

  .get('/api/groups', () => {
    const groups = db.getGroups();
    return { success: true, data: groups, count: groups.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['lookup'], summary: 'Get all groups', description: 'Retrieve all groups including Client Domain Admin groups' } })

  .get('/api/groups/:id/members', ({ params }) => {
    const members = db.getGroupMembers(parseInt(params.id));
    return { success: true, data: members, count: members.length, groupArtifactID: parseInt(params.id), timestamp: new Date().toISOString() };
  }, { detail: { tags: ['lookup'], summary: 'Get group members', description: 'Get all users in a group' }, params: t.Object({ id: t.String() }) })

  // ===== STORY 1: CLIENT DOMAIN VIEW =====

  .get('/api/clients/domain-view', () => {
    const view = db.getClientDomainView();
    return {
      success: true,
      data: view,
      totalClients: view.length,
      totalWorkspaces: view.reduce((sum, c) => sum + c.totalWorkspaces, 0),
      totalInvalidMatters: view.reduce((sum, c) => sum + c.invalidMatterCount, 0),
      timestamp: new Date().toISOString()
    };
  }, { detail: { tags: ['workspace'], summary: 'Client domain view', description: 'All workspaces organized by client domain with matter info and admin group details' } })

  // ===== STORY 2: COMPLIANCE EMAIL ALERT =====

  .post('/api/email/compliance-alert/:clientId', ({ params, set }) => {
    const clientId = parseInt(params.clientId);
    const result = db.sendComplianceAlert(clientId);

    if (!result) {
      set.status = 422;
      return {
        success: false,
        error: 'No compliance alert needed — either client not found, no admin group, or all matter numbers are valid',
        clientArtifactID: clientId
      };
    }

    return {
      success: true,
      message: `Compliance alert sent to ${result.to.length} admin(s) in "${result.groupName}"`,
      emailLog: result,
      timestamp: new Date().toISOString()
    };
  }, { detail: { tags: ['workspace'], summary: 'Send compliance alert', description: 'Sends an email (mock) to the Client Domain Admin group for a client if any workspaces have invalid matter numbers (format: E-########)' }, params: t.Object({ clientId: t.String() }) })

  .post('/api/email/compliance-alert-all', ({ }) => {
    const view = db.getClientDomainView();
    const results = view
      .filter(c => c.invalidMatterCount > 0)
      .map(c => db.sendComplianceAlert(c.client.artifactID))
      .filter(Boolean);
    return {
      success: true,
      alertsSent: results.length,
      logs: results,
      timestamp: new Date().toISOString()
    };
  }, { detail: { tags: ['workspace'], summary: 'Send compliance alerts to all clients', description: 'Sends compliance alerts to all clients with invalid matter numbers' } })

  .get('/api/email/logs', () => {
    const logs = db.getEmailLogs();
    return { success: true, data: logs, count: logs.length, timestamp: new Date().toISOString() };
  }, { detail: { tags: ['lookup'], summary: 'Email logs', description: 'Get all sent compliance email logs' } })

  // ===== OBSERVATIONS (theObserver — app-scoped) =====

  .get('/api/observations', () => {
    const obs = db.getObservables();
    return { success: true, data: obs, count: obs.length, app: 'billy-relativity', timestamp: new Date().toISOString() };
  }, { detail: { tags: ['lookup'], summary: 'Get all observations', description: 'Retrieve all theObserver observations saved for billy-relativity' } })

  .post('/api/observations', ({ body, set }) => {
    if (!body.text?.trim()) {
      set.status = 400;
      return { success: false, error: 'text is required' };
    }
    const obs = db.addObservable({ text: body.text.trim(), category: body.category, tags: body.tags });
    set.status = 201;
    return { success: true, observation: obs, timestamp: new Date().toISOString() };
  }, {
    detail: { tags: ['lookup'], summary: 'Add observation', description: 'Save a new theObserver observation to the billy-relativity server store' },
    body: t.Object({
      text: t.String(),
      category: t.Optional(t.String()),
      tags: t.Optional(t.Array(t.String())),
    })
  })


  // ===== REAL RELATIVITY AUTH PROXY =====
  // OAuth2 Client Credentials flow per Relativity docs:
  // POST {instanceUrl}/Relativity/Identity/connect/token
  //   content-type: application/x-www-form-urlencoded
  //   body: client_id=...&client_secret=...&scope=SystemUserInfo&grant_type=client_credentials
  // Credentials are NEVER stored — they're used once and discarded.

  .post('/api/relativity/auth', async ({ body, set }) => {
    const { instanceUrl, clientId, clientSecret } = body as { instanceUrl: string; clientId: string; clientSecret: string };

    if (!instanceUrl || !clientId || !clientSecret) {
      set.status = 400;
      return { success: false, message: 'instanceUrl, clientId, and clientSecret are required.' };
    }

    const tokenUrl = `${instanceUrl}/Relativity/Identity/connect/token`;

    const formBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'SystemUserInfo',
      grant_type: 'client_credentials',
    });

    try {
      const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      });

      const text = await resp.text();
      let json: Record<string, unknown> = {};
      try { json = JSON.parse(text); } catch { /* non-JSON response */ }

      if (resp.ok && json['access_token']) {
        return {
          success: true,
          message: `Successfully authenticated to ${instanceUrl}`,
          accessToken: json['access_token'] as string,
          tokenType: (json['token_type'] as string) ?? 'Bearer',
          expiresIn: (json['expires_in'] as number) ?? null,
        };
      }

      // OAuth2 error response: { error, error_description }
      const errCode = (json['error'] as string) ?? `HTTP_${resp.status}`;
      const errDesc = (json['error_description'] as string) ?? text.slice(0, 200);

      return {
        success: false,
        message: resp.status === 401 || resp.status === 400
          ? 'Authentication failed — invalid Client ID or Client Secret.'
          : `Relativity returned HTTP ${resp.status}. Verify your Instance URL is correct.`,
        error: errCode,
        errorDescription: errDesc,
      };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Could not reach Relativity at ${instanceUrl}. Check the URL and network access.`,
        error: 'NETWORK_ERROR',
        errorDescription: msg,
      };
    }
  }, {
    detail: {
      tags: ['auth'],
      summary: 'Authenticate to Relativity (OAuth2)',
      description: 'Proxies OAuth2 Client Credentials token request to a real Relativity instance. Returns access_token on success.'
    },
    body: t.Object({
      instanceUrl: t.String(),
      clientId: t.String(),
      clientSecret: t.String(),
    })
  })

  // Serve frontend static assets (production)
  .get('/assets/*', async ({ params }) => {
    const assetPath = join(DIST, 'assets', params['*'] ?? '');
    const file = Bun.file(assetPath);
    if (!(await file.exists())) return new Response(null, { status: 404 });
    const ext = assetPath.split('.').pop() ?? '';
    const mime = ext === 'js' ? 'application/javascript' : ext === 'css' ? 'text/css' : undefined;
    return new Response(file, { headers: mime ? { 'Content-Type': mime } : {} });
  })

  // SPA fallback — serve index.html for all non-API routes
  .get('*', async ({ request }) => {
    const url = new URL(request.url);
    // Don't intercept /api or /swagger
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/swagger')) {
      return new Response('Not found', { status: 404 });
    }
    const indexPath = join(DIST, 'index.html');
    if (existsSync(indexPath)) {
      return new Response(Bun.file(indexPath), { headers: { 'Content-Type': 'text/html' } });
    }
    return new Response('<p>Billy Relativity — build frontend first.</p>', { headers: { 'Content-Type': 'text/html' } });
  })

  .listen(PORT);

console.log(`
🚀 Relativity Workspace API Explorer is running!

📍 Server: http://localhost:${app.server?.port}
📚 Swagger: http://localhost:${app.server?.port}/swagger
🏥 Health: http://localhost:${app.server?.port}/health

Stack: BREE (Bun + React + Elysia + Eden)
`);

export type App = typeof app;

