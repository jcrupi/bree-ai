import { treaty } from '@elysiajs/eden';
import type { App } from '../../../../apps/api/src/index';
import { safeEnv } from './env';

// Data plane: auth, AI proxies, config, file storage (bree-api)
export const API_URL = safeEnv('VITE_API_URL', 'http://localhost:3000');

// Real-time plane: WebSocket/NATS/SSE streaming (bree-api-realtime)
export const REALTIME_URL = safeEnv('VITE_REALTIME_URL', 'http://localhost:3001');

// Create a typed client that points to your API server
export const api = treaty<App>(API_URL);

// Export types for use in components
export type { App };
