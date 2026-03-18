/**
 * crazy-weeks persistence service
 * Saves tech tasks, biz notes, and marketing notes per calendar week
 * as AgentX markdown files: crazy-weeks/YYYY-MM-DD/{tech,biz,marketing}.agentx.md
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

/** Returns YYYY-MM-DD of the Monday of the current week (client-side) */
export function currentWeekKey(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export type WeekTab = 'tech' | 'biz' | 'marketing';

export interface WeekData {
  week: string;
  tech: string | null;
  biz: string | null;
  marketing: string | null;
}

/** Load all three tabs for the current week at once */
export async function loadCurrentWeek(): Promise<WeekData> {
  try {
    const res = await fetch(`${API_BASE}/api/crazy-weeks/current`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { week: currentWeekKey(), tech: null, biz: null, marketing: null };
    return await res.json();
  } catch {
    return { week: currentWeekKey(), tech: null, biz: null, marketing: null };
  }
}

/** Save a single tab's content for the current week */
export async function saveWeekTab(tab: WeekTab, content: string): Promise<void> {
  const week = currentWeekKey();
  await fetch(`${API_BASE}/api/crazy-weeks/${week}/${tab}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
}

// ── Legacy shim for LeadNotesTab (biz / marketing) ──────────────────────────
// Keeps the same interface as the old leadNotes.ts so LeadNotesTab needs no changes

export interface LeadNotesData {
  bizText?: string;
  marketingText?: string;
  salesText?: string;
}

export async function loadLeadNotes(): Promise<LeadNotesData> {
  const data = await loadCurrentWeek();
  return {
    bizText: data.biz ?? '',
    marketingText: data.marketing ?? '',
    salesText: '',
  };
}

export async function saveLeadNotes(notes: LeadNotesData): Promise<void> {
  if (notes.bizText !== undefined) await saveWeekTab('biz', notes.bizText);
  if (notes.marketingText !== undefined) await saveWeekTab('marketing', notes.marketingText);
  // salesText not yet backed by a dedicated API tab — no-op for now
}
