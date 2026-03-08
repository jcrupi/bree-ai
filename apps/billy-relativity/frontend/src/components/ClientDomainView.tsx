/**
 * Client Domain View — Story 1
 * Workspaces organized by client domain, grouped by matter, with matter number validation
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, FileText, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Users, Mail, Layers, Plus, X, Loader } from 'lucide-react';

interface User   { artifactID: number; fullName: string; email: string; type: string; enabled: boolean; }
interface Group  { artifactID: number; name: string; type: string; clientArtifactID?: number; }
interface Matter { artifactID: number; name: string; matterNumber: string; status: string; created: string; }
interface Workspace {
  artifactID: number; name: string; statusName: string; resourcePoolName: string;
  enableDataGrid: boolean; created: string; lastModified: string; keywords?: string; notes?: string;
}

interface MatterGroup { matter: Matter; matterNumberValid: boolean; workspaces: Workspace[]; }
interface ClientDomain {
  client: { artifactID: number; name: string; industry: string; contactEmail: string; };
  adminGroup: Group | null;
  admins: User[];
  matters: MatterGroup[];
  totalWorkspaces: number;
  invalidMatterCount: number;
}

const API = (path: string) => fetch(path).then(r => r.json());

function StatusBadge({ name }: { name: string }) {
  const map: Record<string, string> = { Active: 'bg-emerald-100 text-emerald-700 border-emerald-200', Archived: 'bg-gray-100 text-gray-600 border-gray-200', Inactive: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  const cls = map[name] ?? 'bg-blue-100 text-blue-700 border-blue-200';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{name}</span>;
}

function MatterNumberBadge({ num, valid }: { num: string; valid: boolean }) {
  if (valid) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> {num}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
      <AlertTriangle className="w-3 h-3" /> {num || 'MISSING'}
    </span>
  );
}

function WorkspaceRow({ ws }: { ws: Workspace }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-100 last:border-0 hover:bg-indigo-50/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-800 truncate">{ws.name}</span>
          <StatusBadge name={ws.statusName} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
          <span>ID: <code className="font-mono text-gray-600">{ws.artifactID}</code></span>
          <span>Pool: {ws.resourcePoolName}</span>
          <span>DataGrid: {ws.enableDataGrid ? '✓' : '✗'}</span>
          <span>Modified: {new Date(ws.lastModified).toLocaleDateString()}</span>
        </div>
        {ws.notes && <p className="mt-1 text-xs text-gray-400 italic truncate">{ws.notes}</p>}
      </div>
    </div>
  );
}

function MatterSection({ mg, expanded, onToggle }: { mg: MatterGroup; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border overflow-hidden mb-3 ${mg.matterNumberValid ? 'border-gray-200' : 'border-red-200 shadow-sm shadow-red-50'}`}>
      {/* Matter header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${mg.matterNumberValid ? 'bg-gray-50 hover:bg-gray-100' : 'bg-red-50 hover:bg-red-100'}`}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
          <FileText className={`w-4 h-4 shrink-0 ${mg.matterNumberValid ? 'text-indigo-500' : 'text-red-400'}`} />
          <div>
            <span className="text-sm font-bold text-gray-800">{mg.matter.name}</span>
            <span className="ml-2 text-xs text-gray-400">#{mg.matter.artifactID}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <MatterNumberBadge num={mg.matter.matterNumber} valid={mg.matterNumberValid} />
          <span className="text-xs text-gray-500">{mg.workspaces.length} workspace{mg.workspaces.length !== 1 ? 's' : ''}</span>
          <StatusBadge name={mg.matter.status} />
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {mg.workspaces.map(ws => <WorkspaceRow key={ws.artifactID} ws={ws} />)}
        </div>
      )}
    </div>
  );
}

function ClientCard({ domain, onMatterCreated }: { domain: ClientDomain; onMatterCreated: () => void }) {
  const [expanded, setExpanded]       = useState(false);
  const [openMatters, setOpenMatters] = useState<Set<number>>(new Set());
  const [showCreate, setShowCreate]     = useState(false);
  const [matterName, setMatterName]     = useState('');
  const [matterNumber, setMatterNumber] = useState('');
  const [matterStatus, setMatterStatus] = useState('Active');
  const [clientId, setClientId]         = useState(domain.client.artifactID);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [saveSuccess, setSaveSuccess]   = useState('');

  const toggleMatter = (id: number) => setOpenMatters(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const hasIssues = domain.invalidMatterCount > 0;

  const MATTER_NUM_RE = /^E-\d{8}$/;

  const handleCreateMatter = async () => {
    if (!matterName.trim())  { setSaveError('Matter name is required'); return; }
    if (!clientId)           { setSaveError('Client ID is required'); return; }
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             matterName.trim(),
          matterNumber:     matterNumber.trim(),
          clientArtifactID: clientId,
          status:           matterStatus,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to create matter');
      setSaveSuccess(`✓ Matter "${json.data.name}" created (ID ${json.data.artifactID})`);
      setMatterName('');
      setMatterNumber('');
      setMatterStatus('Active');
      setClientId(domain.client.artifactID);
      setShowCreate(false);
      onMatterCreated();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm mb-6 ${hasIssues ? 'border-red-200' : 'border-gray-200'}`}>
      {/* Client header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors ${hasIssues ? 'bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100' : 'bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${hasIssues ? 'bg-red-100' : 'bg-indigo-100'}`}>
            <Building2 className={`w-5 h-5 ${hasIssues ? 'text-red-500' : 'text-indigo-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{domain.client.name}</h3>
            <p className="text-sm text-gray-500">{domain.client.industry} · {domain.client.contactEmail}</p>
          </div>
          {hasIssues && (
            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {domain.invalidMatterCount} invalid matter{domain.invalidMatterCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right text-sm text-gray-600 hidden sm:block">
            <div className="font-semibold">{domain.totalWorkspaces} workspaces</div>
            <div className="text-gray-400">{domain.matters.length} matters</div>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-4 bg-white">

          {/* Admin group */}
          {domain.adminGroup && (
            <div className="mb-5 p-4 rounded-xl bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-800">{domain.adminGroup.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {domain.admins.map(u => (
                  <span key={u.artifactID} className="inline-flex items-center gap-1.5 bg-white border border-violet-200 rounded-full px-3 py-1 text-xs text-violet-700">
                    <Mail className="w-3 h-3" />
                    <span className="font-semibold">{u.fullName}</span>
                    <span className="text-violet-400">{u.email}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matters heading + create button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Matters</span>
            <button
              onClick={() => { setShowCreate(v => !v); setSaveError(''); setSaveSuccess(''); }}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                showCreate
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {showCreate ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> New Matter</>}
            </button>
          </div>

          {/* Inline create matter form */}
          {showCreate && (
            <div className="mb-4 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-indigo-800">New Matter — {domain.client.name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Matter Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Matter Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={matterName}
                    onChange={e => setMatterName(e.target.value)}
                    placeholder="e.g. Patent Litigation 2026 – Phase 3"
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm transition"
                    autoFocus
                  />
                </div>

                {/* Matter Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Matter Number
                    <span className="ml-1 font-normal text-gray-400">(E-########)</span>
                  </label>
                  <input
                    type="text"
                    value={matterNumber}
                    onChange={e => setMatterNumber(e.target.value.toUpperCase())}
                    placeholder="E-20260301"
                    className={`w-full px-3 py-2 border-2 rounded-lg outline-none font-mono text-sm transition ${
                      matterNumber && !MATTER_NUM_RE.test(matterNumber)
                        ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                        : matterNumber && MATTER_NUM_RE.test(matterNumber)
                        ? 'border-emerald-400 bg-emerald-50 focus:ring-2 focus:ring-emerald-200'
                        : 'border-indigo-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400'
                    }`}
                  />
                  {matterNumber && !MATTER_NUM_RE.test(matterNumber) && (
                    <p className="text-[11px] text-red-500 mt-0.5">Format must be E- followed by exactly 8 digits</p>
                  )}
                  {matterNumber && MATTER_NUM_RE.test(matterNumber) && (
                    <p className="text-[11px] text-emerald-600 mt-0.5">✓ Valid format</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={matterStatus}
                    onChange={e => setMatterStatus(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm transition"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Closed</option>
                  </select>
                </div>

                {/* Client ID */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Client ID <span className="text-red-400">*</span>
                    <span className="ml-1 font-normal text-indigo-400">(pre-filled from domain)</span>
                  </label>
                  <input
                    type="number"
                    value={clientId}
                    onChange={e => setClientId(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none font-mono text-sm transition"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-end">
                  <button
                    onClick={handleCreateMatter}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-all shadow-sm"
                  >
                    {saving ? <><Loader className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Matter</>}
                  </button>
                </div>
              </div>

              {saveError   && <p className="text-xs text-red-600 font-medium mt-1">{saveError}</p>}
              {saveSuccess && <p className="text-xs text-emerald-700 font-semibold mt-1">{saveSuccess}</p>}
            </div>
          )}


          {/* Matter list */}
          <div>
            {domain.matters.length === 0
              ? <p className="text-sm text-gray-400 italic">No matters yet — create one above.</p>
              : domain.matters.map(mg => (
                <MatterSection
                  key={mg.matter.artifactID}
                  mg={mg}
                  expanded={openMatters.has(mg.matter.artifactID)}
                  onToggle={() => toggleMatter(mg.matter.artifactID)}
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientDomainView() {
  const [data, setData]       = useState<ClientDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    API('/api/clients/domain-view')
      .then(r => { setData(r.data ?? []); setLoading(false); })
      .catch(() => { setError('Failed to load domain view'); setLoading(false); });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
    </div>
  );

  if (error) return <div className="text-red-600 p-6">{error}</div>;

  const totalWorkspaces = data.reduce((s, c) => s + c.totalWorkspaces, 0);
  const totalInvalid = data.reduce((s, c) => s + c.invalidMatterCount, 0);

  return (
    <div>
      {/* Summary bar */}
      {/* Summary bar — use inline styles for icon backgrounds to avoid Tailwind purge */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Clients',    value: data.length,      icon: <Building2 className="w-5 h-5 text-indigo-600" />,                                                               bg: '#eef2ff' },
          { label: 'Total Workspaces', value: totalWorkspaces,  icon: <Layers className="w-5 h-5 text-blue-600" />,                                                                   bg: '#eff6ff' },
          { label: 'Invalid Matter #s',value: totalInvalid,     icon: <AlertTriangle className={`w-5 h-5 ${totalInvalid > 0 ? 'text-red-500' : 'text-emerald-500'}`} />,             bg: totalInvalid > 0 ? '#fef2f2' : '#ecfdf5' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
            <div style={{ background: bg }} className="p-2 rounded-lg">{icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {data.map(domain => <ClientCard key={domain.client.artifactID} domain={domain} onMatterCreated={refresh} />)}
    </div>
  );
}
