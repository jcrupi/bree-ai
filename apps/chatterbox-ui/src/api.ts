import type { ConvoTurn, Convo, QueryResult, ConvoResult, SmartMemory } from './types';

const BASE = import.meta.env.VITE_CHATTERBOX_URL || 'http://localhost:3002';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Health ─────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status:    string;
  service:   string;
  turns:     number;
  convos:    number;
  timestamp: string;
}

export const getHealth = () => apiFetch<HealthResponse>('/health');

// ── Convo Queries ──────────────────────────────────────────────────────────────

export const queryConvos = (opts: { userId?: string; orgId?: string; limit?: number; cursor?: string | null } = {}) => {
  const params = new URLSearchParams({ limit: String(opts.limit || 50) });
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.userId) params.set('userId', opts.userId);
  if (opts.orgId)  params.set('orgId', opts.orgId);
  return apiFetch<ConvoResult>(`/api/convos?${params}`);
};

export const getConvoById = (convoId: string, includeTurns = true) =>
  apiFetch<Convo>(`/api/convos/${convoId}?includeTurns=${includeTurns}`);

export const getConvoContext = (convoId: string) =>
  apiFetch<any>(`/api/convos/${convoId}/context`);

export const getConvoMemories = (convoId: string) =>
  apiFetch<{ memories: SmartMemory[] }>(`/api/convos/${convoId}/memory`);

// ── Turn Queries ───────────────────────────────────────────────────────────────

export const queryTurns = (opts: { 
  appId?: string; 
  orgId?: string; 
  userId?: string; 
  convoId?: string;
  contextId?: string;
  ehash?: string;
  limit?: number; 
  cursor?: string | null 
} = {}) => {
  const params = new URLSearchParams({ limit: String(opts.limit || 50) });
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.appId) params.set('appId', opts.appId);
  if (opts.orgId) params.set('orgId', opts.orgId);
  if (opts.userId) params.set('userId', opts.userId);
  if (opts.convoId) params.set('convoId', opts.convoId);
  if (opts.contextId) params.set('contextId', opts.contextId);
  if (opts.ehash) params.set('ehash', opts.ehash);
  return apiFetch<QueryResult>(`/api/turns?${params}`);
};

export const getTurnById = (turnId: string) =>
  apiFetch<ConvoTurn>(`/api/turns/${turnId}`);

// ── Store (POST) ───────────────────────────────────────────────────────────────

export interface StoreTurnPayload {
  convoId:       string;
  appId:         string;
  orgId:         string;
  userId:        string;
  questionEhash: string;
  answerEhash:   string;
  resourceIds?:  string[];
  metadata?:     Record<string, unknown>;
}

export interface StoreTurnResponse {
  success: boolean;
  turn:    ConvoTurn;
}

export const storeTurn = (payload: StoreTurnPayload) =>
  apiFetch<StoreTurnResponse>('/api/turns', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
