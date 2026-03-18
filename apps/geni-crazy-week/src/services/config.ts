import { API_BASE, authHeaders } from './apiConfig';

export interface AppConfig {
  showSplashScreen: boolean;
  requireSecurityCode: boolean;
  securityCode: string;
  showBubbles: boolean;
  showSyncLinear: boolean;
  enabledTabs: {
    biz: boolean;
    marketing: boolean;
    sales: boolean;
    news: boolean;
  };
  enabledProducts: string[];
  aiSuggestions: string[];
}

export const DEFAULT_CONFIG: AppConfig = {
  showSplashScreen: false,
  requireSecurityCode: false,
  securityCode: '2026',
  showBubbles: true,
  showSyncLinear: true,
  enabledTabs: {
    biz: true,
    marketing: true,
    sales: true,
    news: true,
  },
  enabledProducts: ['Wound AI', 'Performance AI', 'Extraction AI'],
  aiSuggestions: [
    'Which tasks are about wounds?',
    'Show me pending tasks',
    'What are the highest priority bugs?',
    'Which tasks are assigned to Alex?',
    'Summarize this sprint',
  ],
};

export async function loadConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${API_BASE}/api/geni-crazy-weeks/global/config`, {
      headers: authHeaders(),
    });
    if (!res.ok) return DEFAULT_CONFIG;
    const data = await res.json();
    return data.config ? { ...DEFAULT_CONFIG, ...data.config } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fetch(`${API_BASE}/api/geni-crazy-weeks/global/config`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ config }),
  });
}
