/**
 * Command Center — Relativity Multi-Tenant Governance Dashboard
 * Models the ER hierarchy: Super Org (EY) → Main Command Center → Command Centers → Clients / Workspaces / Users / Roles
 * Includes Global Policy panel + Audit Log stream
 */

import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Layers, ClipboardList,
  ChevronDown, ChevronRight, Activity, UserCheck, Globe,
  AlertCircle, CheckCircle2, Info, Crown, Server, BookOpen,
  Eye, Settings, Clock, Zap, Link, Database,
  Pencil, Trash2, Plus, X,
} from 'lucide-react';
import { useAppMode } from '../context/AppModeContext';

/* Super Org Admin — Billy Crupi */
const BILLY_ADMIN = {
  name: 'Billy Crupi',
  email: 'billy.crupi@ey.com',
  title: 'Super Org Administrator',
  initials: 'BC',
};

/* ─────────────────────────────────────────────────────────────
   Mock Data — mirrors the ER diagram entitie
───────────────────────────────────────────────────────────── */

interface CCUser    { id: number; name: string; email: string; role: string; lastLogin: string; }
interface CCRole    { id: number; name: string; permissions: string[]; assignedUsers: number; }
interface CCWorkspace { id: number; name: string; matter: string; status: 'Active' | 'Archived' | 'Processing'; documents: number; }
interface CCClient  { id: number; name: string; industry: string; workspaces: CCWorkspace[]; }
interface R1Instance {
  id: string;
  name: string;
  url: string;
  region: string;
  version: string;
  status: 'Connected' | 'Degraded' | 'Offline';
}
interface CommandCenterEntity {
  id: number;
  name: string;
  region: string;
  adminEmail: string;
  status: 'Online' | 'Degraded' | 'Offline';
  userCount: number;
  workspaceCount: number;
  r1Instance: R1Instance | null;
  clients: CCClient[];
  users: CCUser[];
  roles: CCRole[];
}

const R1_INSTANCES: R1Instance[] = [
  { id: 'r1-us-east',  name: 'EY Relativity US-East',   url: 'https://ey-relativity-useast.relativity.one',  region: 'us-east-1', version: 'Server 2024.1', status: 'Connected' },
  { id: 'r1-eu-west',  name: 'EY Relativity EU-West',   url: 'https://ey-relativity-euwest.relativity.one',  region: 'eu-west-1', version: 'Server 2024.1', status: 'Degraded'  },
  { id: 'r1-apac',     name: 'EY Relativity APAC',      url: 'https://ey-relativity-apac.relativity.one',    region: 'ap-south-1', version: 'Server 2023.3', status: 'Connected' },
];
interface AuditEntry { id: number; ts: string; actor: string; action: string; target: string; level: 'info' | 'warn' | 'critical'; }
interface GlobalPolicy { id: number; name: string; description: string; scope: string; status: 'Enforced' | 'Review' | 'Draft'; }

