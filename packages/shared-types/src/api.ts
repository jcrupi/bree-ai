/**
 * API-related types
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ApiMeta {
  version: string;
  timestamp: number;
  requestId?: string;
}

export interface ApiRequestContext {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  ip?: string;
  userAgent?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description?: string;
}
