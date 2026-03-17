/**
 * Agentx Tab — Design & Implementation Spec Management
 * List agentx files, create new versions, generate design from requirements, generate impl from design.
 */

import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Sparkles,
  Palette,
  Code2,
  Plus,
  Loader,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  Code,
} from 'lucide-react';

interface AgentxFile {
  name: string;
  type: 'design' | 'impl';
  version: string | null;
  modified?: string | null;
}

interface AgentxMeta {
  name: string;
  type: 'meta';
  modified?: string | null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

type ViewMode = 'list' | 'create' | 'design' | 'impl';

export function AgentxTab() {
  const [files, setFiles] = useState<AgentxFile[]>([]);
  const [metaFiles, setMetaFiles] = useState<AgentxMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [requirements, setRequirements] = useState('');
  const [newVersion, setNewVersion] = useState(4);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewRaw, setViewRaw] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agentx/list');
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to load');
      setFiles(data.files ?? []);
      setMetaFiles(data.meta ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agentx list');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchFile = async (filename: string) => {
    setError('');
    try {
      const res = await fetch(`/api/agentx/file/${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to load');
      setContent(data.content ?? '');
      setSelectedFile(filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load file');
    }
  };

  const handleSave = async () => {
    const toSave = selectedFile ?? (viewMode === 'design' ? `billy-relativity.version-${newVersion}.design.agentx.md` : `billy-relativity.impl.version-${newVersion}.agentx.md`);
    if (!toSave || !content.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    setError('');
    try {
      const res = await fetch('/api/agentx/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: toSave,
          content: content,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to save');
      setSaveSuccess(true);
      fetchList();
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDesign = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/agentx/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: requirements.trim(),
          version: newVersion,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to generate');
      setContent(data.content ?? '');
      setViewMode('design');
      setSelectedFile(data.filename ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate design');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImpl = async () => {
    setGenerating(true);
    setError('');
    const versionFromDesign = selectedFile?.match(/version-(\d+)/)?.[1];
    const version = versionFromDesign ? parseInt(versionFromDesign, 10) : newVersion;
    try {
      const res = await fetch('/api/agentx/generate-impl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designContent: content.trim(),
          version,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Failed to generate');
      setContent(data.content ?? '');
      setViewMode('impl');
      setSelectedFile(data.filename ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate impl');
    } finally {
      setGenerating(false);
    }
  };

  const maxVersion = Math.max(
    2,
    ...files.map(f => (f.version ? parseInt(f.version, 10) : 0))
  );
  const suggestedVersion = maxVersion + 1;

  const handleCreateNew = () => {
    setRequirements('');
    setSelectedFile(null);
    setContent('');
    setNewVersion(suggestedVersion);
    setViewMode('create');
  };

  // Group files by version for display
  const versionGroups = files.reduce<Record<string, { design?: AgentxFile; impl?: AgentxFile; date?: string }>>((acc, f) => {
    const v = f.version ?? 'other';
    if (!acc[v]) acc[v] = {};
    if (f.type === 'design') acc[v].design = f;
    else acc[v].impl = f;
    const existing = acc[v].date;
    const curr = f.modified ?? '';
    acc[v].date = !existing || (curr && curr > existing) ? curr : existing;
    return acc;
  }, {});
  const sortedVersions = Object.keys(versionGroups).sort((a, b) => {
    if (a === 'other') return 1;
    if (b === 'other') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agentx</h2>
            <p className="text-sm text-gray-500">Design & implementation specs for Billy Relativity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchList}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Version
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : viewMode === 'list' ? (
        /* File list */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-base font-bold text-gray-800">Agentx Specs</h3>
            <p className="text-xs text-gray-500 mt-0.5">Design specs and implementation guides · Click to view or edit</p>
          </div>
          <div className="divide-y divide-gray-100">
            {metaFiles.length > 0 && (
              <>
                <div className="px-6 py-3 bg-violet-50/60 border-b border-violet-100">
                  <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Meta Drivers</span>
                </div>
                <div className="flex divide-x divide-gray-100">
                  {metaFiles.map(f => {
                    const isImpl = f.name.includes('meta.impl');
                    const label = isImpl ? 'Meta Impl' : 'Meta Design';
                    const desc = isImpl ? 'Driver for impl generation' : 'Driver for design generation';
                    return (
                      <button
                        key={f.name}
                        onClick={() => {
                          fetchFile(f.name);
                          setViewMode(isImpl ? 'impl' : 'design');
                        }}
                        className="flex-1 flex items-center gap-4 px-6 py-4 text-left hover:bg-violet-50/50 transition group"
                      >
                        <div className={`p-3 rounded-xl shadow-sm group-hover:shadow-md transition ${isImpl ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-fuchsia-600'}`}>
                          {isImpl ? <Code2 className="w-5 h-5 text-white" /> : <Palette className="w-5 h-5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{label}</div>
                          <div className="text-xs text-gray-500">{f.modified ? `${desc} · ${formatDate(f.modified)}` : desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-6 py-3 bg-gray-50/60 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Versioned Specs</span>
                </div>
              </>
            )}
            {files.length === 0 && metaFiles.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No agentx files yet</p>
                <p className="text-xs mt-1">Create a new version to get started</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4" />
                  New Version
                </button>
              </div>
            ) : (
              sortedVersions.map(ver => {
                const group = versionGroups[ver];
                const label = ver === 'other' ? 'Other' : `Version ${ver}`;
                return (
                  <div key={ver} className="border-b border-gray-100 last:border-0">
                    <div className="px-6 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                        {ver !== 'other' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">v{ver}</span>
                        )}
                      </div>
                      {group.date && (
                        <span className="text-[11px] text-gray-400">{formatDate(group.date)}</span>
                      )}
                    </div>
                    <div className="flex">
                      {group.design && (
                        <button
                          onClick={() => {
                            fetchFile(group.design!.name);
                            setViewMode('design');
                          }}
                          className="flex-1 flex items-center gap-4 px-6 py-4 text-left hover:bg-indigo-50/60 transition group"
                        >
                          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm group-hover:shadow-md transition">
                            <Palette className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">Design</div>
                            <div className="text-xs text-indigo-600/80">Requirements & spec · v{ver}</div>
                          </div>
                        </button>
                      )}
                      {group.impl && (
                        <button
                          onClick={() => {
                            fetchFile(group.impl!.name);
                            setViewMode('impl');
                          }}
                          className="flex-1 flex items-center gap-4 px-6 py-4 text-left hover:bg-amber-50/60 transition group border-l border-gray-100"
                        >
                          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm group-hover:shadow-md transition">
                            <Code2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">Implementation</div>
                            <div className="text-xs text-amber-600/80">Stepwise instructions · v{ver}</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : viewMode === 'create' ? (
        /* Create new version flow */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-violet-50/60">
              <h3 className="text-sm font-semibold text-violet-800">1. Enter Requirements</h3>
              <p className="text-xs text-violet-600/80 mt-0.5">Describe the features you want. One per line or in paragraphs.</p>
            </div>
            <div className="p-4">
              <textarea
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="e.g.&#10;Add client domain status filter&#10;Show only matters with workspaces&#10;Workspace banner yellow when Repository installed"
                className="w-full h-64 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">Version {newVersion}</span>
                <input
                  type="number"
                  min={2}
                  value={newVersion}
                  onChange={e => setNewVersion(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  className="w-16 px-2 py-1 rounded border border-gray-200 text-sm text-center"
                />
              </div>
              <button
                onClick={handleGenerateDesign}
                disabled={generating}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {generating ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Agentx Generate Design
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/60">
              <h3 className="text-sm font-semibold text-amber-800">2. Review &amp; Save Design</h3>
              <p className="text-xs text-amber-600/80 mt-0.5">After generating, review the design. Edit if needed, then save.</p>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">
                Generate a design from your requirements above. <strong>Save the design</strong> when ready. You can optionally generate impl now, or click the design from the list later to generate impl from it.
              </p>
            </div>
          </div>
        </div>
      ) : viewMode === 'design' || viewMode === 'impl' ? (
        /* Edit design or impl */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${viewMode === 'design' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm'}`}>
                {viewMode === 'design' ? <Palette className="w-5 h-5 text-white" /> : <Code2 className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {viewMode === 'design' ? 'Design' : 'Implementation'} · {selectedFile?.match(/version-(\d+)/)?.[1] ? `v${selectedFile.match(/version-(\d+)/)?.[1]}` : selectedFile ?? 'Untitled'}
                </h3>
                <p className="text-xs text-gray-500">{viewMode === 'design' ? 'Requirements & spec' : 'Stepwise instructions'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
              >
                Back to list
              </button>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setViewRaw(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${viewRaw ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Raw
                </button>
                <button
                  onClick={() => setViewRaw(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${!viewRaw ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
              {viewMode === 'design' && content && (
                <button
                  onClick={handleGenerateImpl}
                  disabled={generating}
                  title="Generate stepwise impl from this design (optional — you can also do this later from the list)"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Impl
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
            <div className="p-4">
            {viewRaw ? (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full h-[480px] px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono resize-none"
                spellCheck={false}
              />
            ) : (
              <div
                className="w-full h-[480px] px-4 py-3 rounded-xl border-2 border-gray-200 bg-white overflow-auto text-sm prose prose-sm prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content || '*No content*') as string) }}
              />
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
}