const GLOBAL_POLICIES: GlobalPolicy[] = [
  { id: 1, name: 'Data Retention – 7 Year Hold',    description: 'All matter documents retained for minimum 7 years per EY policy.',  scope: 'All Command Centers', status: 'Enforced' },
  { id: 2, name: 'MFA Mandatory',                   description: 'Multi-factor authentication required for all CC Admin and CC User accounts.', scope: 'All Command Centers', status: 'Enforced' },
  { id: 3, name: 'Matter Number Format E-########', description: 'Workspace matter numbers must conform to the EY E-######## format.',   scope: 'All Command Centers', status: 'Enforced' },
  { id: 4, name: 'Workspace Idle Archival – 90d',   description: 'Workspaces with no activity for 90 days are automatically archived.', scope: 'All Command Centers', status: 'Review' },
  { id: 5, name: 'Privilege Log Auto-Generation',   description: 'Privilege logs generated automatically upon review set completion.', scope: 'Litigation CCs only', status: 'Draft' },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: 1,  ts: '2026-03-11T17:58:02Z', actor: 'j.crupi@ey.com',      action: 'Created workspace',     target: 'Acme Patent Discovery – Phase 3 [CC: Americas]',      level: 'info'     },
  { id: 2,  ts: '2026-03-11T17:44:21Z', actor: 'System',              action: 'Policy enforced',        target: 'MFA Mandatory → 2 non-compliant accounts [CC: EMEA]',  level: 'warn'     },
  { id: 3,  ts: '2026-03-11T17:30:05Z', actor: 'r.patel@ey.com',      action: 'Role assigned',          target: 'CC Admin → r.patel [CC: APAC]',                         level: 'info'     },
  { id: 4,  ts: '2026-03-11T16:55:00Z', actor: 'System',              action: 'Workspace archived',     target: 'GlobalTech M&A Due Diligence 2024 [CC: Americas]',     level: 'info'     },
  { id: 5,  ts: '2026-03-11T16:22:47Z', actor: 'a.muller@ey.com',     action: 'Matter number invalid',  target: 'Matter "TechCo Dispute" missing E-######## [CC: EMEA]', level: 'critical'  },
  { id: 6,  ts: '2026-03-11T15:48:33Z', actor: 'j.crupi@ey.com',      action: 'User access granted',    target: 'Reviewer access → d.kim [CC: Americas]',               level: 'info'     },
  { id: 7,  ts: '2026-03-11T15:03:10Z', actor: 'System',              action: 'Policy review triggered', target: 'Workspace Idle Archival – 90d [Main CC]',              level: 'warn'     },
  { id: 8,  ts: '2026-03-11T14:17:55Z', actor: 'k.tanaka@ey.com',     action: 'Legal hold released',    target: 'Custodian: m.jones [CC: APAC]',                         level: 'critical'  },
];

