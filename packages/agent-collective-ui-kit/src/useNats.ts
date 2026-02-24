import { useState, useEffect, useRef, useCallback } from 'react';
import { connect, JSONCodec, type NatsConnection } from 'nats.ws';

export interface NatsLog {
  timestamp: string;
  subject: string;
  data: any;
}

export function useNats(serverUrl: string = "ws://localhost:9222") {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const ncRef = useRef<NatsConnection | null>(null);
  const jc = JSONCodec();

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        setStatus('connecting');
        const nc = await connect({ servers: serverUrl });
        if (!active) {
            await nc.close();
            return;
        }
        ncRef.current = nc;
        setStatus('connected');
      } catch (err) {
        console.error("NATS Connection Error", err);
        setStatus('error');
      }
    };

    init();
    return () => {
      active = false;
      if (ncRef.current) {
        ncRef.current.close().catch(() => {});
        ncRef.current = null;
      }
    };
  }, [serverUrl]);

  const request = useCallback(async (subject: string, data: any = {}, timeout: number = 5000) => {
    if (!ncRef.current) throw new Error("NATS not connected");
    const msg = await ncRef.current.request(subject, jc.encode(data), { timeout });
    return jc.decode(msg.data);
  }, []);

  const publish = useCallback((subject: string, data: any = {}) => {
    if (!ncRef.current) throw new Error("NATS not connected");
    ncRef.current.publish(subject, jc.encode(data));
  }, []);

  return { status, request, publish, nc: ncRef.current };
}

export function useNatsLog(serverUrl: string, subject: string = ">", paused: boolean = false, enabled: boolean = true) {
  const [logs, setLogs] = useState<NatsLog[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const pausedRef = useRef(paused);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (!enabled) {
        setStatus('disconnected');
        return;
    }

    let nc: NatsConnection;
    const connectNats = async () => {
       try {
         setStatus('connecting');
         nc = await connect({ servers: serverUrl });
         setStatus('connected');
         
         const jc = JSONCodec();
         const sub = nc.subscribe(subject);
         
         (async () => {
            for await (const m of sub) {
                if (pausedRef.current) continue;
                try {
                    const decoded = jc.decode(m.data);
                    setLogs(prev => [{
                        timestamp: new Date().toLocaleTimeString(),
                        subject: m.subject,
                        data: decoded
                    }, ...prev].slice(0, 100));
                } catch (e) {
                    // Ignore
                }
            }
         })();
       } catch (err) {
         console.error("NATS Connection Error", err);
         setStatus('error');
       }
    };
    
    connectNats();
    return () => { 
        if (nc) {
            nc.close().catch(() => {});
        }
        setStatus('disconnected'); 
    };
  }, [serverUrl, subject, enabled]);

  return { logs, status, setLogs };
}
