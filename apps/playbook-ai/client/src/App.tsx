import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "./api";
import Observer from "./Observer";

// ─── Catalog + Specialty config (mirrors server shared/specialty-config) ──────

const CATALOG_CONFIG = [
  { id: "grelin-ai", name: "Grelin AI", icon: "⚕", description: "Medical specialty playbooks", color: "teal" },
  { id: "bree-ai",   name: "Bree AI",   icon: "◈", description: "Tax & compliance specialties", color: "orange" },
] as const;

type CatalogId = (typeof CATALOG_CONFIG)[number]["id"];

const SPECIALTY_CONFIG = [
  { id: "1040-simple",         name: "1040 (Simple)",    icon: "📄", catalogId: "bree-ai"   as CatalogId },
  { id: "hipaa",               name: "HIPAA",            icon: "🛡️", catalogId: "bree-ai"   as CatalogId },
  { id: "disability",          name: "Disability",           icon: "♿", catalogId: "bree-ai"   as CatalogId },
  { id: "ediscovery-compliance", name: "eDiscovery Compliance", icon: "⚖️", catalogId: "bree-ai"   as CatalogId },
  { id: "aml-kyc",               name: "AML / KYC",            icon: "🦹", catalogId: "bree-ai"   as CatalogId },
  { id: "gdpr-breach",           name: "GDPR Breach",          icon: "🔒", catalogId: "bree-ai"   as CatalogId },
  { id: "fmla",                  name: "FMLA",                 icon: "🏥", catalogId: "bree-ai"   as CatalogId },
  { id: "1040-full",             name: "1040 Full (2025)",     icon: "📅", catalogId: "bree-ai"   as CatalogId },
  { id: "wound-ai",            name: "Wound Care",       icon: "🩹", catalogId: "grelin-ai" as CatalogId },
  { id: "behavioral-health-ai",name: "Behavioral Health",icon: "🧠", catalogId: "grelin-ai" as CatalogId },
  { id: "pain-ai",             name: "Pain Management",  icon: "💊", catalogId: "grelin-ai" as CatalogId },
  { id: "derm-ai",             name: "Dermatology",      icon: "🔬", catalogId: "grelin-ai" as CatalogId },
  { id: "dme-ai",              name: "DME",              icon: "🦽", catalogId: "grelin-ai" as CatalogId },
  { id: "enm-ai",              name: "E&M Coding",       icon: "🏥", catalogId: "grelin-ai" as CatalogId },
  { id: "urgent-ai",           name: "Urgent Care",      icon: "🚑", catalogId: "grelin-ai" as CatalogId },
] as const;

type SpecialtyId = (typeof SPECIALTY_CONFIG)[number]["id"];
type Tab = "playbook" | "algos" | "playback-runner" | "code-mapping" | "design" | "analysis-playbook" | "analysis-algos" | "builder" | "observer";
type ViewMode = "preview" | "raw";

function errMsg(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if ("value" in o && o.value && typeof o.value === "object") {
      const v = o.value as Record<string, unknown>;
      return (v.message as string) ?? (v.summary as string) ?? "Request failed";
    }
  }
  return e instanceof Error ? e.message : "Request failed";
}

