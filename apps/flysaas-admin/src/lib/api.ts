/**
 * FlySaaS API Client
 * Centralized API communication with authentication
 */

import type {
  Contact,
  Deal,
  Organization,
  AIGenerationRequest,
  AIGenerationResponse,
  Feature
} from '@bree-ai/flysaas-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7800';
const CLIENT_API_URL = import.meta.env.VITE_CLIENT_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('flysaas_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('flysaas_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('flysaas_token');
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signUp(email: string, password: string, name: string) {
    return this.request<{ user: any }>(`${API_URL}/auth/sign-up`, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async signIn(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>(`${API_URL}/auth/sign-in`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async signOut() {
    this.clearToken();
  }

  // Organizations
  async getOrganizations() {
    return this.request<{ organizations: Organization[] }>(`${API_URL}/api/orgs`);
  }

  async getOrganization(slug: string) {
    return this.request<{ organization: Organization }>(`${API_URL}/api/orgs/${slug}`);
  }

  async createOrganization(org_slug: string, org_name: string, region?: string) {
    return this.request<{ organization: Organization; fly_url: string }>(`${API_URL}/api/orgs`, {
      method: 'POST',
      body: JSON.stringify({ org_slug, org_name, region }),
    });
  }

  // Contacts (Core)
  async getCoreContacts() {
    return this.request<{ contacts: Contact[] }>(`${API_URL}/api/core/contacts`);
  }

  async createCoreContact(data: Partial<Contact>) {
    return this.request<{ contact: Contact }>(`${API_URL}/api/core/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoreContact(id: string, data: Partial<Contact>) {
    return this.request<{ contact: Contact }>(`${API_URL}/api/core/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCoreContact(id: string) {
    return this.request<{ success: boolean }>(`${API_URL}/api/core/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Deals (Core)
  async getCoreDeals() {
    return this.request<{ deals: Deal[] }>(`${API_URL}/api/core/deals`);
  }

  async createCoreDeal(data: Partial<Deal>) {
    return this.request<{ deal: Deal }>(`${API_URL}/api/core/deals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoreDeal(id: string, data: Partial<Deal>) {
    return this.request<{ deal: Deal }>(`${API_URL}/api/core/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCoreDeal(id: string) {
    return this.request<{ success: boolean }>(`${API_URL}/api/core/deals/${id}`, {
      method: 'DELETE',
    });
  }

  // Client Org Contacts
  async getClientContacts() {
    return this.request<{ contacts: Contact[] }>(`${CLIENT_API_URL}/api/contacts`);
  }

  async createClientContact(data: Partial<Contact>) {
    return this.request<{ contact: Contact }>(`${CLIENT_API_URL}/api/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Client Org Deals
  async getClientDeals() {
    return this.request<{ deals: Deal[] }>(`${CLIENT_API_URL}/api/deals`);
  }

  async createClientDeal(data: Partial<Deal>) {
    return this.request<{ deal: Deal }>(`${CLIENT_API_URL}/api/deals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Features
  async generateFeature(prompt: string) {
    return this.request<AIGenerationResponse>(`${CLIENT_API_URL}/api/ai/generate`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async getFeatures() {
    return this.request<{ features: Feature[] }>(`${CLIENT_API_URL}/api/ai/features`);
  }

  async getFeature(id: string) {
    return this.request<{ feature: Feature }>(`${CLIENT_API_URL}/api/ai/features/${id}`);
  }

  async toggleFeature(id: string, enabled: boolean) {
    return this.request<{ feature: Feature }>(`${CLIENT_API_URL}/api/ai/features/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }
}

export const api = new ApiClient();
