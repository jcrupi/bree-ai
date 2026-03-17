/**
 * FlySaaS Superfly - Main Application
 * Control plane for multi-tenant SaaS platform
 */

import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { generateJWKS } from './auth/jwks';
import { signToken } from './auth/jwt';
import { authSimpleRoutes } from './routes/auth-simple';
import { contactsRoutes } from './routes/core/contacts';
import { dealsRoutes } from './routes/core/deals';
import { orgsRoutes } from './routes/orgs';
import { observationsRoutes } from './routes/observations';
import { gatewayRouter } from './gateway/router';

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'FlySaaS Superfly API',
        version: '0.1.0',
        description: 'Multi-tenant SaaS control plane with FatCRM core and API gateway'
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Organizations', description: 'Organization management' },
        { name: 'Observations', description: 'Observer AI feedback system' },
        { name: 'Contacts', description: 'FatCRM contacts (core)' },
        { name: 'Deals', description: 'FatCRM deals (core)' },
        { name: 'Gateway', description: 'Proxy to client orgs' }
      ]
    }
  }))

  // Health check
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'flysaas-superorg'
  }))

  // Authentication routes
  .use(authSimpleRoutes)

  // Core CRM routes
  .use(contactsRoutes)
  .use(dealsRoutes)

  // Organization management
  .use(orgsRoutes)

  // Observer AI
  .use(observationsRoutes)

  // API Gateway (must be last - catches all /api/orgs/:slug/apps/* routes)
  .use(gatewayRouter)

  // 404 handler
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Route not found' };
    }

    console.error('Server error:', error);
    set.status = 500;
    return { error: 'Internal server error' };
  })

  .listen(PORT);

console.log(`
🚀 FlySaaS Superfly running on port ${PORT}

📚 API Documentation: http://localhost:${PORT}/swagger
🔐 Auth endpoints: http://localhost:${PORT}/auth/*
🔑 JWKS endpoint: http://localhost:${PORT}/auth/jwks
📊 Health check: http://localhost:${PORT}/health

Core CRM:
  - Contacts: http://localhost:${PORT}/api/core/contacts
  - Deals: http://localhost:${PORT}/api/core/deals

Organization Management:
  - Orgs: http://localhost:${PORT}/api/orgs

Observer AI:
  - Observations: http://localhost:${PORT}/api/observations

API Gateway:
  - Proxy: http://localhost:${PORT}/api/orgs/:slug/apps/*
`);

export type SuperflyApp = typeof app;
