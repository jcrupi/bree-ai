/**
 * React hook for NATS WebSocket Bridge
 * 
 * Use this instead of useNats when connecting via the bridge server
 * 
 * Usage:
 *   const { status, publish, request, subscribe } = useNatsBridge('ws://localhost:3001');
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface NatsBridgeClient {
  publish(subject: string, data: any): void;
  subscribe(subject: string, callback: (data: any) => void): () => void;
  request(subject: string, data: any, timeout?: number): Promise<any>;
  isConnected(): boolean;
  close(): void;
}

class NatsBridgeClientImpl implements NatsBridgeClient {
  private ws: WebSocket;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private requestCallbacks: Map<string, { resolve: (data: any) => void; reject: (err: any) => void }> = new Map();
  private requestIdCounter = 0;
  private connected = false;
  private onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;

  constructor(bridgeUrl: string, onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void) {
    this.onStatusChange = onStatusChange;
    this.onStatusChange?.('connecting');
    this.ws = new WebSocket(bridgeUrl);
    this.setupMessageHandler();
  }

  private setupMessageHandler() {
    this.ws.onopen = () => {
      this.connected = true;
      this.onStatusChange?.('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'connected') {
          this.connected = true;
          this.onStatusChange?.('connected');
        } else if (msg.type === 'message') {
          // Handle subscribed messages
          const handlers = this.messageHandlers.get(msg.subject);
          if (handlers) {
            handlers.forEach((h) => h(msg.data));
          }
          // Also check wildcard handlers
          this.messageHandlers.forEach((handlers, pattern) => {
            if (this.matchSubject(msg.subject, pattern)) {
              handlers.forEach((h) => h(msg.data));
            }
          });
        } else if (msg.type === 'response' || msg.type === 'error') {
          // Handle request/response
          const callback = this.requestCallbacks.get(msg.id);
          if (callback) {
            if (msg.type === 'error') {
              callback.reject(new Error(msg.error));
            } else {
              callback.resolve(msg.data);
            }
            this.requestCallbacks.delete(msg.id);
          }
        }
      } catch (err) {
        console.error('Error parsing bridge message:', err);
      }
    };

    this.ws.onerror = () => {
      this.onStatusChange?.('error');
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.onStatusChange?.('disconnected');
    };
  }

  private matchSubject(subject: string, pattern: string): boolean {
    // Simple wildcard matching: ">" matches everything, "*" matches single token
    if (pattern === '>') return true;
    const subjectParts = subject.split('.');
    const patternParts = pattern.split('.');
    
    if (patternParts.length > subjectParts.length) return false;
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '>') return true;
      if (patternParts[i] === '*') continue;
      if (patternParts[i] !== subjectParts[i]) return false;
    }
    
    return patternParts.length === subjectParts.length;
  }

  private sendMessage(msg: any): void {
    if (!this.connected || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to bridge');
    }
    this.ws.send(JSON.stringify(msg));
  }

  publish(subject: string, data: any): void {
    const id = `pub-${++this.requestIdCounter}`;
    this.sendMessage({
      type: 'publish',
      id,
      subject,
      payload: data,
    });
  }

  subscribe(subject: string, callback: (data: any) => void): () => void {
    const id = `sub-${++this.requestIdCounter}`;
    
    // Add callback to handlers
    if (!this.messageHandlers.has(subject)) {
      this.messageHandlers.set(subject, new Set());
      // Send subscribe message to bridge
      this.sendMessage({
        type: 'subscribe',
        id,
        subject,
      });
    }
    
    this.messageHandlers.get(subject)!.add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(subject);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.messageHandlers.delete(subject);
          // Send unsubscribe message to bridge
          this.sendMessage({
            type: 'unsubscribe',
            id: `unsub-${++this.requestIdCounter}`,
            subject,
          });
        }
      }
    };
  }

  async request(subject: string, data: any, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `req-${++this.requestIdCounter}`;
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.requestCallbacks.delete(id);
        reject(new Error('Request timeout'));
      }, timeout);

      // Store callback
      this.requestCallbacks.set(id, {
        resolve: (responseData: any) => {
          clearTimeout(timeoutId);
          resolve(responseData);
        },
        reject: (err: any) => {
          clearTimeout(timeoutId);
          reject(err);
        },
      });

      // Send request
      this.sendMessage({
        type: 'request',
        id,
        subject,
        payload: data,
        timeout,
      });
    });
  }

  isConnected(): boolean {
    return this.connected && this.ws.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.ws.close();
  }
}

export function useNatsBridge(
  bridgeUrl: string = 'ws://localhost:3001'
): {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  publish: (subject: string, data: any) => void;
  request: (subject: string, data: any, timeout?: number) => Promise<any>;
  subscribe: (subject: string, callback: (data: any) => void) => () => void;
  client: NatsBridgeClient | null;
} {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const clientRef = useRef<NatsBridgeClientImpl | null>(null);

  useEffect(() => {
    const client = new NatsBridgeClientImpl(bridgeUrl, setStatus);
    clientRef.current = client;

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [bridgeUrl]);

  const publish = useCallback((subject: string, data: any) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.publish(subject, data);
    } else {
      console.warn('NATS bridge not connected, cannot publish');
    }
  }, []);

  const request = useCallback(async (subject: string, data: any, timeout: number = 5000) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      return clientRef.current.request(subject, data, timeout);
    } else {
      throw new Error('NATS bridge not connected');
    }
  }, []);

  const subscribe = useCallback((subject: string, callback: (data: any) => void) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      return clientRef.current.subscribe(subject, callback);
    } else {
      console.warn('NATS bridge not connected, cannot subscribe');
      return () => {}; // Return no-op unsubscribe
    }
  }, []);

  return {
    status,
    publish,
    request,
    subscribe,
    client: clientRef.current,
  };
}
