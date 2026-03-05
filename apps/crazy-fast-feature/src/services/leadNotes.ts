/**
 * LeadNotes — persists Biz and Marketing text via bree-api /api/config/:brandId
 */

const BRAND_ID = 'crazy-fast-feature';
const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export interface LeadNotesData {
  bizText?: string;
  marketingText?: string;
}

export async function loadLeadNotes(): Promise<LeadNotesData> {
  try {
    const res = await fetch(`${API_BASE}/api/config/${BRAND_ID}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      bizText: data.bizText ?? '',
      marketingText: data.marketingText ?? '',
    };
  } catch {
    return {};
  }
}

export async function saveLeadNotes(notes: LeadNotesData): Promise<void> {
  // Merge with any existing config keys so we don't blow away task settings
  const existing = await loadLeadNotes();
  await fetch(`${API_BASE}/api/config/${BRAND_ID}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...existing, ...notes }),
  });
}
