import { useState, useEffect, useCallback, useRef } from 'react';
import { useVillageVine } from './useVillageVine';

export interface VillageMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  vineId: string;
}

interface UseSaveCandidateConversationOptions {
  vineId: string | null;
  userName?: string;
  apiUrl?: string;
  /** Load persisted history on mount. Default true. */
  loadHistory?: boolean;
  onMessage?: (message: VillageMessage) => void;
  onError?: (error: Error) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hook that wraps useVillageVine and enriches it with persisted conversation history.
 * Messages are automatically saved to the database by the API when sent.
 * This hook loads persisted history on mount and merges with real-time messages.
 */
export function useSaveCandidateConversation({
  vineId,
  userName = 'You',
  apiUrl = `${API_BASE_URL}/api/village`,
  loadHistory = true,
  onMessage,
  onError
}: UseSaveCandidateConversationOptions) {
  const [persistedMessages, setPersistedMessages] = useState<VillageMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const historyLoadedRef = useRef(false);

  const vine = useVillageVine({
    vineId,
    userName,
    apiUrl,
    onMessage,
    onError
  });

  const fetchPersistedHistory = useCallback(async () => {
    if (!vineId || !loadHistory) {
      setHistoryLoaded(true);
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('bree_jwt');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/${vineId}/messages?limit=500`, { headers });
      const data = await res.json();

      if (data.success && Array.isArray(data.messages)) {
        setPersistedMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
            timestamp: m.timestamp,
            vineId: m.vineId || vineId
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load conversation history:', err);
    } finally {
      setHistoryLoaded(true);
      historyLoadedRef.current = true;
    }
  }, [vineId, loadHistory, apiUrl]);

  useEffect(() => {
    if (vineId && loadHistory && !historyLoadedRef.current) {
      fetchPersistedHistory();
    }
  }, [vineId, loadHistory, fetchPersistedHistory]);

  // Merge persisted history with real-time messages, deduplicating by content+sender+timestamp
  const messages = (() => {
    if (!historyLoaded) {
      return vine.messages;
    }
    const seen = new Set<string>();
    const key = (m: VillageMessage) => `${m.sender}|${m.content}|${m.timestamp}`;
    const merged: VillageMessage[] = [];

    for (const m of persistedMessages) {
      const k = key(m);
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(m);
      }
    }
    for (const m of vine.messages) {
      const k = key(m);
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(m);
      }
    }
    merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return merged;
  })();

  return {
    ...vine,
    messages,
    historyLoaded,
    reloadHistory: fetchPersistedHistory
  };
}
