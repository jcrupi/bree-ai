/**
 * Command Center — EYv Multi-Tenant Governance Dashboard
 * Represents a SINGLE EYv Command Center instance managing multiple R1 instances.
 */

import React, { useState, useEffect } from 'react';
import {
  Users, Activity, UserCheck, Server,
  Clock, Zap, Link, Database, Pencil, Trash2, Plus, Key
} from 'lucide-react';
import { useAppMode } from '../context/AppModeContext';

// ── Models ─────────────────────────────────────────────────────────

type CCRole = 'Command Center Instance Administrator' | 'Command Center Administrator' | 'Command Center Read Only';

interface CCR1Instance {
  id: string;
  name: string;
  url: string;
  clientId: string;
  clientSecret: string; // masked in UI
  version: string;
  status: 'Connected' | 'Degraded' | 'Offline';
}

interface CCUser {
  id: number;
  name: string;
  email: string;
  role: CCRole;
  assignedR1s: string[]; // Array of R1 Instance IDs this user can access
  lastLogin: string;
}

interface AuditEntry {
  id: number;
  ts: string;
  actor: string;
  action: string;
  target: string;
  level: 'info' | 'warn' | 'critical';
}

// ── Mock Data ──────────────────────────────────────────────────────

const MOCK_R1_INSTANCES: CCR1Instance[] = [
  { id: 'r1-us-east', name: 'EY US-East Production', url: 'https://ey-useast.relativity.one', clientId: 'client-abcd-1234', clientSecret: 'secret', version: 'Server 2024.1', status: 'Connected' },
  { id: 'r1-us-west', name: 'EY US-West Litigation', url: 'https://ey-uswest.relativity.one', clientId: 'client-efgh-5678', clientSecret: 'secret', version: 'Server 2024.1', status: 'Connected' },
  { id: 'r1-eu-west', name: 'EY EMEA Review', url: 'https://ey-euwest.relativity.one', clientId: 'client-ijkl-9012', clientSecret: 'secret', version: 'Server 2023.3', status: 'Degraded' }
];

const MOCK_USERS: CCUser[] = [
  { id: 201, name: 'Billy Crupi', email: 'billy.crupi@ey.com', role: 'Command Center Instance Administrator', assignedR1s: ['r1-us-east', 'r1-us-west', 'r1-eu-west'], lastLogin: '2026-03-12' },
  { id: 202, name: 'Dana Kim', email: 'd.kim@ey.com', role: 'Command Center Administrator', assignedR1s: ['r1-us-east'], lastLogin: '2026-03-12' },
  { id: 203, name: 'Kenji Tanaka', email: 'k.tanaka@ey.com', role: 'Command Center Administrator', assignedR1s: ['r1-us-west', 'r1-eu-west'], lastLogin: '2026-03-11' },
  { id: 204, name: 'Maria Santos', email: 'm.santos@ey.com', role: 'Command Center Read Only', assignedR1s: ['r1-us-east', 'r1-eu-west'], lastLogin: '2026-03-10' }
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 1, ts: '2026-03-12T14:42:02Z', actor: 'billy.crupi@ey.com', action: 'Registered R1 Instance', target: 'EY US-West Litigation [r1-us-west]', level: 'info' },
  { id: 2, ts: '2026-03-12T13:15:21Z', actor: 'billy.crupi@ey.com', action: 'Role Assigned', target: 'Command Center Administrator → Kenji Tanaka', level: 'warn' },
  { id: 3, ts: '2026-03-11T16:55:00Z', actor: 'd.kim@ey.com', action: 'Workspace Created', target: 'Project Phoenix [r1-us-east]', level: 'info' },
  { id: 4, ts: '2026-03-11T15:03:10Z', actor: 'System', action: 'Connection Degraded', target: 'EY EMEA Review [r1-eu-west]', level: 'critical' },
];

const ORG_INFO = {
  name: 'EYv US Command Center',
  location: 'Global Delivery Node',
  admin: 'billy.crupi@ey.com'
};

// ── Sub-components ─────────────────────────────────────────────────

function RoleBadge({ role }: { role: CCRole }) {
  let bg = 'rgba(107,114,128,0.1)';
  let color = '#6b7280';
  let border = 'rgba(107,114,128,0.3)';

  if (role === 'Command Center Instance Administrator') {
    bg = 'rgba(245,158,11,0.15)'; color = '#fbbf24'; border = 'rgba(245,158,11,0.4)';
  } else if (role === 'Command Center Administrator') {
    bg = 'rgba(99,102,241,0.15)'; color = '#818cf8'; border = 'rgba(99,102,241,0.4)';
  } else if (role === 'Command Center Read Only') {
    bg = 'rgba(34,197,94,0.15)'; color = '#4ade80'; border = 'rgba(34,197,94,0.4)';
  }

  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: bg, color, border: `1px solid ${border}` }}>
      {role}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────

type MainView = 'r1instances' | 'users' | 'audit';