export default function App() {
  // Default to grelin-ai catalog, wound-ai specialty
  const [catalogId, setCatalogId] = useState<CatalogId>("grelin-ai");
  const [specialty, setSpecialty] = useState<SpecialtyId>("wound-ai");
  // Bree AI PIN gate
  const [breeUnlocked, setBreeUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  function handleCatalogClick(catId: CatalogId) {
    if (catId === "bree-ai" && !breeUnlocked) {
      setShowPinModal(true);
      setPinInput("");
      setPinError(false);
      return;
    }
    setCatalogId(catId);
    const first = SPECIALTY_CONFIG.find((s) => s.catalogId === catId);
    if (first) setSpecialty(first.id);
  }

  function handlePinSubmit() {
    if (pinInput === "20816") {
      setBreeUnlocked(true);
      setShowPinModal(false);
      setCatalogId("bree-ai");
      const first = SPECIALTY_CONFIG.find((s) => s.catalogId === "bree-ai");
      if (first) setSpecialty(first.id);
    } else {
      setPinError(true);
      setPinInput("");
    }
  }
  const [tab, setTab] = useState<Tab>("playbook");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [playbook, setPlaybook] = useState("");
  const [algos, setAlgos] = useState("");
  const [playbookMeta, setPlaybookMeta] = useState<{ version: number; created_at: string } | null>(null);
  const [algosMeta, setAlgosMeta] = useState<{ version: number; created_at: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    setLoadError(null);
    try {
      const [pb, alg] = await Promise.all([
        api.api.documents({ specialty }).playbook.get(),
        api.api.documents({ specialty }).algos.get(),
      ]);
      if (pb.error) throw new Error(errMsg(pb.error));
      if (alg.error) throw new Error(errMsg(alg.error));
      setPlaybook(pb.data?.content ?? "");
      setAlgos(alg.data?.content ?? "");
      setPlaybookMeta(
        pb.data?.version != null && pb.data?.created_at
          ? { version: pb.data.version, created_at: pb.data.created_at }
          : null
      );
      setAlgosMeta(
        alg.data?.version != null && alg.data?.created_at
          ? { version: alg.data.version, created_at: alg.data.created_at }
          : null
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load documents");
    }
  }, [specialty]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const isAnalysisTab = tab === "analysis-playbook" || tab === "analysis-algos";
  const isDesignTab = tab === "design";
  const isCodeMappingTab = tab === "code-mapping";
  const isPlaybackRunnerTab = tab === "playback-runner";
  const isExpertTab =
    tab === "code-mapping" || tab === "design" || tab === "analysis-playbook" || tab === "analysis-algos";
  const showDocPanel = tab === "playbook" || tab === "algos";
  const isBuilderTab = tab === "builder";
  const isObserverTab = tab === "observer";
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const content = tab === "playbook" ? playbook : algos;
  const meta = tab === "playbook" ? playbookMeta : algosMeta;
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo">
            <span className="logo-icon">◈</span>
            Playbook<span className="logo-ai">.ai</span>
          </h1>
          <p className="sidebar-tagline">Specialty playbooks & algorithms</p>
        </div>
        <nav className="specialty-nav">
          {/* Catalog tabs */}
          <div className="catalog-tabs">
            {CATALOG_CONFIG.map((cat) => (
              <button
                key={cat.id}
                className={`catalog-tab catalog-tab-${cat.color} ${catalogId === cat.id ? "active" : ""}`}
                onClick={() => handleCatalogClick(cat.id)}
              >
                <span className="catalog-tab-icon">{cat.icon}</span>
                <span>{cat.name}</span>
                {cat.id === "bree-ai" && !breeUnlocked && (
                  <span style={{ fontSize: "0.65rem", marginLeft: 2, opacity: 0.6 }}>🔒</span>
                )}
              </button>
            ))}
          </div>

          {/* Specialties in the active catalog */}
          <div className="catalog-specialties">
            {SPECIALTY_CONFIG.filter((s) => s.catalogId === catalogId).map((s) => (
              <button
                key={s.id}
                className={`specialty-btn ${specialty === s.id ? "active" : ""}`}
                onClick={() => setSpecialty(s.id)}
              >
                <span className="specialty-icon">{s.icon}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <button onClick={loadDocs} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>
      </aside>

      {/* Bree AI PIN gate modal */}
      {showPinModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPinModal(false); }}
        >
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px 36px", width: 320, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#f1f5f9", marginBottom: 6 }}>Bree AI Access</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>Enter your access code to continue</div>
            <input
              autoFocus
              type="password"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePinSubmit(); }}
              placeholder="Access code"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: pinError ? "1.5px solid #ef4444" : "1.5px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#f1f5f9", fontSize: 16, textAlign: "center", letterSpacing: "0.2em", boxSizing: "border-box", marginBottom: pinError ? 8 : 16, fontFamily: "inherit" }}
            />
            {pinError && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Incorrect code — try again</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={handlePinSubmit} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #ea580c, #c2410c)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      <div className="main">
        <header className="header">
          <div className="tabs-row">
            <div className="doc-tabs">
            <button
              className={`doc-tab ${tab === "playbook" ? "active" : ""}`}
              onClick={() => setTab("playbook")}
            >
              Playbook
            </button>
            <button
              className={`doc-tab ${tab === "algos" ? "active" : ""}`}
              onClick={() => setTab("algos")}
            >
              Algos
            </button>
            <button
              className={`doc-tab ${tab === "playback-runner" ? "active" : ""}`}
              onClick={() => setTab("playback-runner")}
            >
              Playback Runner
            </button>
            <button
              className={`doc-tab ${tab === "builder" ? "active" : ""}`}
              onClick={() => setTab("builder")}
              title="AI Playbook Builder — generate domain playbook + algos"
            >
              Builder
            </button>
            <button
              className={`doc-tab ${isExpertTab ? "active" : ""}`}
              onClick={() => setTab(isExpertTab ? tab : "code-mapping")}
              title="Code Mapping, Design, Analysis"
            >
              Expert
            </button>
            <button
              className={`doc-tab ${isObserverTab ? "active" : ""}`}
              onClick={() => setTab("observer")}
              title="Observer — capture playbook observations & AI analysis"
            >
              🔭 Observer
            </button>
          </div>
          {isExpertTab && (
            <div className="expert-subtabs">
              <button
                className={`expert-subtab ${tab === "code-mapping" ? "active" : ""}`}
                onClick={() => setTab("code-mapping")}
                title="Playbook → code mapping (Python/TypeScript)"
              >
                Code Mapping
              </button>
              <button
                className={`expert-subtab ${tab === "design" ? "active" : ""}`}
                onClick={() => setTab("design")}
                title="Design agentx notes"
              >
                Design
              </button>
              <button
                className={`expert-subtab ${tab === "analysis-playbook" ? "active" : ""}`}
                onClick={() => setTab("analysis-playbook")}
                title="Testing team feedback on Playbook"
              >
                Analysis (Playbook)
              </button>
              <button
                className={`expert-subtab ${tab === "analysis-algos" ? "active" : ""}`}
                onClick={() => setTab("analysis-algos")}
                title="Testing team feedback on Algos"
              >
                Analysis (Algos)
              </button>
            </div>
          )}
          </div>
          {showDocPanel && !isAnalysisTab && meta && (meta.version > 0 || meta.created_at) && (
            <div className="doc-meta" title={`Version ${meta.version} · Created ${meta.created_at}`}>
              <span className="doc-version">v{meta.version}</span>
              {meta.created_at && (
                <span className="doc-created">{formatDate(meta.created_at)}</span>
              )}
            </div>
          )}
          {showDocPanel && !isAnalysisTab && (
            <div className="view-toggle">
              <button
                className={`pill ${viewMode === "preview" ? "active" : ""}`}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </button>
              <button
                className={`pill ${viewMode === "raw" ? "active" : ""}`}
                onClick={() => setViewMode("raw")}
              >
                Raw
              </button>
            </div>
          )}
        </header>

        {loadError && (
          <div className="error-banner">{loadError}</div>
        )}

        <div className={`content-row ${showDocPanel ? "content-row-doc" : ""} ${isPlaybackRunnerTab ? "content-row-playback" : ""} ${isCodeMappingTab ? "content-row-code-mapping" : ""} ${isBuilderTab ? "content-row-builder" : ""} ${isObserverTab ? "content-row-observer" : ""}`}>
          {/* Left: resizable/collapsible Playbook + Algos panel (when in playbook/algos or playback-runner) */}
          {(showDocPanel || isPlaybackRunnerTab) && !isDesignTab && !isCodeMappingTab && !isBuilderTab && (
            <div
              className={`doc-left-panel ${leftPanelCollapsed ? "collapsed" : ""}`}
              style={{ width: leftPanelCollapsed ? 32 : leftPanelWidth }}
            >
              {!leftPanelCollapsed && (
                <>
                  <div className="doc-panel-inner">
                    {showDocPanel ? (
                      viewMode === "raw" ? (
                        <textarea
                          value={content}
                          readOnly
                          className="doc-textarea"
                          placeholder={tab === "playbook" ? "Playbook markdown…" : "Algos markdown…"}
                          spellCheck={false}
                        />
                      ) : (
                        <div className="markdown-body doc-preview">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*No content loaded*"}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      <div className="doc-preview doc-preview-ref">
                        <p className="text-muted">Playbook & Algos reference. Collapse for more space.</p>
                      </div>
                    )}
                  </div>
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startW = leftPanelWidth;
                      const onMove = (e2: MouseEvent) => {
                        const dx = e2.clientX - startX;
                        const next = Math.min(600, Math.max(200, startW + dx));
                        setLeftPanelWidth(next);
                      };
                      const onUp = () => {
                        document.removeEventListener("mousemove", onMove);
                        document.removeEventListener("mouseup", onUp);
                      };
                      document.addEventListener("mousemove", onMove);
                      document.addEventListener("mouseup", onUp);
                    }}
                  />
                </>
              )}
              <button
                type="button"
                className="collapse-toggle"
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                title={leftPanelCollapsed ? "Expand" : "Collapse"}
                aria-label={leftPanelCollapsed ? "Expand" : "Collapse"}
              >
                {leftPanelCollapsed ? "◀" : "▶"}
              </button>
            </div>
          )}

          {/* Main: Playback Runner, Analysis, Design, or Observer */}
          <main className={`doc-panel main-panel ${isPlaybackRunnerTab ? "playback-runner-full" : ""} ${isBuilderTab ? "builder-full" : ""} ${isObserverTab ? "observer-full" : ""} ${showDocPanel ? "main-panel-hidden" : ""}`}>
            {isBuilderTab ? (
              <PlaybookBuilderPanel />
            ) : isPlaybackRunnerTab ? (
              <PlaybackRunnerPanel specialty={specialty} />
            ) : tab === "analysis-playbook" ? (
              <AnalysisPanel specialty={specialty} type="playbook" />
            ) : tab === "analysis-algos" ? (
              <AnalysisPanel specialty={specialty} type="algos" />
            ) : isCodeMappingTab ? (
              <CodeMappingPanel specialty={specialty} />
            ) : isDesignTab ? (
              <DesignPanel specialty={specialty} />
            ) : isObserverTab ? (
              <Observer panelMode />
            ) : null}
          </main>

        </div>
      </div>

      {/* Observer FAB — visible on all non-observer tabs */}
      {!isObserverTab && <Observer />}
    </div>
  );
}

