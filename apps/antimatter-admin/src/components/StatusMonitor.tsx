import React, { useState, useEffect } from 'react';
import { Activity, Server, Layout, Shield, Zap, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'active' | 'offline';
  latency?: number;
  type: 'api' | 'ui' | 'db';
}

export default function StatusMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'BREE Gateway API', url: 'http://localhost:3000/health', status: 'checking', type: 'api' },
    { name: 'AntiMatter REST', url: 'http://localhost:8080/api/health', status: 'checking', type: 'db' },
    { name: 'NATS Fly.io', url: 'https://agent-collective-nats.fly.dev', status: 'checking', type: 'db' },
    { name: 'Admin Dashboard', url: 'http://localhost:5790', status: 'checking', type: 'ui' },
  ]);

  const checkStatus = async (service: ServiceStatus) => {
    const start = Date.now();
    try {
      const response = await fetch(service.url, { mode: 'cors' });
      const latency = Date.now() - start;
      return { ...service, status: 'active', latency } as ServiceStatus;
    } catch (e) {
      return { ...service, status: 'offline' } as ServiceStatus;
    }
  };

  useEffect(() => {
    const runChecks = async () => {
      const updated = await Promise.all(services.map(s => checkStatus(s)));
      setServices(updated);
    };

    runChecks();
    const interval = setInterval(runChecks, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-monitor">
      <div className="section-header">
        <Activity size={20} className="icon-pulse" />
        <h2>Real-time Service Status</h2>
      </div>
      
      <div className="service-grid">
        {services.map((service, i) => (
          <motion.div 
            key={i}
            className={`service-card ${service.status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="service-icon">
              {service.type === 'api' && <Server size={20} />}
              {service.type === 'ui' && <Layout size={20} />}
              {service.type === 'db' && <Zap size={20} />}
            </div>
            <div className="service-info">
              <h3>{service.name}</h3>
              <p>{service.url}</p>
            </div>
            <div className="service-status">
              {service.status === 'active' ? (
                <div className="status-badge active">
                  <CheckCircle size={14} />
                  <span>{service.latency}ms</span>
                </div>
              ) : service.status === 'offline' ? (
                <div className="status-badge offline">
                  <XCircle size={14} />
                  <span>Offline</span>
                </div>
              ) : (
                <div className="status-badge checking">
                  <div className="mini-spinner" />
                  <span>Checking</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .status-monitor {
          margin-bottom: 32px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .icon-pulse {
          color: #3b82f6;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .service-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .service-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .service-info {
          flex: 1;
        }
        .service-info h3 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }
        .service-info p {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }
        .status-badge.offline {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-badge.checking {
          background: #f1f5f9;
          color: #64748b;
        }
        .mini-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid #94a3b8;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