export function CommandCenter() {
  const { isLive, auth } = useAppMode();
  const [view, setView] = useState<MainView>('r1instances');

  const [instances, setInstances] = useState<CCR1Instance[]>([...MOCK_R1_INSTANCES]);
  const [users] = useState<CCUser[]>([...MOCK_USERS]);

  // Loading/Status
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveStats, setLiveStats] = useState({ clients: 0, workspaces: 0 });

  useEffect(() => {
    if (isLive && auth?.accessToken) {
      setLiveLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const q = async (typeId: number) => {
        try {
          const res = await fetch(`${apiBase}/api/auth/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`,
              method: 'POST',
              headers: { 'Authorization': `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json', 'X-CSRF-Header': '-' },
              reqBody: { request: { objectType: { artifactTypeID: typeId }, condition: "", fields: [{ name: "Name" }] }, start: 1, length: 1 }
            })
          });
          const json = await res.json();
          return json.TotalCount || 0;
        } catch { return 0; }
      };

      Promise.all([q(5), q(8)]).then(([clients, workspaces]) => {
        setLiveStats({ clients, workspaces });
        const liveInstance: CCR1Instance = {
          id: 'live-r1',
          name: 'Live Relativity Instance',
          url: auth.instanceUrl,
          clientId: '****',
          clientSecret: '****',
          version: 'Live',
          status: 'Connected'
        };
        setInstances([liveInstance]);
        setLiveLoading(false);
      });
    } else {
      setInstances([...MOCK_R1_INSTANCES]);
    }
  }, [isLive, auth]);

  const navItems: { id: MainView; label: string; icon: React.ReactNode }[] = [
    { id: 'r1instances', label: 'Registered R1 Instances', icon: <Database className="w-4 h-4" /> },
    { id: 'users', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 28,
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 40px rgba(99,102,241,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ background: 'rgba(245,158,11,0.18)', padding: 14, borderRadius: 16, border: '2px solid rgba(245,158,11,0.4)' }}>
              <Server className="w-7 h-7" style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>
                {ORG_INFO.location}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                {ORG_INFO.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                Centralized management for multiple RelativityOne deployments.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'Registered R1s', value: instances.length, icon: <Database className="w-4 h-4" />, color: '#818cf8' },
              { label: 'CC Users', value: users.length, icon: <Users className="w-4 h-4" />, color: '#34d399' },
              { label: 'Connected', value: instances.filter(i => i.status === 'Connected').length, icon: <Zap className="w-4 h-4" />, color: '#fbbf24' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.08)', minWidth: 90 }}>
                <div style={{ color: stat.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: view === n.id ? '#4f46e5' : 'transparent',
              color: view === n.id ? '#fff' : '#64748b',
              boxShadow: view === n.id ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
            }}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* R1 Instances Tab */}
      {view === 'r1instances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>RelativityOne Instances</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Instances registered to this Command Center (Max 15).</p>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer'
            }}>
              <Plus className="w-4 h-4" /> Register New R1 Instance
            </button>
          </div>

          {liveLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>Loading live data...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
              {instances.map(inst => (
                <div key={inst.id} style={{
                  background: '#fff', border: '1px solid #cbd5e1', borderRadius: 14, padding: 20,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ padding: 10, borderRadius: 10, background: '#eef2ff', color: '#4f46e5' }}>
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{inst.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{inst.version}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: inst.status === 'Connected' ? '#dcfce7' : '#fef3c7',
                      color: inst.status === 'Connected' ? '#15803d' : '#b45309'
                    }}>
                      {inst.status}
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', marginBottom: 6 }}>
                      <Link className="w-3 h-3 text-indigo-500" /> <span style={{ fontFamily: 'monospace' }}>{inst.url}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
                      <Key className="w-3 h-3 text-amber-500" /> <span style={{ fontFamily: 'monospace' }}>Client ID: {inst.clientId}</span>
                    </div>
                  </div>

                  {isLive && inst.id === 'live-r1' && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12 }}><strong style={{ color: '#0f172a' }}>{liveStats.clients}</strong> <span style={{ color: '#64748b' }}>Clients</span></div>
                      <div style={{ fontSize: 12 }}><strong style={{ color: '#0f172a' }}>{liveStats.workspaces}</strong> <span style={{ color: '#64748b' }}>Workspaces</span></div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer' }}>Edit Credentials</button>
                    <button style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>Unregister</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users & Roles Tab */}
      {view === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Command Center Users</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Manage user roles and their assigned R1 instance visibility.</p>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer'
            }}>
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role & Permissions</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Authorized R1 Instances</th>
                  <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ marginBottom: 6 }}><RoleBadge role={u.role} /></div>
                      {u.role === 'Command Center Instance Administrator' && <div style={{ fontSize: 11, color: '#64748b' }}>Can register R1s & assign roles</div>}
                      {u.role === 'Command Center Administrator' && <div style={{ fontSize: 11, color: '#64748b' }}>Can execute operations in R1s</div>}
                      {u.role === 'Command Center Read Only' && <div style={{ fontSize: 11, color: '#64748b' }}>Read info only in R1s</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.assignedR1s.map(r1 => {
                          const instInfo = instances.find(i => i.id === r1);
                          return (
                            <span key={r1} style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                              {instInfo ? instInfo.name : r1}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 4 }}><Pencil className="w-4 h-4" /></button>
                      <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, marginLeft: 8 }}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {view === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Command Center Audit Log</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Activity across all mapped instances and user roles.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AUDIT_LOG.map(entry => (
              <div key={entry.id} style={{
                background: '#fff', borderRadius: 12, padding: '14px 18px',
                border: `1px solid ${entry.level === 'critical' ? 'rgba(239,68,68,0.25)' : entry.level === 'warn' ? 'rgba(245,158,11,0.2)' : '#e5e7eb'}`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{entry.action}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{entry.target}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserCheck className="w-3 h-3" />{entry.actor}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock className="w-3 h-3" />{new Date(entry.ts).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: entry.level === 'critical' ? 'rgba(239,68,68,0.1)' : entry.level === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)',
                    color: entry.level === 'critical' ? '#dc2626' : entry.level === 'warn' ? '#d97706' : '#16a34a',
                  }}>{entry.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
