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
  apiUrl?: string;
  onMessage?: (message: VillageMessage) => void;
  onError?: (error: Error) => void;
}

// Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Custom hook for real-time Village Vine messaging using NATS
 * Connects to the backend API and subscribes to message streams
 */
export function useVillageVine({
  vineId,
  apiUrl = `${API_BASE_URL}/api/village`,
  onMessage,
  onError
}: UseVillageVineOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<VillageMessage[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Subscribe to NATS message stream via SSE
  const connect = useCallback(() => {
    if (!vineId) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource connection
      const eventSource = new EventSource(`${apiUrl}/${vineId}/events`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Village Vine NATS connection established');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('🌿 Connected to Village Vine:', data.vineId);
          } else if (data.type === 'message') {
            const message: VillageMessage = {
              id: data.id || Date.now().toString(),
              sender: data.sender,
              content: data.content,
              timestamp: data.timestamp,
              vineId: data.vineId
            };
            
            setMessages(prev => [...prev, message]);
            onMessage?.(message);
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ Village Vine connection error:', err);
        setIsConnected(false);
        eventSource.close();
        
        // Attempt reconnection after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
        
        onError?.(new Error('Connection lost'));
      };

    } catch (err) {
      console.error('Failed to establish connection:', err);
      onError?.(err as Error);
    }
  }, [vineId, apiUrl, onMessage, onError]);

  // Send message via NATS
  const sendMessage = useCallback(async (sender: string, content: string) => {
    if (!vineId) {
      throw new Error('No active vine');
    }

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
        id: Date.now().toString(),
        sender,
        content,
        timestamp: new Date().toISOString(),
        vineId
      };
      
      setMessages(prev => [...prev, message]);
      
      return result;
    } catch (err) {
      console.error('Failed to send message:', err);
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

  // Connect when vineId changes
  useEffect(() => {
    if (vineId) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [vineId, connect]);

  return {
    isConnected,
    messages,
    sendMessage,
    createVine,
    reconnect: connect
  };
}
