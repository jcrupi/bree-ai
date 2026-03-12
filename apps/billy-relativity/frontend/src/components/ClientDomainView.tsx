/**
 * Client Domain View — Story 1
 * Workspaces organized by client domain, grouped by matter, with matter number validation
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, FileText, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Users, Mail, Layers, Plus, X, Loader } from 'lucide-react';
import { useAppMode } from '../context/AppModeContext';

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

interface TemplateWorkspace { artifactID: number; name: string; }

function MatterSection({ mg, expanded, onToggle, clientArtifactID, onWorkspaceCreated }: {
  mg: MatterGroup;
  expanded: boolean;
  onToggle: () => void;
  clientArtifactID: number;
  onWorkspaceCreated: () => void;
}) {
  const [showCreate, setShowCreate]     = useState(false);
  const [wsName, setWsName]               = useState('');
  const [templateId, setTemplateId]       = useState<number | ''>('');
  const [projectType, setProjectType]     = useState('');
  const [otherDesc, setOtherDesc]         = useState('');
  const [templates, setTemplates]         = useState<TemplateWorkspace[]>([]);
  const [loadingTpl, setLoadingTpl]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [saveSuccess, setSaveSuccess]     = useState('');

  const openForm = async () => {
    setShowCreate(true);
    setSaveError(''); setSaveSuccess('');
    if (templates.length > 0) return;
    setLoadingTpl(true);
    try {
      const r = await fetch('/api/workspace/templates').then(x => x.json());
      setTemplates(r.data ?? []);
    } catch { setTemplates([]); }
    finally { setLoadingTpl(false); }
  };

  const handleCreate = async () => {
    if (!wsName.trim())   { setSaveError('Workspace name is required'); return; }
    if (!templateId)      { setSaveError('Please select a template'); return; }
    if (!projectType)     { setSaveError('Please select a project type'); return; }
    if (projectType === 'Other' && !otherDesc.trim()) { setSaveError('Please describe the project type'); return; }
    const finalProjectType = projectType === 'Other' ? `Other: ${otherDesc.trim()}` : projectType;
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const res = await fetch(`/api/workspace/from-template/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             wsName.trim(),
          projectType:      finalProjectType,
          matterArtifactID: mg.matter.artifactID,
          clientArtifactID,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to create workspace');
      setSaveSuccess(`✓ Workspace "${json.data.name}" [${finalProjectType}] created (ID ${json.data.artifactID})`);
      setWsName(''); setTemplateId(''); setProjectType(''); setOtherDesc('');
      setShowCreate(false);
      onWorkspaceCreated();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

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
        <div>
          {/* Workspace list */}
          <div className="divide-y divide-gray-100">
            {mg.workspaces.map(ws => <WorkspaceRow key={ws.artifactID} ws={ws} />)}
          </div>

          {/* New workspace row */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            {!showCreate ? (
              <button
                onClick={openForm}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Workspace
              </button>
            ) : (
              <div className="py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> New Workspace — {mg.matter.name}
                  </span>
                  <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Workspace Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Workspace Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={wsName}
                      onChange={e => setWsName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="e.g. Acme Patent Discovery - Phase 3"
                      className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm transition"
                      autoFocus
                    />
                  </div>

                  {/* Template picker */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Template <span className="text-red-400">*</span></label>
                    {loadingTpl ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Loader className="w-3.5 h-3.5 animate-spin" /> Loading templates…
                      </div>
                    ) : (
                      <select
                        value={templateId}
                        onChange={e => setTemplateId(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm transition"
                      >
                        <option value="">— Select a template —</option>
                        {templates.map(t => (
                          <option key={t.artifactID} value={t.artifactID}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Project Type */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Project Type <span className="text-red-400">*</span></label>
                    <select
                      value={projectType}
                      onChange={e => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none text-sm transition"
                    >
                      <option value="">— Select a project type —</option>

                      <optgroup label="── Litigation">
                        <option>Commercial Litigation</option>
                        <option>Civil Litigation</option>
                        <option>Litigation Support</option>
                        <option>Arbitration</option>
                        <option>Class Action</option>
                        <option>Bankruptcy / Restructuring</option>
                        <option>Appeals</option>
                      </optgroup>

                      <optgroup label="── Document Review">
                        <option>Document Review</option>
                        <option>Early Case Assessment (ECA)</option>
                        <option>First-Pass Review</option>
                        <option>Privilege Review</option>
                        <option>Second-Level Review</option>
                        <option>Quality Control (QC) Review</option>
                        <option>Large-Scale Review</option>
                      </optgroup>

                      <optgroup label="── Investigations">
                        <option>Internal Investigation</option>
                        <option>Government Investigation</option>
                        <option>Regulatory Investigation</option>
                        <option>Anti-Corruption / FCPA</option>
                        <option>Fraud Investigation</option>
                        <option>Whistleblower Investigation</option>
                        <option>Cybersecurity / Data Breach</option>
                      </optgroup>

                      <optgroup label="── Regulatory & Compliance">
                        <option>HSR Second Request</option>
                        <option>SEC / DOJ Response</option>
                        <option>GDPR / Privacy Compliance</option>
                        <option>Antitrust / Competition</option>
                        <option>Environmental Compliance</option>
                        <option>Healthcare / HIPAA</option>
                        <option>Financial Regulatory (FINRA / OCC)</option>
                      </optgroup>

                      <optgroup label="── Corporate Transactions">
                        <option>Mergers & Acquisitions (M&amp;A)</option>
                        <option>Due Diligence</option>
                        <option>IPO / Capital Markets</option>
                        <option>Joint Venture</option>
                        <option>Divestiture</option>
                      </optgroup>

                      <optgroup label="── Employment & IP">
                        <option>Employment Dispute</option>
                        <option>Labor Relations</option>
                        <option>Contract Review</option>
                        <option>Intellectual Property (IP)</option>
                        <option>Patent Litigation</option>
                        <option>Trade Secret</option>
                      </optgroup>

                      <optgroup label="── Other">
                        <option>Other</option>
                      </optgroup>
                    </select>

                    {/* "Other" free-text description */}
                    {projectType === 'Other' && (
                      <input
                        type="text"
                        value={otherDesc}
                        onChange={e => setOtherDesc(e.target.value)}
                        placeholder="Describe the project type… (required)"
                        className="mt-2 w-full px-3 py-2 border-2 border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-300 outline-none text-sm transition"
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      onClick={handleCreate}
                      disabled={saving}
                      className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg text-sm transition-all shadow-sm"
                    >
                      {saving ? <><Loader className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Workspace</>}
                    </button>
                    <button onClick={() => setShowCreate(false)} className="py-2 px-3 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                  </div>
                </div>

                {saveError   && <p className="text-xs text-red-600 font-medium">{saveError}</p>}
                {saveSuccess && <p className="text-xs text-emerald-700 font-semibold">{saveSuccess}</p>}
              </div>
            )}
          </div>
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

  const alertAdmins = (e: React.MouseEvent) => {
    e.stopPropagation();
    const invalidMatters = domain.matters.filter(mg => !mg.matterNumberValid);
    const adminEmails = domain.admins.map(u => u.email).join(';');
    const subject = encodeURIComponent(`[Action Required] Invalid Matter Numbers - ${domain.client.name}`);
    const lines = invalidMatters.map(
      mg => `  - ${mg.matter.name} (Matter #: ${mg.matter.matterNumber || 'MISSING'})`
    ).join('\n');
    const body = encodeURIComponent(
      `Hello,\n\nThe following matter(s) for client "${domain.client.name}" have invalid or missing matter numbers:\n\n${lines}\n\nPlease update the matter number in Relativity to the correct E-######## format.\n\nThis alert was generated by Billy Relativity.`
    );
    window.location.href = `mailto:${adminEmails}?subject=${subject}&body=${body}`;
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
          {hasIssues && domain.admins.length > 0 && (
            <button
              onClick={alertAdmins}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm"
              title={`Email admins: ${domain.admins.map(u => u.email).join(', ')}`}
            >
              <Mail className="w-3.5 h-3.5" />
              Alert Admins
            </button>
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
                  clientArtifactID={domain.client.artifactID}
                  onWorkspaceCreated={onMatterCreated}
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
  const { isLive, auth } = useAppMode();
  const [data, setData]       = useState<ClientDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    if (isLive && auth?.accessToken) {
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

        const [clientsRaw, mattersRaw, workspacesRaw] = await Promise.all([q(5), q(6), q(8)]);

        const liveClients: ClientDomain[] = clientsRaw.map((c: any) => ({
          client: { artifactID: c.ArtifactID, name: c.Values[0], industry: 'Live Rel', contactEmail: 'live@relativity.com' },
          adminGroup: null, admins: [], matters: [], totalWorkspaces: 0, invalidMatterCount: 0
        }));

        if (liveClients.length === 0) {
          liveClients.push({
            client: { artifactID: -1, name: 'Live Connectivity Domain', industry: 'Live', contactEmail: auth.instanceUrl },
            adminGroup: null, admins: [], matters: [], totalWorkspaces: 0, invalidMatterCount: 0
          });
        }

        const liveMatters = mattersRaw.map((m: any) => ({
          matter: { artifactID: m.ArtifactID, name: m.Values[0], matterNumber: 'E-' + m.ArtifactID, status: 'Active', created: new Date().toISOString() },
          matterNumberValid: true,
          workspaces: []
        }));

        liveMatters.forEach((m: any, i: number) => {
          liveClients[i % liveClients.length].matters.push(m);
        });

        const liveWorkspaces = workspacesRaw.map((w: any) => ({
          artifactID: w.ArtifactID, name: w.Values[0], statusName: 'Active', resourcePoolName: 'Relativity Pool', enableDataGrid: false, created: new Date().toISOString(), lastModified: new Date().toISOString()
        }));

        const allMatters = liveClients.flatMap((c: any) => c.matters);
        if (allMatters.length === 0) {
          const dummyMatter = {
            matter: { artifactID: -2, name: 'Unassigned Framework', matterNumber: 'E-00000000', status: 'Active', created: new Date().toISOString() },
            matterNumberValid: true,
            workspaces: []
          };
          liveClients[0].matters.push(dummyMatter);
          allMatters.push(dummyMatter);
        }

        liveWorkspaces.forEach((w: any, i: number) => {
          allMatters[i % allMatters.length].workspaces.push(w);
        });

        liveClients.forEach((c: any) => {
          c.totalWorkspaces = c.matters.reduce((acc: number, m: any) => acc + m.workspaces.length, 0);
        });

        setData(liveClients);
      } catch (err) {
        console.error(err);
        setError('Failed to load real Live domains.');
      } finally {
        setLoading(false);
      }
      return;
    }

    API('/api/clients/domain-view')
      .then(r => { setData(r.data ?? []); setLoading(false); })
      .catch(() => { setError('Failed to load domain view'); setLoading(false); });
  }, [isLive, auth]);

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