const COMMAND_CENTERS: CommandCenterEntity[] = [
  {
    id: 1, name: 'Americas', region: 'North & South America', adminEmail: 'cc-admin-americas@ey.com',
    status: 'Online', userCount: 142, workspaceCount: 38,
    r1Instance: null, // populated from API
    clients: [
      {
        id: 101, name: 'Acme Corporation', industry: 'Technology',
        workspaces: [
          { id: 1001, name: 'Patent Discovery – Phase 3', matter: 'E-20260301', status: 'Active', documents: 84200 },
          { id: 1002, name: 'IP Litigation 2025',         matter: 'E-20250811', status: 'Active', documents: 21400 },
        ],
      },
      {
        id: 102, name: 'GlobalTech Inc.', industry: 'Finance',
        workspaces: [
          { id: 1003, name: 'M&A Due Diligence 2024',    matter: 'E-20240602', status: 'Archived', documents: 310000 },
          { id: 1004, name: 'SEC Response Q1 2026',      matter: 'E-20260115', status: 'Processing', documents: 9800 },
        ],
      },
    ],
    users: [
      { id: 201, name: 'Johnny Crupi',   email: 'j.crupi@ey.com',   role: 'CC Admin',    lastLogin: '2026-03-11' },
      { id: 202, name: 'Dana Kim',       email: 'd.kim@ey.com',      role: 'CC User',     lastLogin: '2026-03-10' },
      { id: 203, name: 'Maria Santos',   email: 'm.santos@ey.com',   role: 'CC User',     lastLogin: '2026-03-09' },
    ],
    roles: [
      { id: 301, name: 'CC Admin',        permissions: ['Manage Users', 'Manage Workspaces', 'View Audit Log', 'Assign Roles'], assignedUsers: 2 },
      { id: 302, name: 'CC User',         permissions: ['View Workspaces', 'Search Documents', 'Export Review Set'],           assignedUsers: 140 },
      { id: 303, name: 'Read-Only Reviewer', permissions: ['View Documents', 'Add Tags'],                                     assignedUsers: 47 },
    ],
  },
  {
    id: 2, name: 'EMEA', region: 'Europe, Middle East & Africa', adminEmail: 'cc-admin-emea@ey.com',
    status: 'Degraded', userCount: 98, workspaceCount: 24,
    r1Instance: null, // populated from API
    clients: [
      {
        id: 103, name: 'TechCo GmbH', industry: 'Manufacturing',
        workspaces: [
          { id: 1005, name: 'GDPR Compliance Review',  matter: 'E-20260210', status: 'Active', documents: 55000 },
          { id: 1006, name: 'TechCo Dispute 2026',     matter: '',           status: 'Active', documents: 3100 },
        ],
      },
    ],
    users: [
      { id: 204, name: 'Anna Müller',    email: 'a.muller@ey.com',  role: 'CC Admin',    lastLogin: '2026-03-11' },
      { id: 205, name: 'Pierre Lefort',  email: 'p.lefort@ey.com',  role: 'CC User',     lastLogin: '2026-03-08' },
    ],
    roles: [
      { id: 304, name: 'CC Admin', permissions: ['Manage Users', 'Manage Workspaces', 'View Audit Log', 'Assign Roles'], assignedUsers: 3 },
      { id: 305, name: 'CC User',  permissions: ['View Workspaces', 'Search Documents'],                                 assignedUsers: 95 },
    ],
  },
  {
    id: 3, name: 'APAC', region: 'Asia-Pacific', adminEmail: 'cc-admin-apac@ey.com',
    status: 'Online', userCount: 61, workspaceCount: 14,
    r1Instance: null, // populated from API
    clients: [
      {
        id: 104, name: 'Kensei Holdings', industry: 'Financial Services',
        workspaces: [
          { id: 1007, name: 'Regulatory Audit FY2025', matter: 'E-20251201', status: 'Active', documents: 42000 },
        ],
      },
    ],
    users: [
      { id: 206, name: 'Kenji Tanaka',   email: 'k.tanaka@ey.com',  role: 'CC Admin',    lastLogin: '2026-03-11' },
      { id: 207, name: 'Riya Patel',     email: 'r.patel@ey.com',   role: 'CC Admin',    lastLogin: '2026-03-10' },
    ],
    roles: [
      { id: 306, name: 'CC Admin', permissions: ['Manage Users', 'Manage Workspaces', 'View Audit Log', 'Assign Roles'], assignedUsers: 4 },
      { id: 307, name: 'CC User',  permissions: ['View Workspaces', 'Search Documents'],                                 assignedUsers: 57 },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   Helpers / Sub-components
───────────────────────────────────────────────────────────── */

type CCView = 'overview' | 'clients' | 'users' | 'roles';

function statusColor(s: CommandCenterEntity['status']) {
  if (s === 'Online')   return { dot: '#22c55e', bg: 'rgba(34,197,94,0.12)',  text: '#15803d' };
  if (s === 'Degraded') return { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#b45309' };
  return                       { dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#b91c1c' };
}

function WorkspaceStatusPill({ status }: { status: CCWorkspace['status'] }) {
  const map = {
    Active:     'background: rgba(34,197,94,0.12);  color: #15803d;  border: 1px solid rgba(34,197,94,0.3)',
    Archived:   'background: rgba(107,114,128,0.12); color: #4b5563; border: 1px solid rgba(107,114,128,0.3)',
    Processing: 'background: rgba(99,102,241,0.12);  color: #4338ca; border: 1px solid rgba(99,102,241,0.3)',
  } as Record<string, string>;
  return (
    <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:20, fontSize:10, fontWeight:700, ...Object.fromEntries((map[status]||'').split(';').filter(Boolean).map(p => { const [k,v]=p.split(':'); return [k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v?.trim()]; })) }}>
      {status}
    </span>
  );
}

function AuditLevelIcon({ level }: { level: AuditEntry['level'] }) {
  if (level === 'critical') return <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />;
  if (level === 'warn')     return <Info         className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />;
  return                           <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />;
}

function PolicyStatusBadge({ status }: { status: GlobalPolicy['status'] }) {
  const styles: Record<string, React.CSSProperties> = {
    Enforced: { background: 'rgba(34,197,94,0.12)',  color: '#15803d', border: '1px solid rgba(34,197,94,0.3)' },
    Review:   { background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)' },
    Draft:    { background: 'rgba(107,114,128,0.12)', color: '#4b5563', border: '1px solid rgba(107,114,128,0.3)' },
  };
  return (
    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:20, fontSize:10, fontWeight:700, ...styles[status] }}>
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Command Center Detail Panel
───────────────────────────────────────────────────────────── */

function CCDetail({ cc, onClose }: { cc: CommandCenterEntity; onClose: () => void }) {
  const [view, setView] = useState<CCView>('overview');
  const sc = statusColor(cc.status);

  const views: { id: CCView; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',   icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'clients',  label: 'Clients',    icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'users',    label: 'Users',      icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'roles',    label: 'Roles',      icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'flex-end', pointerEvents: 'none',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'all' }}
      />
      {/* Drawer */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560, height: '100vh', background: '#0f172a',
        borderLeft: '1px solid rgba(99,102,241,0.25)', display: 'flex', flexDirection: 'column',
        pointerEvents: 'all', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(99,102,241,0.2)', padding: 10, borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)' }}>
                <Server className="w-5 h-5" style={{ color: '#818cf8' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
                  {cc.name} Command Center
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{cc.region}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ color: '#64748b', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18, lineHeight:1 }}>✕</button>
          </div>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Status',     value: cc.status,          extra: { color: sc.text } },
              { label: 'Users',      value: cc.userCount,       extra: {} },
              { label: 'Workspaces', value: cc.workspaceCount,  extra: {} },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace', ...s.extra }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: 6 }}>
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: view === v.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                  color: view === v.id ? '#a5b4fc' : '#94a3b8',
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>

          {/* ── Overview ── */}
          {view === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Admin Email"   value={cc.adminEmail} mono />
              <InfoRow label="Region"        value={cc.region} />
              <InfoRow label="Clients"       value={`${cc.clients.length} registered`} />
              <InfoRow label="Status"        value={cc.status} valueColor={sc.text} />
              {cc.r1Instance && <InfoRow label="R1 Instance"   value={cc.r1Instance.name} mono />}
              {cc.r1Instance && <InfoRow label="R1 URL"        value={cc.r1Instance.url} mono />}
              {cc.r1Instance && <InfoRow label="R1 Status"     value={cc.r1Instance.status} valueColor={cc.r1Instance.status === 'Connected' ? '#4ade80' : '#fbbf24'} />}
              <div style={{ marginTop: 8, padding: '14px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.18)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Policy Scope</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                  All {GLOBAL_POLICIES.filter(p => p.status === 'Enforced').length} enforced global policies apply to this Command Center.
                  {cc.status === 'Degraded' && (
                    <span style={{ display: 'block', marginTop: 8, color: '#f59e0b', fontWeight: 600 }}>
                      ⚠ Degraded status detected — MFA policy may not be fully applied.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Clients ── */}
          {view === 'clients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cc.clients.map(client => (
                <ClientBlock key={client.id} client={client} />
              ))}
            </div>
          )}

          {/* ── Users ── */}
          {view === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cc.users.map(u => (
                <div key={u.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 14, fontWeight: 800 }}>
                      {u.name.split(' ').map(p => p[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <RolePill role={u.role} />
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Last: {u.lastLogin}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Roles ── */}
          {view === 'roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cc.roles.map(r => (
                <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield className="w-4 h-4" style={{ color: '#818cf8' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{r.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{r.assignedUsers} users</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.permissions.map(p => (
                      <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, valueColor }: { label: string; value: string | number; mono?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || '#f1f5f9', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const isAdmin = role.includes('Admin');
  const bg    = isAdmin ? 'rgba(239,68,68,0.14)'   : 'rgba(99,102,241,0.14)';
  const color = isAdmin ? '#f87171'                : '#818cf8';
  const border = isAdmin ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.3)';
  return (
    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: bg, color, border }}>
      {role}
    </span>
  );
}

function ClientBlock({ client }: { client: CCClient }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {open ? <ChevronDown className="w-3.5 h-3.5" style={{ color: '#818cf8' }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />}
          <Building2 className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{client.name}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>· {client.industry}</span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>{client.workspaces.length} ws</span>
      </button>
      {open && (
        <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {client.workspaces.map(ws => (
            <div key={ws.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{ws.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: ws.matter ? '#94a3b8' : '#ef4444', marginTop: 2 }}>
                  {ws.matter || '⚠ Matter # missing'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <WorkspaceStatusPill status={ws.status} />
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{ws.documents.toLocaleString()} docs</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Command Center Add/Edit Modal ─────────────────────────────── */
interface CCFormData {
  name: string; region: string; adminEmail: string; status: 'Online' | 'Degraded' | 'Offline';
}
function CCFormModal({ initial, r1Options, onSave, onClose }: {
  initial?: CommandCenterEntity | null; r1Options: R1Instance[];
  onSave: (data: CCFormData) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<CCFormData>({
    name: initial?.name ?? '', region: initial?.region ?? '',
    adminEmail: initial?.adminEmail ?? '', status: initial?.status ?? 'Online',
  });
  const isEdit = !!initial;
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 13, outline: 'none', fontFamily: 'monospace' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', padding: 8, borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)' }}><Server className="w-4 h-4" style={{ color: '#818cf8' }} /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{isEdit ? 'Edit Command Center' : 'New Command Center'}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>EY Multi-Tenant Governance</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, padding: 6 }}><X className="w-4 h-4" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lbl}>Name</label><input id="cc-form-name" style={inp} value={form.name} placeholder="e.g. Americas" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={lbl}>Region</label><input id="cc-form-region" style={inp} value={form.region} placeholder="e.g. North & South America" onChange={e => setForm(f => ({ ...f, region: e.target.value }))} /></div>
          <div><label style={lbl}>Admin Email</label><input id="cc-form-email" style={inp} type="email" value={form.adminEmail} placeholder="cc-admin@ey.com" onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} /></div>
          <div><label style={lbl}>Status</label>
            <select id="cc-form-status" style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CCFormData['status'] }))}>
              <option value="Online">Online</option><option value="Degraded">Degraded</option><option value="Offline">Offline</option>
            </select></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button id="cc-form-save" onClick={() => { if (form.name.trim() && form.region.trim() && form.adminEmail.trim()) onSave(form); }}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            {isEdit ? 'Save Changes' : 'Create Command Center'}
          </button>
        </div>
      </div>
    </div>
  );
}

type MainView = 'grid' | 'r1instances' | 'policy' | 'audit';


export function CommandCenter() {
  const { isLive, auth } = useAppMode();
  const [mainView, setMainView]       = useState<MainView>('grid');
  const [selectedCC, setSelectedCC]   = useState<CommandCenterEntity | null>(null);
  const [ccs, setCCs]                 = useState<CommandCenterEntity[]>([...COMMAND_CENTERS]);
  const [r1Instances, setR1Instances] = useState<R1Instance[]>([]);
  const [r1Loading, setR1Loading]     = useState(true);
  const [r1Error, setR1Error]         = useState('');

  // CRUD modal state
  const [showModal, setShowModal]     = useState(false);
  const [editingCC, setEditingCC]     = useState<CommandCenterEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (isLive && auth?.accessToken) {
      setR1Loading(true);
      setR1Error('');
      (async () => {
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const q = async (typeId: number) => {
            const res = await fetch(`${apiBase}/api/auth/proxy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: `${auth.instanceUrl}/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/-1/object/queryslim`,
                method: 'POST',
                headers: { 'Authorization': `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json', 'X-CSRF-Header': '-' },
                reqBody: { request: { objectType: { artifactTypeID: typeId }, condition: "", fields: [{ name: "Name" }] }, start: 1, length: 100 }
              })
            });
            const json = await res.json();
            return json.Objects || [];
          };

          const [clientsRaw, workspacesRaw] = await Promise.all([q(5), q(8)]);

          const liveClients: CCClient[] = clientsRaw.map((c: any) => ({
            id: c.ArtifactID, name: c.Values[0], industry: 'Live Rel', workspaces: []
          }));

          const liveWorkspaces: CCWorkspace[] = workspacesRaw.map((w: any) => ({
            id: w.ArtifactID, name: w.Values[0], matter: 'E-' + w.ArtifactID, status: 'Active', documents: 0
          }));

          if (liveClients.length === 0) {
            liveClients.push({ id: -1, name: 'Live Environment', industry: 'Live', workspaces: [] });
          }

          liveWorkspaces.forEach((w, i) => {
            liveClients[i % liveClients.length].workspaces.push(w);
          });

          const liveCC: CommandCenterEntity = {
            id: 9991, 
            name: 'Live Relativity Env', 
            region: auth.instanceUrl.replace('https://', ''), 
            adminEmail: 'live@relativity.com',
            status: 'Online', 
            userCount: 0, 
            workspaceCount: liveWorkspaces.length,
            r1Instance: { id: 'live-r1', name: auth.instanceUrl, url: auth.instanceUrl, region: 'Live Server', version: 'Live', status: 'Connected' },
            clients: liveClients, 
            users: [], 
            roles: []
          };
          
          setCCs([liveCC]);
          setR1Instances([{ id: 'live-r1', name: auth.instanceUrl, url: auth.instanceUrl, region: 'Live Server', version: 'Live', status: 'Connected' }]);
        } catch (e) {
          console.error(e);
          setR1Error('Failed to load Live Relativity instances');
        } finally {
          setR1Loading(false);
        }
      })();
      return;
    }

    setR1Loading(true);
    fetch('/api/r1-instances')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setR1Instances(json.data);
          // Patch ccs state with fetched R1 instances
          setCCs(prev => prev.map(cc => {
            const matched = (json.data as R1Instance[]).find(inst =>
              (inst as any).commandCenters?.includes(cc.name)
            );
            return matched ? { ...cc, r1Instance: matched } : cc;
          }));
        } else {
          setR1Error('Failed to load R1 instances');
        }
      })
      .catch(() => setR1Error('Network error loading R1 instances'))
      .finally(() => setR1Loading(false));
  }, [isLive, auth, setCCs]);

  // CRUD handlers
  const handleOpenAdd  = () => { setEditingCC(null); setShowModal(true); };
  const handleOpenEdit = (cc: CommandCenterEntity, e: React.MouseEvent) => { e.stopPropagation(); setEditingCC(cc); setShowModal(true); };
  const handleDelete   = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setDeleteConfirm(id === deleteConfirm ? null : id); };
  const handleConfirmDelete = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setCCs(prev => prev.filter(c => c.id !== id)); setDeleteConfirm(null); };
  const handleSave = (data: CCFormData) => {
    if (editingCC) {
      setCCs(prev => prev.map(c => c.id === editingCC.id ? { ...c, ...data } : c));
    } else {
      const newCC: CommandCenterEntity = {
        id: Date.now(), ...data,
        userCount: 0, workspaceCount: 0,
        r1Instance: null, clients: [], users: [], roles: [],
      };
      setCCs(prev => [...prev, newCC]);
    }
    setShowModal(false);
    setEditingCC(null);
  };

  const totalUsers = ccs.reduce((s, c) => s + c.userCount, 0);
  const totalWS    = ccs.reduce((s, c) => s + c.workspaceCount, 0);
  const online     = ccs.filter(c => c.status === 'Online').length;

  const navItems: { id: MainView; label: string; icon: React.ReactNode }[] = [
    { id: 'grid',        label: 'Command Centers', icon: <Server className="w-4 h-4" /> },
    { id: 'r1instances', label: 'R1 Instances',    icon: <Database className="w-4 h-4" /> },
    { id: 'policy',      label: 'Global Policy',   icon: <Globe className="w-4 h-4" /> },
    { id: 'audit',       label: 'Audit Log',       icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* CRUD Modal */}
      {showModal && (
        <CCFormModal
          initial={editingCC}
          r1Options={r1Instances}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingCC(null); }}
        />
      )}
      {/* ── Super Org Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
        borderRadius: 20, padding: '32px 36px', marginBottom: 28,
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 40px rgba(99,102,241,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Left: org identity + Billy admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ background: 'rgba(245,158,11,0.18)', padding: 14, borderRadius: 16, border: '2px solid rgba(245,158,11,0.4)' }}>
              <Crown className="w-7 h-7" style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 4 }}>
                SUPER ORG
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                EY — Ernst &amp; Young
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                Main Command Center · Relativity Multi-Tenant Governance
              </div>
              {/* Billy admin chip */}
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '7px 14px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                  {BILLY_ADMIN.initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{BILLY_ADMIN.name}</div>
                  <div style={{ fontSize: 10, color: '#78716c', fontFamily: 'monospace' }}>{BILLY_ADMIN.title} · {BILLY_ADMIN.email}</div>
                </div>
                <div style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid rgba(245,158,11,0.35)' }}>
                  All R1 Access
                </div>
              </div>
            </div>
          </div>

          {/* Right: aggregate stats */}
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'Command Centers', value: ccs.length,               icon: <Server className="w-4 h-4" />, color: '#818cf8' },
              { label: 'Total Users',     value: totalUsers,                icon: <Users className="w-4 h-4" />,  color: '#34d399' },
              { label: 'Workspaces',      value: totalWS,                   icon: <Layers className="w-4 h-4" />, color: '#60a5fa' },
              { label: 'Online',          value: `${online}/${ccs.length}`, icon: <Zap className="w-4 h-4" />,   color: '#fbbf24' },
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

      {/* ── Sub-nav + Add button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {navItems.map(n => (
            <button
              key={n.id}
              id={`cc-nav-${n.id}`}
              onClick={() => setMainView(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: mainView === n.id ? '#4f46e5' : '#f8fafc',
                color:      mainView === n.id ? '#fff'    : '#4b5563',
                boxShadow:  mainView === n.id ? '0 2px 10px rgba(79,70,229,0.35)' : 'none',
              }}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </div>
        {mainView === 'grid' && (
          <button
            id="cc-add-btn"
            onClick={handleOpenAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}
          >
            <Plus className="w-4 h-4" /> Add Command Center
          </button>
        )}
      </div>

      {/* ── Grid View ── */}
      {mainView === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {ccs.map(cc => {
            const sc = statusColor(cc.status);
            const isDeleting = deleteConfirm === cc.id;
            return (
              <div
                key={cc.id}
                id={`cc-card-${cc.id}`}
                onClick={() => { setDeleteConfirm(null); setSelectedCC(cc); }}
                style={{
                  background: '#0f172a', borderRadius: 18, padding: '24px 26px',
                  border: isDeleting ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(99,102,241,0.2)',
                  cursor: 'pointer', transition: 'all 0.18s',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isDeleting ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
                }}
                onMouseEnter={e => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.5)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(99,102,241,0.18)'; } }}
                onMouseLeave={e => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; } }}
              >
                {/* Top row: status + action buttons */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Edit */}
                  <button
                    id={`cc-edit-${cc.id}`}
                    onClick={e => handleOpenEdit(cc, e)}
                    title="Edit"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 7, padding: '4px 6px', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center' }}
                  ><Pencil className="w-3 h-3" /></button>
                  {/* Delete */}
                  {!isDeleting ? (
                    <button
                      id={`cc-delete-${cc.id}`}
                      onClick={e => handleDelete(cc.id, e)}
                      title="Delete"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '4px 6px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                    ><Trash2 className="w-3 h-3" /></button>
                  ) : (
                    <button
                      id={`cc-delete-confirm-${cc.id}`}
                      onClick={e => handleConfirmDelete(cc.id, e)}
                      style={{ background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 800 }}
                    >Confirm</button>
                  )}
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, display: 'inline-block', boxShadow: `0 0 6px ${sc.dot}`, marginLeft: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: sc.text }}>{cc.status}</span>
                </div>

                {/* Icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 110 }}>
                  <div style={{ background: 'rgba(99,102,241,0.18)', padding: 12, borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Server className="w-5 h-5" style={{ color: '#818cf8' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{cc.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cc.region}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'Clients',    value: cc.clients.length },
                    { label: 'Users',      value: cc.userCount },
                    { label: 'Workspaces', value: cc.workspaceCount },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* R1 chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Database className="w-3 h-3" style={{ color: '#818cf8', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#818cf8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cc.r1Instance?.name ?? 'No R1 assigned'}</span>
                  {cc.r1Instance && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: cc.r1Instance.status === 'Connected' ? '#22c55e' : '#f59e0b', background: cc.r1Instance.status === 'Connected' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>{cc.r1Instance.status}</span>}
                </div>

                {/* Admin email */}
                <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginBottom: 12 }}>{cc.adminEmail}</div>

                {/* Client tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cc.clients.map(c => (
                    <span key={c.id} style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                      {c.name}
                    </span>
                  ))}
                </div>

                {/* Open hint */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontSize: 11, fontWeight: 700 }}>
                  <Eye className="w-3.5 h-3.5" /> Open Command Center
                </div>
              </div>
            );
          })}

          {/* Empty state when all deleted */}
          {ccs.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <Server className="w-12 h-12" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No Command Centers</div>
              <div style={{ fontSize: 12, marginBottom: 20 }}>Click "Add Command Center" to create your first one.</div>
              <button onClick={handleOpenAdd} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                <Plus className="w-4 h-4 inline-block mr-1" /> Add Command Center
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── R1 Instances View ── */}
      {mainView === 'r1instances' && (
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database className="w-5 h-5" style={{ color: '#4f46e5' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Relativity R1 Instances</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>All instances accessible by {BILLY_ADMIN.name} (Super Org Admin)</div>
            </div>
          </div>
          {r1Loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px', color: '#6b7280', fontSize: 13 }}>
              <div style={{ width: 18, height: 18, border: '2px solid #818cf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading R1 instances from API…
            </div>
          )}
          {r1Error && <div style={{ color: '#ef4444', padding: 16, fontSize: 13 }}>⚠ {r1Error}</div>}
          {!r1Loading && !r1Error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {r1Instances.map(inst => {
                const assignedCCs = COMMAND_CENTERS.filter(cc => cc.r1Instance?.id === inst.id);
                const isConn = inst.status === 'Connected';
                return (
                  <div key={inst.id} style={{ background: '#0f172a', borderRadius: 16, padding: '22px 26px', border: `1px solid ${isConn ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.25)'}`, boxShadow: isConn ? '0 0 20px rgba(34,197,94,0.07)' : '0 0 20px rgba(245,158,11,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: isConn ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', padding: 10, borderRadius: 10, border: `1px solid ${isConn ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                          <Database className="w-5 h-5" style={{ color: isConn ? '#4ade80' : '#fbbf24' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{inst.name}</div>
                          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{inst.version} · {inst.region}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: isConn ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: isConn ? '#4ade80' : '#fbbf24', border: `1px solid ${isConn ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {inst.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Link className="w-3 h-3" style={{ color: '#818cf8', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8' }}>{inst.url}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Assigned Command Centers</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {assignedCCs.length > 0
                        ? assignedCCs.map(cc => (
                          <span key={cc.id} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                            {cc.name}
                          </span>
                        ))
                        : inst.commandCenters?.map(name => (
                          <span key={name} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>{name}</span>
                        ))
                      }
                    </div>
                    <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '5px 10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>BC</div>
                      <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{BILLY_ADMIN.name} — Super Org Admin access</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Global Policy View ── */}
      {mainView === 'policy' && (
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe className="w-5 h-5" style={{ color: '#4f46e5' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Global Policies</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Defined by Super Org (EY) · Applies to all Command Centers</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GLOBAL_POLICIES.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                  <div style={{ marginTop: 1, background: '#eef2ff', padding: 8, borderRadius: 8 }}>
                    <BookOpen className="w-4 h-4" style={{ color: '#4f46e5' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{p.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Settings className="w-3 h-3" style={{ color: '#9ca3af' }} />
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>Scope: {p.scope}</span>
                    </div>
                  </div>
                </div>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <PolicyStatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Log View ── */}
      {mainView === 'audit' && (
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity className="w-5 h-5" style={{ color: '#4f46e5' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Audit Log</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Aggregated across all Command Centers · Main Command Center view</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AUDIT_LOG.map(entry => (
              <div key={entry.id} style={{
                background: '#fff', borderRadius: 12, padding: '14px 18px',
                border: `1px solid ${entry.level === 'critical' ? 'rgba(239,68,68,0.25)' : entry.level === 'warn' ? 'rgba(245,158,11,0.2)' : '#e5e7eb'}`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  <AuditLevelIcon level={entry.level} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{entry.action}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, lineHeight: 1.5 }}>{entry.target}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserCheck className="w-3 h-3" />{entry.actor}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock className="w-3 h-3" />{new Date(entry.ts).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: entry.level === 'critical' ? 'rgba(239,68,68,0.1)' : entry.level === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.08)',
                    color: entry.level === 'critical' ? '#dc2626' : entry.level === 'warn' ? '#d97706' : '#16a34a',
                  }}>{entry.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedCC && <CCDetail cc={selectedCC} onClose={() => setSelectedCC(null)} />}
    </div>
  );
}
