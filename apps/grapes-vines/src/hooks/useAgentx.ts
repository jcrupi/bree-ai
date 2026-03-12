import { useState, useEffect, useCallback, useRef } from 'react';

export interface AgentxLog {
  level: string;
  message: string;
  timestamp: string;
  data?: any;
  agentId: string;
}

interface UseAgentxOptions {
  agentId: string | null;
  apiUrl?: string;
  onLog?: (log: AgentxLog) => void;
  onError?: (error: Error) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useAgentx({
  agentId,
  apiUrl = `${API_BASE_URL}/api/agents`,
  onLog,
  onError
}: UseAgentxOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<AgentxLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  const onLogRef = useRef(onLog);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLogRef.current = onLog;
    onErrorRef.current = onError;
  }, [onLog, onError]);

  const connect = useCallback(() => {
    if (!agentId) return;

    try {
      if (wsRef.current) {
        if (wsRef.current.url.includes(`/api/agents/${agentId}/ws`) && 
            (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
          return;
        }
        wsRef.current.close();
      }

      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/api/agents/${agentId}/ws`;
      console.log('🔌 Connecting to Agentx WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Agentx WebSocket connection established');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log(`🍇 Connected to Grape: ${data.agentId}`);
            const logMsg = {
              level: 'info',
              message: data.message || 'Connected successfully',
              timestamp: new Date().toISOString(),
              agentId: data.agentId
            };
            setLogs(prev => [...prev, logMsg]);
          } else if (data.type === 'error') {
            const err = new Error(data.message);
            setIsConnected(false);
            onErrorRef.current?.(err);
            setLogs(prev => [...prev, { level: 'error', message: data.message, timestamp: new Date().toISOString(), agentId }]);
          } else if (data.type === 'log' || data.type === 'lifecycle') {
            // Transform NATS message payload to a log
            const logMsg: AgentxLog = {
              level: data.level || (data.type === 'lifecycle' ? 'system' : 'info'),
              message: data.message || JSON.stringify(data.data || data),
              timestamp: data.timestamp || new Date().toISOString(),
              agentId,
              data: data.data || data
            };
            setLogs(prev => [...prev, logMsg]);
            onLogRef.current?.(logMsg);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Agentx WebSocket connection closed');
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        console.error('❌ Agentx WebSocket error:', err);
        setIsConnected(false);
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      onErrorRef.current?.(err as Error);
    }
  }, [agentId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendCommand = useCallback((action: string, payload?: any) => {
    if (!agentId) throw new Error('No active agent');
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        action,
        payload
      }));
      // Echo the command in our logs locally
      setLogs(prev => [...prev, {
        level: 'cmd',
        message: `> ${action} ${payload ? JSON.stringify(payload) : ''}`,
        timestamp: new Date().toISOString(),
        agentId
      }]);
      return true;
    }
    throw new Error('WebSocket is not connected');
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [agentId, connect, disconnect]);

  const clearLogs = () => setLogs([]);

  return {
    isConnected,
    logs,
    sendCommand,
    clearLogs,
    reconnect: connect,
    disconnect
  };
}
