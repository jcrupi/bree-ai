/**
 * Grapes & Vines API Types
 *
 * These types mirror what an ElysiaJS server would define.
 * When connecting to a real Elysia backend, replace this file
 * with: import type { App } from 'grapes-vines-api';
 */

import {
  Task,
  Agent,
  Area,
  Project,
  TaskStatus,
  TaskPriority,
  AgentType,
  AILens,
  AILensAnalysis,
  AgentXRequest,
  AgentXResponse,
  LensCategory,
  AgentXNote } from
'../types';

// ─── Eden-style response wrapper ────────────────────────────
export type EdenResponse<T> =
{
  data: T;
  error: null;
} |
{
  data: null;
  error: {
    status: number;
    message: string;
  };
};

// ─── API Request Bodies ─────────────────────────────────────
export interface CreateTaskBody {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  areaId: string;
  assigneeId: string;
  dueDate?: string;
  agentxNoteId?: string;
  agentxNoteContent?: string;
}
export interface UpdateTaskBody {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  areaId?: string;
  assigneeId?: string;
  dueDate?: string;
  agentxNoteId?: string;
  agentxNoteContent?: string;
}
export interface CreateProjectBody {
  name: string;
  description?: string;
  color: string;
  icon: string;
}
export interface CreateAgentBody {
  name: string;
  type: AgentType;
  avatar?: string;
  color: string;
}

// ─── AI Lens Request Bodies ─────────────────────────────────
export interface CreateLensBody {
  name: string;
  icon: string;
  color: string;
  description: string;
  systemPrompt: string;
  category: LensCategory;
}

export interface UpdateLensBody {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  systemPrompt?: string;
  category?: LensCategory;
  isActive?: boolean;
}

export interface AnalyzeRequest {
  lensId: string;
  targetType: string;
  targetId: string;
  projectId?: string;
  contextSummary: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// ─── API Route Map (mirrors Elysia route definitions) ───────
export interface ApiRoutes {
  tasks: {
    get: () => Promise<EdenResponse<Task[]>>;
    post: (body: CreateTaskBody) => Promise<EdenResponse<Task>>;
    ':id': {
      get: (id: string) => Promise<EdenResponse<Task>>;
      put: (id: string, body: UpdateTaskBody) => Promise<EdenResponse<Task>>;
      delete: (id: string) => Promise<EdenResponse<{success: boolean;}>>;
    };
  };
  agents: {
    get: () => Promise<EdenResponse<Agent[]>>;
    post: (body: CreateAgentBody) => Promise<EdenResponse<Agent>>;
  };
  areas: {
    get: () => Promise<EdenResponse<Area[]>>;
  };
  projects: {
    get: () => Promise<EdenResponse<Project[]>>;
    post: (body: CreateProjectBody) => Promise<EdenResponse<Project>>;
  };
  lenses: {
    get: () => Promise<EdenResponse<AILens[]>>;
    post: (body: CreateLensBody) => Promise<EdenResponse<AILens>>;
    ':id': {
      get: (id: string) => Promise<EdenResponse<AILens>>;
      put: (id: string, body: UpdateLensBody) => Promise<EdenResponse<AILens>>;
      delete: (id: string) => Promise<EdenResponse<{success: boolean;}>>;
      analyses: {
        get: (id: string) => Promise<EdenResponse<AILensAnalysis[]>>;
      };
    };
  };
  agentx: {
    analyze: (body: AnalyzeRequest) => Promise<EdenResponse<AgentXResponse>>;
    health: () => Promise<
      EdenResponse<{status: string;agents: number;queueDepth: number;}>>;

    notes: {
      get: () => Promise<EdenResponse<AgentXNote[]>>;
      ':id': {
        get: (id: string) => Promise<EdenResponse<AgentXNote>>;
      };
      'by-lens/:lensId': {
        get: (lensId: string) => Promise<EdenResponse<AgentXNote[]>>;
      };
      'by-agent/:agentId': {
        get: (agentId: string) => Promise<EdenResponse<AgentXNote[]>>;
      };
      'by-nats/:subject': {
        get: (subject: string) => Promise<EdenResponse<AgentXNote[]>>;
      };
    };
  };
  health: {
    get: () => Promise<EdenResponse<{status: string;uptime: number;}>>;
  };
}