function AnalysisPanel({
  specialty,
  type,
}: {
  specialty: SpecialtyId;
  type: "playbook" | "algos";
}) {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(1);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "archived" | "error">("idle");
  const [implemented, setImplemented] = useState(false);
  const [doubleCheck, setDoubleCheck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [dryRunData, setDryRunData] = useState<{ before: string; after: string } | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setImplemented(false);
    setDoubleCheck(false);
    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/documents/${specialty}/analysis/${type}`);
      const data = (await res.json()) as { content?: string; version?: number; filename?: string };
      setContent(data.content ?? "");
      setVersion(data.version ?? 1);
      setFilename(data.filename ?? "");
    } catch {
      setContent("");
      setVersion(1);
    } finally {
      setLoading(false);
    }
  }, [specialty, type]);

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setSaveStatus("error");
    }
  };

  const runDryRun = async () => {
    setDryRunLoading(true);
    setDryRunData(null);
    setDryRunOpen(true);
    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/documents/${specialty}/analysis/${type}/dry-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_content: content }),
      });
      if (!res.ok) throw new Error("Dry run failed");
      const data = (await res.json()) as { before: string; after: string };
      setDryRunData(data);
    } catch {
      setDryRunData({ before: "", after: "Dry run failed. Check analysis content and try again." });
    } finally {
      setDryRunLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const base = window.location.origin;
      if (implemented && doubleCheck) {
        const res = await fetch(`${base}/api/documents/${specialty}/analysis/${type}/archive-and-bump`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error("Archive failed");
        await res.json();
        setSaveStatus("archived");
        setTimeout(() => setSaveStatus("idle"), 3000);
        setImplemented(false);
        setDoubleCheck(false);
        await load();
      } else {
        const res = await fetch(`${base}/api/documents/${specialty}/analysis/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error("Save failed");
        const data = (await res.json()) as { filename?: string; version?: number };
        setFilename(data.filename ?? "");
        setVersion(data.version ?? 1);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const label = type === "playbook" ? "Playbook" : "Algos";
  if (loading) {
    return (
      <div className="analysis-panel">
        <p className="analysis-loading">Loading analysis…</p>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <div className="analysis-title-row">
          <h2 className="analysis-title">
            Testing Team Feedback — {label} Analysis
          </h2>
          <div className="analysis-header-actions">
            <button
              type="button"
              className="analysis-dryrun-btn"
              onClick={runDryRun}
              title="Preview before/after: playbook or algos with analysis applied"
              aria-label="Dry run"
            >
              ◐ Dry Run
            </button>
            <button
              type="button"
              className="analysis-copy-btn"
              onClick={copyToClipboard}
              title="Copy to clipboard"
              aria-label="Copy to clipboard"
            >
              {copied ? "✓ Copied" : "⎘ Copy"}
            </button>
          </div>
        </div>
        <p className="analysis-desc">
          Freeform notes for the testing team. Add feedback, issues, or suggestions for the {label}.
          {filename && <span className="analysis-filename"> v{version} — <code>{filename}</code></span>}
        </p>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Add your analysis and feedback for the ${label}…`}
        className="analysis-textarea"
        spellCheck={true}
      />
      <div className="analysis-implemented-row">
        <label className="analysis-checkbox-label">
          <input
            type="checkbox"
            checked={implemented}
            onChange={(e) => setImplemented(e.target.checked)}
          />
          <span>Implemented</span>
        </label>
        <label className="analysis-checkbox-label">
          <input
            type="checkbox"
            checked={doubleCheck}
            onChange={(e) => setDoubleCheck(e.target.checked)}
            disabled={!implemented}
          />
          <span>Double-check</span>
        </label>
      </div>
      <p className="analysis-archive-hint">
        {implemented && doubleCheck
          ? "Save will archive this analysis to archives/ with -implemented and create new v" + (version + 1)
          : implemented
            ? "Check Double-check to archive and bump version"
            : "Check both to archive and start new version"}
      </p>
      <div className="analysis-actions">
        <button
          className="primary analysis-save-btn"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving…" : implemented && doubleCheck ? "Archive & Bump" : "Save"}
        </button>
        {saveStatus === "saved" && (
          <span className="analysis-saved">✓ Saved</span>
        )}
        {saveStatus === "archived" && (
          <span className="analysis-archived">✓ Archived, v{version + 1} created</span>
        )}
        {saveStatus === "error" && (
          <span className="analysis-error">Save failed</span>
        )}
      </div>

      {dryRunOpen && (
        <div className="dryrun-overlay" onClick={() => setDryRunOpen(false)}>
          <div className="dryrun-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dryrun-header">
              <h3>Dry Run — Before & After</h3>
              <button
                type="button"
                className="dryrun-close"
                onClick={() => setDryRunOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {dryRunLoading ? (
              <p className="dryrun-loading">Generating preview…</p>
            ) : dryRunData ? (
              <div className="dryrun-content">
                <div className="dryrun-panel">
                  <h4>Before (current {label})</h4>
                  <pre className="dryrun-text">{dryRunData.before || "(empty)"}</pre>
                </div>
                <div className="dryrun-panel">
                  <h4>After (with analysis applied)</h4>
                  <pre className="dryrun-text">{dryRunData.after || "(no changes)"}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeMappingPanel({ specialty }: { specialty: SpecialtyId }) {
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState<"Python" | "TypeScript">("TypeScript");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const base = window.location.origin;
        const res = await fetch(`${base}/api/documents/${specialty}/code-mapping`);
        if (!res.ok) throw new Error("Failed to load code mapping");
        const data = (await res.json()) as { content?: string; filename?: string; language?: "Python" | "TypeScript" };
        if (!cancelled) {
          setContent(data.content ?? "");
          setFilename(data.filename ?? "");
          setLanguage(data.language ?? "TypeScript");
        }
      } catch {
        if (!cancelled) setContent("*Failed to load code mapping*");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [specialty]);

  if (loading) {
    return (
      <div className="code-mapping-panel">
        <p className="code-mapping-loading">Loading playbook → code mapping…</p>
      </div>
    );
  }

  return (
    <div className="code-mapping-panel">
      <div className="code-mapping-header">
        <h2 className="code-mapping-title">
          Playbook → Code Mapping — {SPECIALTY_CONFIG.find(s => s.id === specialty)?.name ?? specialty}
        </h2>
        <span className={`code-mapping-badge code-mapping-badge-${language.toLowerCase()}`}>
          {language}
        </span>
        {filename && (
          <span className="code-mapping-filename" title={filename}>
            {filename}
          </span>
        )}
      </div>
      <p className="code-mapping-desc">
        {language === "Python"
          ? "wound-ai is the reference implementation in Python (FastAPI)."
          : "TypeScript specialties (Hono/Express) follow the same pattern as wound-ai."}
      </p>
      <div className="markdown-body code-mapping-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || "*No mapping content*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function PlaybookBuilderPanel() {
  const [domainInfo, setDomainInfo] = useState("");
  const [domainSlug, setDomainSlug] = useState("");
  const [playbook, setPlaybook] = useState("");
  const [algos, setAlgos] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [activeView, setActiveView] = useState<"input" | "playbook" | "algos">("input");

  const generate = async () => {
    if (!domainInfo.trim()) return;
    setGenerating(true);
    setPlaybook("");
    setAlgos("");
    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_info: domainInfo.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Generate failed";
        try {
          const json = JSON.parse(text) as { error?: string };
          if (json.error) errMsg = json.error;
        } catch {
          if (text && text.length < 200) errMsg = text;
        }
        throw new Error(errMsg);
      }
      const data = (await res.json()) as { playbook?: string; algos?: string };
      setPlaybook(data.playbook ?? "");
      setAlgos(data.algos ?? "");
      const slugMatch = (data.playbook ?? "").match(/filename:\s*["']?([a-z0-9-]+)\.playbook/);
      if (slugMatch) setDomainSlug(slugMatch[1]);
      setActiveView("playbook");
    } catch (e) {
      setPlaybook(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setActiveView("playbook");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    const slug = domainSlug.trim() || domainInfo.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "domain";
    if (!slug) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/builder/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: slug, playbook, algos }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="builder-panel">
      <div className="builder-header">
        <h2 className="builder-title">Playbook Builder</h2>
        <p className="builder-desc">
          Feed domain information below. AI will generate a domain-specific playbook and algos that conform to meta-playbook and meta-algos schemas.
        </p>
      </div>

      <div className="builder-input-section">
        <label className="builder-label">Domain Information</label>
        <textarea
          value={domainInfo}
          onChange={(e) => setDomainInfo(e.target.value)}
          placeholder={`Describe your domain. Include:
- Domain name and slug (e.g. fatapps, document-qa)
- Business purpose
- Core entities (name, description, relationships)
- Key rules or validation logic
- Optional: API surface, reference apps`}
          className="builder-textarea"
          rows={12}
          spellCheck={true}
        />
        <button
          type="button"
          className="builder-generate-btn"
          onClick={generate}
          disabled={generating || !domainInfo.trim()}
        >
          {generating ? "Generating…" : "Generate Playbook + Algos"}
        </button>
      </div>

      {(playbook || algos) && (
        <div className="builder-output-section">
          <div className="builder-output-tabs">
            <button
              className={`builder-output-tab ${activeView === "playbook" ? "active" : ""}`}
              onClick={() => setActiveView("playbook")}
            >
              Playbook
            </button>
            <button
              className={`builder-output-tab ${activeView === "algos" ? "active" : ""}`}
              onClick={() => setActiveView("algos")}
            >
              Algos
            </button>
          </div>
          <div className="builder-output-content">
            {activeView === "playbook" ? (
              <div className="markdown-body builder-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{playbook || "*No content*"}</ReactMarkdown>
              </div>
            ) : (
              <div className="markdown-body builder-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{algos || "*No content*"}</ReactMarkdown>
              </div>
            )}
          </div>
          <div className="builder-save-row">
            <input
              type="text"
              value={domainSlug}
              onChange={(e) => setDomainSlug(e.target.value)}
              placeholder="Domain slug (e.g. fatapps)"
              className="builder-slug-input"
            />
            <button
              type="button"
              className="builder-save-btn"
              onClick={save}
              disabled={saving || (!domainSlug.trim() && !domainInfo.trim())}
            >
              {saving ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save to agentx/playbook/"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DesignPanel({ specialty: _specialty }: { specialty: SpecialtyId }) {
  const [designs, setDesigns] = useState<{ app: string; path: string; content: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const base = window.location.origin;
        const res = await fetch(`${base}/api/designs`);
        if (!res.ok) throw new Error("Failed to load designs");
        const data = (await res.json()) as { designs: { app: string; path: string; content: string }[] };
        if (!cancelled) {
          setDesigns(data.designs ?? []);
          if (data.designs?.length) setSelected(data.designs[0].path);
        }
      } catch {
        if (!cancelled) setDesigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const current = designs.find((d) => d.path === selected);

  if (loading) {
    return (
      <div className="design-panel">
        <p className="design-loading">Loading design notes…</p>
      </div>
    );
  }

  if (!designs.length) {
    return (
      <div className="design-panel">
        <p className="design-empty">No design agentx notes found.</p>
      </div>
    );
  }

  return (
    <div className="design-panel">
      <div className="design-header">
        <h2 className="design-title">Design AgentX Notes</h2>
        <select
          value={selected ?? ""}
          onChange={(e) => setSelected(e.target.value || null)}
          className="design-select"
        >
          {designs.map((d) => (
            <option key={d.path} value={d.path}>
              {d.app} — {d.path.split("/").pop() ?? d.path}
            </option>
          ))}
        </select>
      </div>
      <div className="markdown-body design-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {current?.content ?? "*Select a design document*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}

type RuleEval = {
  ruleId: string;
  ruleName: string;
  status: "PASS" | "FAIL" | "INVESTIGATING";
  finding: string;
  remediation: string | null;
};

const STATUS_CONFIG = {
  PASS: {
    label: "PASS",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    dot: "#22c55e",
    badge: "#dcfce7",
    badgeText: "#166534",
  },
  FAIL: {
    label: "FAIL",
    bg: "#fff5f5",
    border: "#fecaca",
    text: "#dc2626",
    dot: "#ef4444",
    badge: "#fee2e2",
    badgeText: "#991b1b",
  },
  INVESTIGATING: {
    label: "INVESTIGATING",
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#d97706",
    dot: "#f59e0b",
    badge: "#fef3c7",
    badgeText: "#92400e",
  },
} as const;

function StatusBadge({ status }: { status: "PASS" | "FAIL" | "INVESTIGATING" }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.04em", background: cfg.badge, color: cfg.badgeText,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function EvalTable({ evaluations, summary }: { evaluations: RuleEval[]; summary: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const counts = {
    PASS: evaluations.filter(e => e.status === "PASS").length,
    FAIL: evaluations.filter(e => e.status === "FAIL").length,
    INVESTIGATING: evaluations.filter(e => e.status === "INVESTIGATING").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary bar */}
      {summary && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, fontSize: 13, lineHeight: 1.6,
          background: "#f8faff", border: "1.5px solid #e0e7ff", color: "#1e293b",
        }}>
          <span style={{ fontWeight: 700, color: "#4f46e5", marginRight: 8 }}>Assessment</span>
          {summary}
        </div>
      )}

      {/* Count pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(["PASS", "FAIL", "INVESTIGATING"] as const).map(s => (
          <div key={s} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: STATUS_CONFIG[s].badge, color: STATUS_CONFIG[s].badgeText,
            border: `1.5px solid ${STATUS_CONFIG[s].border}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_CONFIG[s].dot }} />
            {counts[s]} {s === "INVESTIGATING" ? "Investigating" : s === "PASS" ? "Passed" : "Failed"}
          </div>
        ))}
        <div style={{
          marginLeft: "auto", fontSize: 12, color: "#6b7280",
          display: "flex", alignItems: "center",
        }}>
          {evaluations.length} rules evaluated
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "110px 1fr 140px",
          background: "#f8fafc", borderBottom: "1.5px solid #e5e7eb",
          padding: "10px 16px", gap: 12,
        }}>
          {["RULE ID", "NAME", "STATUS"].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "#9ca3af", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {evaluations.map((ev, i) => {
          const cfg = STATUS_CONFIG[ev.status];
          const isExp = expanded.has(ev.ruleId);
          const hasDrilldown = ev.status !== "PASS" || !!ev.remediation;
          return (
            <div key={ev.ruleId} style={{ borderBottom: i < evaluations.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              {/* Main row */}
              <div
                onClick={() => hasDrilldown && toggle(ev.ruleId)}
                style={{
                  display: "grid", gridTemplateColumns: "110px 1fr 140px",
                  padding: "12px 16px", gap: 12, alignItems: "center",
                  background: isExp ? cfg.bg : (i % 2 === 0 ? "#fff" : "#fafafa"),
                  borderLeft: `3px solid ${isExp ? cfg.dot : "transparent"}`,
                  cursor: hasDrilldown ? "pointer" : "default",
                  transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cfg.bg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isExp ? cfg.bg : (i % 2 === 0 ? "#fff" : "#fafafa"); }}
              >
                {/* Rule ID */}
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                  {ev.ruleId}
                </div>
                {/* Name + finding */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>{ev.ruleName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{ev.finding}</div>
                </div>
                {/* Status + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={ev.status} />
                  {hasDrilldown && (
                    <span style={{ fontSize: 10, color: "#9ca3af", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                  )}
                </div>
              </div>

              {/* Expanded remediation row */}
              {isExp && (ev.remediation || ev.finding) && (
                <div style={{
                  padding: "10px 16px 14px 130px",
                  background: cfg.bg, borderLeft: `3px solid ${cfg.dot}`,
                }}>
                  {ev.remediation && (
                    <div style={{
                      display: "flex", gap: 8, alignItems: "flex-start",
                      padding: "10px 14px", borderRadius: 8,
                      background: "#fff", border: `1px solid ${cfg.border}`,
                      fontSize: 12, color: cfg.text, lineHeight: 1.55,
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {ev.status === "FAIL" ? "⚠️" : ev.status === "INVESTIGATING" ? "🔍" : "✅"}
                      </span>
                      <div>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>Remediation:</span>
                        {ev.remediation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlaybackRunnerPanel({ specialty }: { specialty: SpecialtyId }) {
  const [content, setContent] = useState("");
  const [narrative, setNarrative] = useState("");
  const [evaluations, setEvaluations] = useState<RuleEval[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultView, setResultView] = useState<"table" | "narrative">("table");
  const hasResult = narrative || evaluations.length > 0;

  const run = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setNarrative("");
    setEvaluations([]);
    setSummary("");
    try {
      const base = window.location.origin;
      const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty, input_text: content.trim() }),
      });
      if (!res.ok) throw new Error("Run failed");
      const data = (await res.json()) as {
        answer?: string;
        summary?: string;
        evaluations?: RuleEval[];
      };
      setNarrative(data.answer ?? "");
      setSummary(data.summary ?? "");
      setEvaluations(data.evaluations ?? []);
      // Auto-switch to table view if we have evaluations
      if (data.evaluations?.length) setResultView("table");
    } catch (e) {
      setNarrative(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setResultView("narrative");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="playback-runner-panel">
      <h2 className="playback-runner-title">Playback Runner</h2>
      <p className="playback-runner-desc">
        Paste content below and run it through the playbook. The AI evaluates each algos rule and shows a table of PASS / FAIL / INVESTIGATING results.
      </p>
      <div className="playback-runner-form">
        <label className="playback-runner-label">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste a 1040, encounter note, HIPAA document, or any content to run through the playbook…"
          className="playback-runner-textarea"
        />
        <div className="playback-runner-actions">
          <button
            className="primary"
            onClick={run}
            disabled={loading || !content.trim()}
          >
            {loading ? "Running…" : "Run through playbook"}
          </button>
        </div>
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{
              height: 52, borderRadius: 8, overflow: "hidden",
              background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }} />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      )}

      {hasResult && !loading && (
        <div style={{ marginTop: 24 }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
            {(["table", "narrative"] as const).map(v => (
              <button
                key={v}
                onClick={() => setResultView(v)}
                style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: resultView === v ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
                  background: resultView === v ? "#6366f1" : "#fff",
                  color: resultView === v ? "#fff" : "#6b7280",
                  transition: "all 0.12s",
                }}
              >
                {v === "table" ? "📊 Table" : "📝 Narrative"}
                {v === "table" && evaluations.length > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.8, fontWeight: 400 }}>({evaluations.length})</span>
                )}
              </button>
            ))}
          </div>

          {resultView === "table" && evaluations.length > 0 ? (
            <EvalTable evaluations={evaluations} summary={summary} />
          ) : resultView === "table" && !evaluations.length ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: 13, background: "#f9fafb", borderRadius: 10, border: "1px solid #f1f5f9" }}>
              No structured rule evaluations returned — switch to Narrative view.
            </div>
          ) : (
            <div className="playback-runner-result markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrative}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
