/**
 * WorkflowWizard — Guided multi-step workspace provisioning
 *
 * Step 1: Create a Matter → assign it to a Client
 * Step 2: Create a Workspace → assign it to that Client + Matter
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, ChevronRight, Loader, AlertCircle,
  Users, Folder, Database, ArrowRight, RotateCcw,
  Sparkles, Building2, FileText, Server, Play
} from 'lucide-react';

/* ─────────────────────────────── types ─────────────────────────────── */

interface Client { artifactID: number; name: string; industry: string; contactEmail: string; }
interface Matter { artifactID: number; name: string; clientArtifactID: number; status: string; created: string; }
interface ResourcePool { artifactID: number; name: string; type: string; available: boolean; }
interface Workspace { artifactID: number; name: string; matterName: string; clientName: string; statusName: string; resourcePoolName: string; created: string; }

type StepStatus = 'pending' | 'active' | 'done' | 'error';

// Use relative paths — Elysia serves the frontend on the same origin as the API.
// In dev, Vite proxy forwards /api → localhost:3001.
const API = '';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'API error');
  return json;
}

/* ─────────────────────────── step indicator ────────────────────────── */

const StepBadge: React.FC<{ num: number; status: StepStatus; label: string; sub: string }> = ({ num, status, label, sub }) => {
  const states: Record<StepStatus, { bg: string; text: string; ring: string }> = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-400', ring: 'ring-gray-200' },
    active:  { bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-300' },
    done:    { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-200' },
    error:   { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-200' },
  };
  const s = states[status];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-4 transition-all duration-300 ${s.bg} ${s.text} ${s.ring}`}>
        {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : num}
      </div>
      <div>
        <p className={`text-sm font-semibold transition-colors ${status === 'active' ? 'text-indigo-900' : status === 'done' ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
};

/* ─────────────────────────── result card ───────────────────────────── */

const ResultCard: React.FC<{ title: string; icon: React.ReactNode; fields: { label: string; value: string | number | boolean }[] }> = ({ title, icon, fields }) => (
  <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white">
      {icon}
      <span className="font-semibold text-sm">{title}</span>
      <CheckCircle2 className="w-4 h-4 ml-auto" />
    </div>
    <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1">
      {fields.map(f => (
        <div key={f.label}>
          <span className="text-xs text-gray-500">{f.label}</span>
          <p className="text-sm font-semibold text-gray-800 font-mono truncate">{String(f.value)}</p>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────── api call log ───────────────────────────── */

const APILog: React.FC<{ method: string; endpoint: string; body?: object; response?: object }> = ({ method, endpoint, body, response }) => {
  const [open, setOpen] = useState(false);
  const colors: Record<string, string> = { POST: 'bg-blue-600', GET: 'bg-green-600' };
  return (
    <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className={`px-1.5 py-0.5 rounded text-white font-bold text-[10px] ${colors[method] ?? 'bg-gray-600'}`}>{method}</span>
        <code className="text-gray-600 flex-1">{endpoint}</code>
        <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="bg-gray-900 px-3 py-2 space-y-2">
          {body && (
            <div>
              <p className="text-gray-500 mb-1">Request Body</p>
              <pre className="text-emerald-300 text-[11px] whitespace-pre-wrap">{JSON.stringify(body, null, 2)}</pre>
            </div>
          )}
          {response && (
            <div>
              <p className="text-gray-500 mb-1">Response</p>
              <pre className="text-blue-300 text-[11px] whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── main wizard ───────────────────────────── */

export const WorkflowWizard: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [matterName, setMatterName] = useState('');
  const [matterStatus, setMatterStatus] = useState('Active');
  const [createdMatter, setCreatedMatter] = useState<Matter | null>(null);
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Log, setStep1Log] = useState<{ body: object; response: object } | null>(null);

  // Step 2 state
  const [pools, setPools] = useState<ResourcePool[]>([]);
  const [selectedPool, setSelectedPool] = useState<ResourcePool | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [enableDataGrid, setEnableDataGrid] = useState(true);
  const [wsKeywords, setWsKeywords] = useState('');
  const [wsNotes, setWsNotes] = useState('');
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step2Log, setStep2Log] = useState<{ body: object; response: object } | null>(null);

  // Load reference data
  useEffect(() => {
    apiFetch<{ data: Client[] }>('/api/clients').then(r => setClients(r.data)).catch(() => {});
    apiFetch<{ data: ResourcePool[] }>('/api/workspace/eligible-resource-pools').then(r => {
      const available = r.data.filter(p => p.available);
      setPools(available);
      if (available.length > 0) setSelectedPool(available[0]);
    }).catch(() => {});
  }, []);

  const resetWizard = () => {
    setStep(1);
    setSelectedClient(null);
    setMatterName('');
    setMatterStatus('Active');
    setCreatedMatter(null);
    setStep1Loading(false);
    setStep1Error(null);
    setStep1Log(null);
    setWorkspaceName('');
    setWsKeywords('');
    setWsNotes('');
    setEnableDataGrid(true);
    setCreatedWorkspace(null);
    setStep2Loading(false);
    setStep2Error(null);
    setStep2Log(null);
    if (pools.length > 0) setSelectedPool(pools[0]);
  };

  /* ── Step 1: Create matter ── */
  const handleCreateMatter = async () => {
    if (!selectedClient) { setStep1Error('Please select a client.'); return; }
    if (!matterName.trim()) { setStep1Error('Please enter a matter name.'); return; }
    setStep1Loading(true);
    setStep1Error(null);
    const body = { name: matterName.trim(), clientArtifactID: selectedClient.artifactID, status: matterStatus };
    try {
      const res = await apiFetch<{ data: Matter; message: string }>('/api/matters', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setCreatedMatter(res.data);
      setStep1Log({ body, response: res });
      // Pre-fill workspace name hint
      setWorkspaceName(`${selectedClient.name} – ${matterName.trim()}`);
    } catch (e: any) {
      setStep1Error(e.message);
    } finally {
      setStep1Loading(false);
    }
  };

  /* ── Step 2: Create workspace ── */
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) { setStep2Error('Please enter a workspace name.'); return; }
    if (!selectedPool) { setStep2Error('Please select a resource pool.'); return; }
    setStep2Loading(true);
    setStep2Error(null);
    const body = {
      name: workspaceName.trim(),
      clientArtifactID: selectedClient!.artifactID,
      matterArtifactID: createdMatter!.artifactID,
      resourcePoolArtifactID: selectedPool.artifactID,
      enableDataGrid,
      keywords: wsKeywords || undefined,
      notes: wsNotes || `Created via Matter-to-Workspace workflow. Matter: ${createdMatter!.name}`
    };
    try {
      const res = await apiFetch<{ data: Workspace; message: string }>('/api/workspace', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setCreatedWorkspace(res.data);
      setStep2Log({ body, response: res });
    } catch (e: any) {
      setStep2Error(e.message);
    } finally {
      setStep2Loading(false);
    }
  };

  const step1Status: StepStatus = createdMatter ? 'done' : step === 1 ? 'active' : 'pending';
  const step2Status: StepStatus = createdWorkspace ? 'done' : step === 2 ? 'active' : 'pending';

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Workflow Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <h2 className="text-xl font-bold">Workspace Provisioning Workflow</h2>
        </div>

        {/* Step breadcrumb */}
        <div className="flex items-center gap-4">
          <StepBadge num={1} status={step1Status} label="Create Matter" sub="Assign to a client" />
          <div className="flex-1 h-px bg-white/30 mx-2" />
          <ArrowRight className="w-4 h-4 text-white/50" />
          <div className="flex-1 h-px bg-white/30 mx-2" />
          <StepBadge num={2} status={step2Status} label="Create Workspace" sub="Assign to client & matter" />
        </div>
      </div>

      {/* ── Summary Trail when both done ── */}
      {createdMatter && createdWorkspace && (
        <div className="mb-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-bold text-emerald-800">Workflow Complete! 🎉</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-2"><Building2 className="w-4 h-4" /><span className="font-semibold text-xs uppercase tracking-wide">Client</span></div>
              <p className="font-bold text-gray-800">{selectedClient?.name}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {selectedClient?.artifactID}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-2 text-violet-600 mb-2"><FileText className="w-4 h-4" /><span className="font-semibold text-xs uppercase tracking-wide">Matter Created</span></div>
              <p className="font-bold text-gray-800">{createdMatter.name}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {createdMatter.artifactID} · {createdMatter.status}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 mb-2"><Database className="w-4 h-4" /><span className="font-semibold text-xs uppercase tracking-wide">Workspace Created</span></div>
              <p className="font-bold text-gray-800">{createdWorkspace.name}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {(createdWorkspace as any).artifactID}</p>
            </div>
          </div>
          <button
            onClick={resetWizard}
            className="mt-4 flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Run workflow again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══════════════════════ STEP 1 ══════════════════════ */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
          step === 1 ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-gray-200 opacity-90'
        }`}>
          <div className={`px-6 py-4 rounded-t-2xl flex items-center gap-3 ${
            createdMatter ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {createdMatter ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <div>
              <p className="font-bold">Create Matter</p>
              <p className={`text-xs ${createdMatter ? 'text-emerald-100' : step === 1 ? 'text-indigo-200' : 'text-gray-400'}`}>
                POST /api/matters
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Client selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" /> Select Client <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {clients.length === 0 && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                    <Loader className="w-4 h-4 animate-spin" /> Loading clients…
                  </div>
                )}
                {clients.map(c => (
                  <button
                    key={c.artifactID}
                    onClick={() => { if (!createdMatter) setSelectedClient(c); }}
                    disabled={!!createdMatter}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedClient?.artifactID === c.artifactID
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${selectedClient?.artifactID === c.artifactID ? 'text-indigo-900' : 'text-gray-700'}`}>{c.name}</p>
                        <p className="text-xs text-gray-400">{c.industry} · ID: {c.artifactID}</p>
                      </div>
                      {selectedClient?.artifactID === c.artifactID && <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Matter name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-violet-400" /> Matter Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={matterName}
                onChange={e => setMatterName(e.target.value)}
                disabled={!!createdMatter}
                placeholder="e.g. Patent Litigation 2026 – Phase 3"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition disabled:bg-gray-50 disabled:text-gray-400 text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={matterStatus}
                onChange={e => setMatterStatus(e.target.value)}
                disabled={!!createdMatter}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition disabled:bg-gray-50 text-sm"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Closed</option>
              </select>
            </div>

            {/* Error */}
            {step1Error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Success result */}
            {createdMatter && (
              <ResultCard
                title={`Matter created — ID ${createdMatter.artifactID}`}
                icon={<FileText className="w-4 h-4" />}
                fields={[
                  { label: 'Artifact ID', value: createdMatter.artifactID },
                  { label: 'Status', value: createdMatter.status },
                  { label: 'Client ID', value: createdMatter.clientArtifactID },
                  { label: 'Created', value: new Date(createdMatter.created).toLocaleString() },
                ]}
              />
            )}

            {/* API log */}
            {step1Log && <APILog method="POST" endpoint="/api/matters" body={step1Log.body} response={step1Log.response} />}

            {/* Action button */}
            {!createdMatter ? (
              <button
                onClick={handleCreateMatter}
                disabled={step1Loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {step1Loading ? <><Loader className="w-5 h-5 animate-spin" /> Creating Matter…</> : <><Play className="w-4 h-4" /> Create Matter &amp; Assign to Client</>}
              </button>
            ) : (
              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Continue to Step 2 <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════ STEP 2 ══════════════════════ */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
          step === 2 && !createdWorkspace ? 'border-indigo-400 ring-4 ring-indigo-100' : step === 2 && createdWorkspace ? 'border-emerald-400' : 'border-gray-200'
        } ${step === 1 && !createdMatter ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className={`px-6 py-4 rounded-t-2xl flex items-center gap-3 ${
            createdWorkspace ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {createdWorkspace ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <p className="font-bold">Create Workspace</p>
              <p className={`text-xs ${createdWorkspace ? 'text-emerald-100' : step === 2 ? 'text-indigo-200' : 'text-gray-400'}`}>
                POST /api/workspace
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Auto-filled pill badges showing inherited values */}
            {createdMatter && selectedClient && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
                  <Building2 className="w-3 h-3" /> {selectedClient.name}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-medium text-violet-700">
                  <FileText className="w-3 h-3" /> Matter #{createdMatter.artifactID}: {createdMatter.name}
                </span>
                <span className="text-xs text-gray-400 self-center">← inherited from Step 1</span>
              </div>
            )}

            {/* Workspace name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" /> Workspace Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                disabled={!!createdWorkspace}
                placeholder="e.g. Acme Discovery – Phase 3"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition disabled:bg-gray-50 disabled:text-gray-400 text-sm"
              />
            </div>

            {/* Resource pool */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-400" /> Resource Pool <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {pools.map(p => (
                  <button
                    key={p.artifactID}
                    onClick={() => { if (!createdWorkspace) setSelectedPool(p); }}
                    disabled={!!createdWorkspace}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedPool?.artifactID === p.artifactID
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${selectedPool?.artifactID === p.artifactID ? 'text-indigo-900' : 'text-gray-700'}`}>{p.name}</p>
                        <p className="text-xs text-gray-400">{p.type} · ID: {p.artifactID}</p>
                      </div>
                      {selectedPool?.artifactID === p.artifactID && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enable data grid toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-700">Enable Data Grid</p>
                <p className="text-xs text-gray-400">Enables advanced data grid features for this workspace</p>
              </div>
              <button
                onClick={() => !createdWorkspace && setEnableDataGrid(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-all ${enableDataGrid ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                disabled={!!createdWorkspace}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enableDataGrid ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Optional keywords */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Keywords <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={wsKeywords}
                onChange={e => setWsKeywords(e.target.value)}
                disabled={!!createdWorkspace}
                placeholder="e.g. patent, discovery, expert witness"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition disabled:bg-gray-50 text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={wsNotes}
                onChange={e => setWsNotes(e.target.value)}
                disabled={!!createdWorkspace}
                rows={2}
                placeholder="Additional notes about this workspace…"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition disabled:bg-gray-50 text-sm resize-none"
              />
            </div>

            {/* Error */}
            {step2Error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{step2Error}</span>
              </div>
            )}

            {/* Success result */}
            {createdWorkspace && (
              <ResultCard
                title={`Workspace created — ID ${(createdWorkspace as any).artifactID}`}
                icon={<Database className="w-4 h-4" />}
                fields={[
                  { label: 'Artifact ID', value: (createdWorkspace as any).artifactID },
                  { label: 'Client', value: createdWorkspace.clientName },
                  { label: 'Matter', value: createdWorkspace.matterName },
                  { label: 'Resource Pool', value: createdWorkspace.resourcePoolName },
                  { label: 'Status', value: createdWorkspace.statusName },
                  { label: 'Data Grid', value: (createdWorkspace as any).enableDataGrid ? 'Enabled' : 'Disabled' },
                ]}
              />
            )}

            {/* API log */}
            {step2Log && <APILog method="POST" endpoint="/api/workspace" body={step2Log.body} response={step2Log.response} />}

            {/* Action */}
            {!createdWorkspace ? (
              <button
                onClick={handleCreateWorkspace}
                disabled={step2Loading || !createdMatter}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {step2Loading ? <><Loader className="w-5 h-5 animate-spin" /> Creating Workspace…</> : <><Play className="w-4 h-4" /> Create Workspace &amp; Link to Matter</>}
              </button>
            ) : (
              <button
                onClick={resetWizard}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Run Workflow Again
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700">
        <p className="font-semibold mb-1">📋 Workflow Summary</p>
        <p>This workflow follows the Relativity provisioning order: <strong>Step 1</strong> creates a Matter and binds it to an existing Client (POST /api/matters). <strong>Step 2</strong> creates a Workspace and binds it to both the Client and the newly created Matter (POST /api/workspace). All fields from Step 1 are automatically inherited into Step 2.</p>
      </div>
    </div>
  );
};
