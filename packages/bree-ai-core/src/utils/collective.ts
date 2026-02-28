import { API_URL } from './api-client';

export async function collectiveChat(params: {
  messages: any[];
  userEmail: string;
  orgSlug: string;
  options?: any;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bree_jwt') : null;
  const response = await fetch(`${API_URL}/api/collective/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Collective chat failed');
  }

  return response.json();
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
