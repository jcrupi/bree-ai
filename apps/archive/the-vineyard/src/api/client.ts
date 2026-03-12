/**
 * BREE AI Eden-Style API Client for The Vineyard
 *
 * Uses the shared Eden Treaty client from @bree-ai/core
 * Returns { data, error } just like Eden Treaty.
 */

import { api } from '@bree-ai/core/utils';
import type {
  Task,
  Agent,
  Project,
  AILens,
  AILensAnalysis,
} from "../types";
import type {
  EdenResponse,
  CreateTaskBody,
  UpdateTaskBody,
  CreateProjectBody,
  CreateLensBody,
  UpdateLensBody,
  AnalyzeRequest,
} from "./types";

// ─── Projects API ──────────────────────────────────────────
const projects = {
  get: async (): Promise<EdenResponse<Project[]>> => {
    try {
      const { data, error } = await api.api.projects.get();
      if (error) return { data: null, error };
      return { data: (data as any).projects || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  post: async (body: CreateProjectBody): Promise<EdenResponse<Project>> => {
    try {
      const { data, error } = await api.api.projects.post(body);
      if (error) return { data: null, error };
      return { data: (data as any).project, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  [":id"]: {
    get: async (id: string): Promise<EdenResponse<Project>> => {
      try {
        const { data, error } = await api.api.projects({ id }).get();
        if (error) return { data: null, error };
        return { data: (data as any).project, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    patch: async (id: string, body: Partial<Project>): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.projects({ id }).patch(body);
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    delete: async (id: string): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.projects({ id }).delete();
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },
  },
};

// ─── Tasks API ────────────────────────────────────────────
const tasks = {
  get: async (projectId?: string): Promise<EdenResponse<Task[]>> => {
    try {
      const { data, error } = await api.api.tasks.get({ query: { projectId } });
      if (error) return { data: null, error };
      return { data: (data as any).tasks || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  post: async (body: CreateTaskBody): Promise<EdenResponse<Task>> => {
    try {
      const { data, error } = await api.api.tasks.post(body);
      if (error) return { data: null, error };
      return { data: (data as any).task, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  [":id"]: {
    get: async (id: string): Promise<EdenResponse<Task>> => {
      try {
        const { data, error } = await api.api.tasks({ id }).get();
        if (error) return { data: null, error };
        return { data: (data as any).task, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    patch: async (id: string, body: UpdateTaskBody): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.tasks({ id }).patch(body);
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    delete: async (id: string): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.tasks({ id }).delete();
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },
  },
};

// ─── Agents API ────────────────────────────────────────────
const vineyardAgents = {
  get: async (): Promise<EdenResponse<Agent[]>> => {
    try {
      const { data, error } = await api.api.vineyard.agents.get();
      if (error) return { data: null, error };
      return { data: (data as any).agents || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  [":id"]: {
    get: async (id: string): Promise<EdenResponse<Agent>> => {
      try {
        const { data, error } = await api.api.vineyard.agents({ id }).get();
        if (error) return { data: null, error };
        return { data: (data as any).agent, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },
  },
};

// ─── Lenses API ────────────────────────────────────────────
const lenses = {
  get: async (): Promise<EdenResponse<AILens[]>> => {
    try {
      const { data, error } = await api.api.lenses.get();
      if (error) return { data: null, error };
      return { data: (data as any).lenses || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  post: async (body: CreateLensBody): Promise<EdenResponse<AILens>> => {
    try {
      const { data, error } = await api.api.lenses.post(body);
      if (error) return { data: null, error };
      return { data: (data as any).lens, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  [":id"]: {
    get: async (id: string): Promise<EdenResponse<AILens>> => {
      try {
        const { data, error } = await api.api.lenses({ id }).get();
        if (error) return { data: null, error };
        return { data: (data as any).lens, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    patch: async (id: string, body: UpdateLensBody): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.lenses({ id }).patch(body);
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    delete: async (id: string): Promise<EdenResponse<{ success: boolean }>> => {
      try {
        const { data, error } = await api.api.lenses({ id }).delete();
        if (error) return { data: null, error };
        return { data: data as any, error: null };
      } catch (e) {
        return { data: null, error: (e as Error).message };
      }
    },

    analyze: {
      post: async (id: string, body: AnalyzeRequest): Promise<EdenResponse<AILensAnalysis>> => {
        try {
          const { data, error } = await api.api.lenses({ id }).analyze.post(body);
          if (error) return { data: null, error };
          return { data: (data as any).analysis, error: null };
        } catch (e) {
          return { data: null, error: (e as Error).message };
        }
      },
    },
  },
};

// ─── Areas API ─────────────────────────────────────────────
const areas = {
  get: async (): Promise<EdenResponse<any[]>> => {
    try {
      const { data, error } = await api.api.areas.get();
      if (error) return { data: null, error };
      return { data: (data as any).areas || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },
};

// ─── Knowledge API ─────────────────────────────────────────
const knowledge = {
  search: async (query: string, options?: { topK?: number; min_score?: number }) => {
    try {
      const { data, error } = await api.api.vineyard.knowledge.search.post({
        query,
        topK: options?.topK,
        min_score: options?.min_score
      });
      if (error) return { data: null, error };
      return { data: (data as any).results || [], error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },

  chat: async (messages: Array<{ role: string; content: string }>, options?: any) => {
    try {
      const { data, error } = await api.api.vineyard.knowledge.chat.post({
        messages,
        options
      });
      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },
};

// ─── Export Eden-Style Client ──────────────────────────────
export const client = {
  api: {
    projects,
    tasks,
    vineyardAgents,
    lenses,
    areas,
    knowledge,
  },
};
