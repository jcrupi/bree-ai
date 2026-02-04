/**
 * The Collective Utility
 * All KAT.ai calls should ideally route through this orchestrator.
 */

const COLLECTIVE_URL = import.meta.env.VITE_AGENTX_URL || import.meta.env.VITE_COLLECTIVE_URL || 'http://localhost:9000';

// Direct import to bypass collective hub issues for testing
import { generateChatResponse } from './ragster';

export async function collectiveChat(params: {
  messages: any[];
  userEmail: string;
  orgSlug: string;
  options?: any;
}) {
  // Direct routed to Ragster for debugging UI
  try {
      const result = await generateChatResponse(params.messages, params.options);
      return { role: 'assistant', content: result };
  } catch (err: any) {
     console.error("Direct Ragster Chat failed, trying collective...", err);
     
      const response = await fetch(`${COLLECTIVE_URL}/api/collective/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Collective chat failed');
      }
      
      return response.json();
  }
}

/**
 * Proxy for Identity calls through the Collective
 */
export const identity = {
  listOrgs: async () => {
    const res = await fetch(`${COLLECTIVE_URL}/api/antimatterdb/list?dir=orgs`); // Updated to agent identity
    return res.json();
  },
  getInstructions: async () => {
    const res = await fetch(`${COLLECTIVE_URL}/api/identity/entries?path=config/instructions.md`);
    const data = await res.json();
    return data.success ? data.data.content : null;
  },
  saveInstructions: async (content: string) => {
    const res = await fetch(`${COLLECTIVE_URL}/api/identity/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'config/instructions.md',
        content,
        frontMatter: {
          type: 'config',
          updatedAt: new Date().toISOString()
        }
      })
    });
    return res.json();
  }
};

/**
 * Proxy for Knowledge calls through the Collective
 */
export const knowledge = {
  listCollections: async () => {
    const res = await fetch(`${COLLECTIVE_URL}/api/ragster/collections`); // Updated to agent identity
    return res.json();
  },
  uploadDocument: async (params: {
    file: File;
    collection: string;
    orgId?: string;
    userId?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('collection', params.collection);
    if (params.orgId) formData.append('orgId', params.orgId);
    if (params.userId) formData.append('userId', params.userId);

    const res = await fetch(`${COLLECTIVE_URL}/api/ragster/upload`, { // Updated to agent identity
      method: 'POST',
      body: formData,
    });
    return res.json();
  }
};
