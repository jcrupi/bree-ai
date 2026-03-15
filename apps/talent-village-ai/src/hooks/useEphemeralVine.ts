import { useState, useEffect, useCallback, useRef } from 'react';

interface EphemeralMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

interface UseEphemeralVineOptions {
  vineId: string | null;
  userName?: string;
  apiUrl?: string;
  onMessage?: (message: EphemeralMessage) => void;
  onError?: (error: Error) => void;
}

// Realtime base for WebSocket connections
const REALTIME_BASE_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:3001';

/**
 * Custom hook for ephemeral (no-history) messaging using NATS
 * Messages are NOT persisted - they only exist in real-time and are removed when pulled/pushed
 * Perfect for temporary, secure conversations like FatZero-ai
 */
export function useEphemeralVine({
  vineId,
  userName = 'Anonymous',
  apiUrl = `${REALTIME_BASE_URL}/api/village`,
  onMessage,
  onError
}: UseEphemeralVineOptions) {

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<EphemeralMessage[]>([]);
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

      const wsUrl = REALTIME_BASE_URL.replace(/^http/, 'ws') + `/api/village/${vineId}/ws?name=${encodeURIComponent(userName)}`;

      console.log('🔌 [FatZero] Connecting to ephemeral WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [FatZero] Ephemeral connection established - NO HISTORY MODE');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('🌿 [FatZero] Connected to ephemeral vine:', data.vineId);
          } else if (data.type === 'error') {
            console.error('❌ [FatZero] Server error:', data.message);
            setIsConnected(false);
            onErrorRef.current?.(new Error(data.message));
          } else if (data.type === 'message') {
            const message: EphemeralMessage = {
              id: data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              sender: data.sender,
              content: data.content,
              timestamp: data.timestamp
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
          console.error('[FatZero] Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 [FatZero] Ephemeral connection closed - messages cleared');
        setIsConnected(false);

        // Clear messages on disconnect (ephemeral nature)
        setMessages([]);

        // Attempt reconnection after 5 seconds if still on this vine
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current === ws) {
            console.log('🔄 [FatZero] Attempting to reconnect...');
            connect();
          }
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error('❌ [FatZero] WebSocket error:', err);
        setIsConnected(false);
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };

    } catch (err) {
      console.error('[FatZero] Failed to establish WebSocket connection:', err);
      onErrorRef.current?.(err as Error);
    }
  }, [vineId, userName]);

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
      const message: EphemeralMessage = {
        id: `opt-${Date.now()}`,
        sender,
        content,
        timestamp: new Date().toISOString()
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
      const message: EphemeralMessage = {
        id: `opt-${Date.now()}`,
        sender,
        content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, message]);

      return result;
    } catch (err) {
      console.error('[FatZero] Failed to send message via HTTP:', err);
      throw err;
    }
  }, [vineId, apiUrl]);

  // Create new ephemeral vine
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
      console.error('[FatZero] Failed to create vine:', err);
      throw err;
    }
  }, [apiUrl]);

  // Clear all messages manually (useful for "clear chat" functionality)
  const clearMessages = useCallback(() => {
    setMessages([]);
    console.log('🗑️ [FatZero] Messages cleared manually');
  }, []);

  // Connect when vineId changes - NO history loading
  useEffect(() => {
    if (vineId) {
      setMessages([]); // Start fresh, no history
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Clear messages on unmount (ephemeral)
      setMessages([]);
    };
  }, [vineId, connect]);

  return {
    isConnected,
    messages,
    sendMessage,
    createVine,
    clearMessages,
    reconnect: connect
  };
}
