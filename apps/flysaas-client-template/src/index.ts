/**
 * FlySaaS Client Org - Tenant Application
 * Isolated application instance for a specific organization
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authMiddleware } from './middleware/auth';
import { contactsRoutes } from './routes/contacts';
import { dealsRoutes } from './routes/deals';
import { aiRoutes } from './routes/ai';

const PORT = process.env.PORT || 3001;
const ORG_ID = process.env.ORG_ID || 'unknown';

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: `FlySaaS Client Org (${ORG_ID})`,
        version: '0.1.0',
        description: 'Tenant-specific application with CRM extensions and AI features'
      },
      tags: [
        { name: 'Contacts', description: 'Contact management' },
        { name: 'Deals', description: 'Deal pipeline management' },
        { name: 'AI', description: 'AI-powered features' }
      ]
    }
  }))

  // Health check
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: `flysaas-client-${ORG_ID}`
  }))

  // Apply auth middleware to protected routes
  .use(authMiddleware)

  // Routes
  .use(contactsRoutes)
  .use(dealsRoutes)
  .use(aiRoutes)

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
🚀 FlySaaS Client Org (${ORG_ID}) running on port ${PORT}

📚 API Documentation: http://localhost:${PORT}/swagger
📊 Health check: http://localhost:${PORT}/health

Endpoints:
  - Contacts: http://localhost:${PORT}/api/contacts
  - Deals: http://localhost:${PORT}/api/deals
  - AI Features: http://localhost:${PORT}/api/ai/*
`);

export type ClientOrgApp = typeof app;
