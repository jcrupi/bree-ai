/**
 * BREE AI Unified API Facade
 * 
 * Single TypeScript API for all BREE services.
 * All apps should use this facade instead of calling individual service clients.
 * 
 * This facade provides:
 * - Type-safe access to all BREE services (Ragster, Collective, Identity, Agents)
 * - Consistent error handling
 * - Single point of configuration
 * - Easier testing and mocking
 */

import { api as edenClient, API_URL } from './api-client';
import type { App } from '../../../../apps/api/src/index';

// Re-export types for convenience
export type { 
  RagsterSearchResult, 
  RagsterSearchResponse, 
  RagsterCollection,
  RagsterResource,
  CreateCollectionRequest,
  UploadResourceRequest 
} from './ragster';

export interface AgentInfo {
  agentId: string;
  name?: string;
  type?: string;
  capabilities?: string[];
  status: {
    agentId: string;
    status: 'online' | 'offline' | 'busy';
    lastSeen: string;
    metadata?: Record<string, any>;
  };
}

export interface AgentMessage {
  agentId: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * BREE AI Unified API
 * 
 * A single facade for all BREE services. Routes through the Elysia API Gateway
 * which handles proxying to external services (Ragster, AgentX) and NATS for agents.
 */
export const breeAPI = {
  /**
   * Knowledge Service (Ragster)
   * Document search, collections, and RAG operations
   */
  knowledge: {
    /**
     * Search for documents in a collection
     */
    search: async (params: {
      query: string;
      collection: string;
      topK?: number;
      min_score?: number;
      org_id?: string;
      filter?: Record<string, any>;
    }) => {
      const { data, error } = await edenClient.api.knowledge.search.post(params);
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * List all collections
     */
    listCollections: async (org_id?: string) => {
      const { data, error } = await edenClient.api.knowledge.collections.get({
        query: { org_id }
      });
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * Get collection by ID
     */
    getCollection: async (id: string) => {
      const { data, error } = await edenClient.api.knowledge.collections({ id }).get();
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * List resources in a collection
     */
    listResources: async (params: {
      org_id?: string;
      user_id?: string;
      collection_id?: string;
    }) => {
      const { data, error } = await edenClient.api.knowledge.resources.get({
        query: params
      });
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * Generate chat response with RAG context
     */
    chat: async (params: {
      messages: Array<{ role: string; content: string }>;
      org_id?: string;
      options?: {
        stream?: boolean;
        model?: string;
        temperature?: number;
      };
    }) => {
      const { data, error } = await edenClient.api.knowledge.chat.post(params);
      if (error) throw new Error(error.value as string);
      return data;
    }
  },

  /**
   * Collective Service (AgentX)
   * Multi-agent orchestration and chat
   */
  collective: {
    /**
     * Send a chat message through the collective
     */
    chat: async (params: {
      messages: any[];
      userEmail: string;
      orgSlug: string;
      options?: {
        stream?: boolean;
        model?: string;
      };
    }) => {
      const { data, error } = await edenClient.api.collective.chat.post(params);
      if (error) throw new Error(error.value as string);
      return data;
    }
  },

  /**
   * Identity Service (AgentX)
   * Organization and user identity management
   */
  identity: {
    /**
     * Get system instructions
     */
    getInstructions: async () => {
      const { data, error } = await edenClient.api.identity.instructions.get();
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * Save system instructions
     */
    saveInstructions: async (content: string) => {
      const { data, error } = await edenClient.api.identity.instructions.post({
        content
      });
      if (error) throw new Error(error.value as string);
      return data;
    }
  },

  /**
   * Authentication Service
   * User registration, login, and session management
   */
  auth: {
    /**
     * Register a new user
     */
    register: async (email: string, password: string, name: string, role?: string, organizationSlug?: string) => {
      const { data, error } = await edenClient.api.auth.register.post({
        email,
        password,
        name,
        role,
        organizationSlug
      });
      if (error) return { success: false, error: error.value };
      return data; // { success: true, accessToken, user }
    },

    /**
     * Login with credentials
     */
    login: async (email: string, password: string) => {
      const { data, error } = await edenClient.api.auth.login.post({
        email,
        password
      });
      if (error) return { success: false, error: error.value };
      return data; // { success: true, accessToken, user }
    },

    /**
     * Get current user info
     */
    me: async () => {
      const token = localStorage.getItem('bree_jwt');
      if (!token) return { success: false, error: 'No token' };

      const { data, error } = await edenClient.api.auth.me.get({
        headers: { authorization: `Bearer ${token}` }
      });
      if (error) return { success: false, error: error.value };
      return data;
    },

    /**
     * Refresh token
     */
    refresh: async () => {
      const token = localStorage.getItem('bree_jwt');
      if (!token) return { success: false, error: 'No token' };

      const { data, error } = await edenClient.api.auth.refresh.post(
        {}, 
        { headers: { authorization: `Bearer ${token}` } }
      );
      if (error) return { success: false, error: error.value };
      return data;
    }
  },

  /**
   * Agents Service (NATS)
   * AI Agents (grapes) discovery and communication
   */
  agents: {
    /**
     * Discover all connected agents
     */
    discover: async (): Promise<{ success: boolean; count: number; agents: AgentInfo[] }> => {
      const { data, error } = await edenClient.api.agents.get();
      if (error) throw new Error(error.value as string);
      return data as any;
    },

    /**
     * Get specific agent status
     */
    getStatus: async (agentId: string) => {
      const { data, error } = await edenClient.api.agents({ id: agentId }).get();
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * Send message to an agent
     */
    sendMessage: async (agentId: string, content: string, metadata?: Record<string, any>) => {
      const { data, error } = await edenClient.api.agents({ id: agentId }).message.post({
        content,
        metadata
      });
      if (error) throw new Error(error.value as string);
      return data;
    }
  },

  /**
   * Configuration Service
   * Brand-specific configuration stored in AgentX
   */
  config: {
    /**
     * Get configuration for a brand
     */
    get: async (brandId: string) => {
      const { data, error } = await edenClient.api.config({ brandId }).get();
      if (error) throw new Error(error.value as string);
      return data;
    },

    /**
     * Save configuration for a brand
     */
    save: async (brandId: string, config: any) => {
      const { data, error } = await edenClient.api.config({ brandId }).post(config);
      if (error) throw new Error(error.value as string);
      return data;
    }
  },

  /**
   * OpenAI Proxy Service
   * Routes through the API gateway with auth
   */
  openai: {
    /**
     * Chat completion via proxy
     */
    chat: async (params: {
      query: string;
      context: string;
      options?: {
        model?: string;
        temperature?: number;
        max_tokens?: number;
        systemPrompt?: string;
      };
    }) => {
      const token = localStorage.getItem('bree_jwt');
      const response = await fetch(`${API_URL}/api/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },

    /**
     * Text-to-speech via proxy
     */
    tts: async (params: {
      text: string;
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      speed?: number;
    }) => {
      const token = localStorage.getItem('bree_jwt');
      const response = await fetch(`${API_URL}/api/openai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error(await response.text());
      return response.blob();
    },

    /**
     * Speech-to-text via proxy
     */
    stt: async (file: File) => {
      const token = localStorage.getItem('bree_jwt');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/openai/stt`, {
        method: 'POST',
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }
  }
};

/**
 * Default export for convenience
 */
export default breeAPI;
