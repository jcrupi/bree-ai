/**
 * Eden API Client for type-safe Elysia backend communication
 */

import { treaty } from "@elysiajs/eden";
import type { App } from "../../../backend/src/index";

// In prod the Elysia server serves both the API and the frontend — use same host.
// In dev the Vite proxy forwards /api → localhost:3001.
const API_BASE = import.meta.env.VITE_API_URL ?? (
  import.meta.env.PROD ? window.location.host : "localhost:3001"
);
export const api = treaty<App>(API_BASE);


// API Request/Response capture for debugging
export interface APICallDetails {
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  body?: any;
  response: any;
  status: number;
  timestamp: string;
  duration: number;
}

// Wrapper to capture API call details
export async function captureAPICall<T>(
  apiCall: () => Promise<{
    data: T;
    status: number;
    headers: Record<string, string>;
  }>,
  method: string,
  endpoint: string,
  body?: any,
): Promise<{ data: T; details: APICallDetails }> {
  const startTime = performance.now();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const result = await apiCall();
  const duration = performance.now() - startTime;

  const details: APICallDetails = {
    method,
    endpoint,
    headers,
    body: body || null,
    response: result.data,
    status: result.status,
    timestamp: new Date().toISOString(),
    duration: Math.round(duration),
  };

  return { data: result.data, details };
}
