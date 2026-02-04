import { treaty } from '@elysiajs/eden';
import type { App } from '../../../../apps/api/src/index';

// Determine the API URL from environment variables or default to localhost:3000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create a typed client that points to your API server
export const api = treaty<App>(API_URL);

// Export types for use in components
export type { App };


