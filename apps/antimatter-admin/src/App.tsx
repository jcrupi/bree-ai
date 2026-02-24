import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Shield, Zap, RefreshCw, 
  Settings, Activity, Hash, FileText, ChevronRight,
  Plus, Filter, Trash2, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  NavItem, StatCard, useNatsLog, PageHeader, 
  Badge, Modal, Button, Input, TextArea 
} from '@agent-collective/ui-kit';
import DatabaseExplorer from './components/DatabaseExplorer';
import StatusMonitor from './components/StatusMonitor';
import AgentXDashboard from './components/AgentXDashboard';
import './antimatter-styles.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [natsPaused, setNatsPaused] = useState(false);

  // Default DB Path
  const dbPath = './test_db';

  // NATS Console State
  const { logs: natsLogs, status: natsStatus, setLogs: setNatsLogs } = useNatsLog(
      "wss://agent-collective-nats.fly.dev", 
      "agent.antimatter-db.>", 
      natsPaused, 
      true
  );

  const fetchEntries = async () => {
    setLoading(true);
    // In a real scenario, this would be a NATS request to AntiMatter REST
    try {
      const res = await fetch('http://localhost:8080/api/entries?limit=5');
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries.map((e: any) => ({
          name: e.path.split('/').pop(),
          path: e.path,
          size: 'N/A', // Size not returned by basic getEntries
          updated: 'Recently'
        })));
      }
    } catch (e) {
      console.error("Failed to fetch entries", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
            <Database size={22} color="white" />
          </div>
          <div>
            <h2 className="text-gradient-animate" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>BREE</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em', fontWeight: 'bold' }}>ANTIMATTER</p>
          </div>
        </div>

        <nav>
          <NavItem icon={Activity} label="Status" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={Database} label="Explorer" active={activeTab === 'explorer'} onClick={() => setActiveTab('explorer')} />
          <NavItem icon={Shield} label="AgentX" active={activeTab === 'agentx'} onClick={() => setActiveTab('agentx')} />
          <NavItem icon={Zap} label="NATS Events" active={activeTab === 'nats'} onClick={() => setActiveTab('nats')} />
          <div style={{ margin: '24px 0', borderTop: '1px solid var(--border)' }} />
          <NavItem icon={Settings} label="Admin" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: natsStatus === 'connected' ? '#10b981' : '#ef4444', boxShadow: natsStatus === 'connected' ? '0 0 10px #10b981' : '0 0 10px #ef4444' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white' }}>NATS Agent</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {natsStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <PageHeader 
            title={activeTab === 'overview' ? 'AntiMatter Health' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            description="Multi-instance Markdown Database Administration"
            actions={(
              <Button variant="glass" onClick={fetchEntries}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </Button>
            )}
        />

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <StatusMonitor />

            <div className="stat-grid">
              <StatCard title="Total Entries" value={entries.length} icon={FileText} color="#6366f1" />
              <StatCard title="Schema Version" value="1.2.0" icon={Layout} color="#a855f7" />
              <StatCard title="Queries" value="1.4k" icon={Activity} color="#10b981" />
              <StatCard title="Storage" value="5.2MB" icon={Database} color="#f59e0b" />
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Recent Activity</h3>
                <Badge variant="success">Live Sync Active</Badge>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Path</th>
                    <th>Size</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length > 0 ? entries.map((entry, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{entry.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.path}</td>
                      <td>{entry.size}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{entry.updated}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No records found or AntiMatter REST server is offline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'explorer' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <DatabaseExplorer dbPath={dbPath} />
           </motion.div>
        )}

        {activeTab === 'agentx' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AgentXDashboard />
           </motion.div>
        )}

        {activeTab === 'nats' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
             <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Live DB Events</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="glass" onClick={() => setNatsLogs([])}>Clear</Button>
                    <Button variant="glass" onClick={() => setNatsPaused(!natsPaused)}>{natsPaused ? 'Resume' : 'Pause'}</Button>
                </div>
             </div>
             <div style={{ flex: 1, overflowY: 'auto', background: '#070b14', padding: '16px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                {natsLogs.length > 0 ? natsLogs.map((log, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '16px' }}>
                        <span style={{ color: '#475569', minWidth: '85px' }}>{log.timestamp}</span>
                        <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{log.subject}</span>
                        <span style={{ color: '#94a3b8' }}>{log.data}</span>
                    </div>
                )) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexDirection: 'column', gap: '12px' }}>
                    <Activity size={40} />
                    <p>Waiting for events on subject: agent.antimatter-db.&gt;</p>
                  </div>
                )}
             </div>
           </motion.div>
        )}
      </main>
    </div>
  );
}
