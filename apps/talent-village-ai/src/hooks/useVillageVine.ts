import { useState, useEffect, useCallback, useRef } from 'react';

interface VillageMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  vineId: string;
}

interface UseVillageVineOptions {
  vineId: string | null;
  userName?: string;
  apiUrl?: string;
  onMessage?: (message: VillageMessage) => void;
  onError?: (error: Error) => void;
}


// REST API base (bree-api) — used for createVine, HTTP fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Realtime base (bree-api-realtime) — used for WebSocket connections
const REALTIME_BASE_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:3001';

/**
 * Custom hook for real-time Village Vine messaging using NATS
 * Connects to the backend API and subscribes to message streams
 */
export function useVillageVine({
  vineId,
  userName = 'You',
  apiUrl = `${REALTIME_BASE_URL}/api/village`,
  onMessage,
  onError
}: UseVillageVineOptions) {

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<VillageMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Refs for callbacks to avoid re-running effects when they change
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  // Subscribe to NATS message stream via WebSocket
  const connect = useCallback(() => {
    if (!vineId) return;

    try {
      // Close existing connection if it's not the same URL or if it's already closed
      if (wsRef.current) {
        if (wsRef.current.url.includes(`/api/village/${vineId}/ws`) && 
            (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
          return; // Already connecting or connected to this vine
        }
        wsRef.current.close();
      }

      // Determine WS protocol — always use REALTIME_BASE_URL (bree-api-realtime handles /api/village WebSockets)
      const wsUrl = REALTIME_BASE_URL.replace(/^http/, 'ws') + `/api/village/${vineId}/ws?name=${encodeURIComponent(userName)}`;

      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Village Vine WebSocket connection established');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('🌿 Connected to Village Vine:', data.vineId);
          } else if (data.type === 'error') {
            console.error('❌ Server error:', data.message);
            setIsConnected(false);
            onErrorRef.current?.(new Error(data.message));
          } else if (data.type === 'message') {
            const message: VillageMessage = {
              id: data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              sender: data.sender,
              content: data.content,
              timestamp: data.timestamp,
              vineId: data.vineId
            };
            
            setMessages(prev => {
              // Check for duplicates (especially from optimistic UI)
              const isDuplicate = prev.some(m => 
                m.sender === message.sender && 
                m.content === message.content && 
                Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000
              );
              
              if (isDuplicate) return prev;
              return [...prev, message];
            });
            onMessageRef.current?.(message);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Village Vine WebSocket connection closed');
        setIsConnected(false);
        
        // Attempt reconnection after 5 seconds if still on this vine
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current === ws) {
            console.log('🔄 Attempting to reconnect WebSocket...');
            connect();
          }
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error('❌ Village Vine WebSocket error:', err);
        setIsConnected(false);
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };

    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      onErrorRef.current?.(err as Error);
    }
  }, [vineId]);

  // Load history from JetStream via REST on mount / vineId change
  const fetchHistory = useCallback(async () => {
    if (!vineId) return;
    try {
      const res = await fetch(`${REALTIME_BASE_URL}/api/village/${vineId}/messages?limit=500`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        const historical: VillageMessage[] = data.messages.map((m: any) => ({
          id: m.id || `hist-${m.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp,
          vineId: m.vineId || vineId,
        }));
        setMessages(prev => {
          // Merge: history first, then deduplicate against live messages already in state
          const existingIds = new Set(prev.map(m => m.id));
          const newHistorical = historical.filter(m => !existingIds.has(m.id));
          return [...newHistorical, ...prev];
        });
      }
    } catch (err) {
      console.warn('Could not load vine history:', err);
    } finally {
      setHistoryLoaded(true);
    }
  }, [vineId]);

  // Send message via WebSocket or HTTP fallback
  const sendMessage = useCallback(async (sender: string, content: string) => {
    if (!vineId) {
      throw new Error('No active vine');
    }

    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        sender,
        content
      }));

      // Add message to local state immediately for optimistic UI
      const message: VillageMessage = {
        id: `opt-${Date.now()}`,
        sender,
        content,
        timestamp: new Date().toISOString(),
        vineId
      };
      
      setMessages(prev => [...prev, message]);
      return { success: true };
    }

    // Fallback to HTTP POST if WS is not available
    try {
      const response = await fetch(`${apiUrl}/${vineId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender, content })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Add message to local state immediately for optimistic UI
      const message: VillageMessage = {
        id: `opt-${Date.now()}`,
        sender,
        content,
        timestamp: new Date().toISOString(),
        vineId
      };
      
      setMessages(prev => [...prev, message]);
      
      return result;
    } catch (err) {
      console.error('Failed to send message via HTTP:', err);
      throw err;
    }
  }, [vineId, apiUrl]);

  // Create new village vine
  const createVine = useCallback(async (topic: string, invited: string[]) => {
    try {
      const response = await fetch(`${apiUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, invited })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create vine');
      }

      return result;
    } catch (err) {
      console.error('Failed to create vine:', err);
      throw err;
    }
  }, [apiUrl]);

  // Connect and load history when vineId changes
  useEffect(() => {
    if (vineId) {
      setHistoryLoaded(false);
      setMessages([]);
      fetchHistory();
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [vineId, connect, fetchHistory]);

  return {
    isConnected,
    historyLoaded,
    messages,
    sendMessage,
    createVine,
    reconnect: connect
  };
}
