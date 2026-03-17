import React, { useState, useEffect, useCallback } from 'react';
import {
  Code2, Briefcase, Megaphone, Newspaper, Settings, X,
  Save, Calendar, CheckCircle2, Circle, Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'tech' | 'biz' | 'marketing' | 'news';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  adminToggleable: boolean; // Tech tab is always on
}

interface AdminSettings {
  showBiz: boolean;
  showMarketing: boolean;
  showNews: boolean;
}

const ADMIN_SETTINGS_KEY = 'geni-crazy-week:admin-settings';
const NOTES_KEY_PREFIX = 'geni-crazy-week:notes:';
const API_BASE = '/api/geni-crazy-weeks';

const ALL_TABS: TabConfig[] = [
  { id: 'tech',       label: '⚡ Tech',      icon: <Code2     size={14} />, adminToggleable: false },
  { id: 'biz',        label: '💼 Biz',       icon: <Briefcase size={14} />, adminToggleable: true  },
  { id: 'marketing',  label: '📣 Marketing', icon: <Megaphone size={14} />, adminToggleable: true  },
  { id: 'news',       label: '📰 AI News',   icon: <Newspaper size={14} />, adminToggleable: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function currentWeekLabel(): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(friday)}, ${friday.getFullYear()}`;
}

function loadAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { showBiz: true, showMarketing: true, showNews: true };
}

function saveAdminSettings(s: AdminSettings) {
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(s));
}

// ─── Note Panel ───────────────────────────────────────────────────────────────

interface NotePanelProps {
  tab: TabId;
  week: string;
  label: string;
  placeholder: string;
}

function NotePanel({ tab, week, label, placeholder }: NotePanelProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loaded, setLoaded] = useState(false);

  // Load from API on mount / week change
  useEffect(() => {
    setLoaded(false);
    fetch(`${API_BASE}/${week}/${tab}`)
      .then(r => r.json())
      .then(d => {
        setText(d.content ?? '');
        setLoaded(true);
      })
      .catch(() => {
        // Fallback to localStorage
        setText(localStorage.getItem(`${NOTES_KEY_PREFIX}${week}:${tab}`) ?? '');
        setLoaded(true);
      });
  }, [tab, week]);

  const handleSave = useCallback(async () => {
    setStatus('saving');
    try {
      await fetch(`${API_BASE}/${week}/${tab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      localStorage.setItem(`${NOTES_KEY_PREFIX}${week}:${tab}`, text);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [tab, week, text]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="gcw-panel">
      <div className="gcw-panel-header">
        <span className="gcw-panel-title">{label}</span>
        <button
          className={`gcw-save-btn${status === 'saving' ? ' saving' : status === 'saved' ? ' saved' : status === 'error' ? ' error' : ''}`}
          onClick={handleSave}
          disabled={status === 'saving'}
        >
          {status === 'saved'
            ? <><CheckCircle2 size={13} /> Saved</>
            : status === 'saving'
            ? <><Circle size={13} className="gcw-spin" /> Saving…</>
            : status === 'error'
            ? '⚠ Error'
            : <><Save size={13} /> Save</>}
        </button>
      </div>
      <div className="gcw-panel-body">
        {loaded ? (
          <textarea
            className="gcw-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={20}
          />
        ) : (
          <div className="gcw-loading">Loading…</div>
        )}
      </div>
      <div className="gcw-panel-footer">
        <span>{text.split('\n').filter(Boolean).length} lines · {text.length} chars</span>
        <span style={{ color: '#86efac', fontSize: 11 }}>⌘S to save</span>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

interface AdminPanelProps {
  settings: AdminSettings;
  onChange: (s: AdminSettings) => void;
  onClose: () => void;
}

function AdminPanel({ settings, onChange, onClose }: AdminPanelProps) {
  const [draft, setDraft] = useState<AdminSettings>({ ...settings });

  const toggle = (key: keyof AdminSettings) =>
    setDraft(prev => ({ ...prev, [key]: !prev[key] }));

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  const toggleItems: { key: keyof AdminSettings; label: string; icon: React.ReactNode }[] = [
    { key: 'showBiz',       label: '💼 Biz',       icon: <Briefcase size={16} /> },
    { key: 'showMarketing', label: '📣 Marketing', icon: <Megaphone size={16} /> },
    { key: 'showNews',      label: '📰 AI News',   icon: <Newspaper size={16} /> },
  ];

  return (
    <div className="gcw-modal-overlay" onClick={onClose}>
      <div className="gcw-modal" onClick={e => e.stopPropagation()}>
        <div className="gcw-modal-header">
          <div className="gcw-modal-title">
            <Settings size={16} /> Admin Settings
          </div>
          <button className="gcw-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="gcw-modal-body">
          <p className="gcw-modal-desc">Toggle which tabs are visible. The <strong>Tech</strong> tab is always shown.</p>

          <div className="gcw-toggle-list">
            {toggleItems.map(item => (
              <div key={item.key} className="gcw-toggle-row">
                <div className="gcw-toggle-label">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <button
                  className={`gcw-toggle${draft[item.key] ? ' on' : ' off'}`}
                  onClick={() => toggle(item.key)}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span className="gcw-toggle-knob" />
                  <span className="gcw-toggle-text">{draft[item.key] ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="gcw-modal-footer">
          <button className="gcw-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="gcw-btn-primary" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(loadAdminSettings);
  const [activeTab, setActiveTab] = useState<TabId>('tech');
  const [showAdmin, setShowAdmin] = useState(false);
  const week = weekKey();

  const handleAdminChange = (s: AdminSettings) => {
    saveAdminSettings(s);
    setAdminSettings(s);
    // If active tab is now hidden, jump to tech
    if (
      (activeTab === 'biz' && !s.showBiz) ||
      (activeTab === 'marketing' && !s.showMarketing) ||
      (activeTab === 'news' && !s.showNews)
    ) {
      setActiveTab('tech');
    }
  };

  const visibleTabs = ALL_TABS.filter(t => {
    if (!t.adminToggleable) return true;
    if (t.id === 'biz') return adminSettings.showBiz;
    if (t.id === 'marketing') return adminSettings.showMarketing;
    if (t.id === 'news') return adminSettings.showNews;
    return true;
  });

  const tabContent: Record<TabId, { label: string; placeholder: string }> = {
    tech:      { label: 'Tech Notes',       placeholder: 'Engineering tasks, bugs, PRs, architecture decisions…' },
    biz:       { label: 'Business Notes',   placeholder: 'Business goals, stakeholder updates, deals, timelines…' },
    marketing: { label: 'Marketing Notes',  placeholder: 'Campaigns, messaging, audiences, launch ideas…' },
    news:      { label: 'AI News',          placeholder: 'Noteworthy AI developments, articles, tools this week…' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Styles ── */}
      <style>{`
        :root {
          --green-50:  #f0fdf4;
          --green-100: #dcfce7;
          --green-200: #bbf7d0;
          --green-400: #4ade80;
          --green-500: #22c55e;
          --green-600: #16a34a;
          --green-700: #15803d;
          --green-800: #166534;
          --green-900: #14532d;
          --border:    #bbf7d0;
          --radius:    12px;
        }

        /* Header */
        .gcw-header {
          background: #fff;
          border-bottom: 1.5px solid var(--border);
          position: sticky; top: 0; z-index: 100;
          padding: 0 24px;
        }
        .gcw-header-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0 10px;
        }
        .gcw-brand { display: flex; align-items: center; gap: 12px; }
        .gcw-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .gcw-brand-name { font-size: 22px; font-weight: 800; color: var(--green-900); letter-spacing: -0.5px; }
        .gcw-brand-sub  { font-size: 12px; color: var(--green-600); margin-top: 1px; display: flex; align-items: center; gap: 5px; }
        .gcw-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }

        /* Tab nav */
        .gcw-tabs { display: flex; gap: 4px; }
        .gcw-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: none; cursor: pointer; transition: all 0.15s;
          color: var(--green-700); background: transparent;
        }
        .gcw-tab.active { background: rgba(34,197,94,0.15); color: var(--green-700); }
        .gcw-tab:hover:not(.active) { background: var(--green-100); }

        /* Admin button */
        .gcw-admin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
          border: 1.5px solid var(--border); background: #fff;
          color: var(--green-700); cursor: pointer; transition: all 0.15s;
        }
        .gcw-admin-btn:hover { border-color: var(--green-500); color: var(--green-700); background: var(--green-100); }

        /* Main layout */
        .gcw-main { max-width: 960px; margin: 0 auto; padding: 28px 20px; }

        /* Panel */
        .gcw-panel {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(34,197,94,0.08);
        }
        .gcw-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1.5px solid var(--border);
          background: #f0fdf4;
        }
        .gcw-panel-title { font-size: 15px; font-weight: 700; color: var(--green-900); }

        /* Save button */
        .gcw-save-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 700;
          border: none; cursor: pointer; transition: all 0.15s;
          background: var(--green-600); color: #fff;
        }
        .gcw-save-btn:hover { background: var(--green-700); }
        .gcw-save-btn.saved  { background: #dcfce7; color: var(--green-700); }
        .gcw-save-btn.saving { background: #e5e7eb; color: #6b7280; cursor: not-allowed; }
        .gcw-save-btn.error  { background: #fee2e2; color: #dc2626; }

        /* Textarea */
        .gcw-panel-body { padding: 0; }
        .gcw-textarea {
          width: 100%; min-height: 420px; padding: 18px 20px;
          border: none; outline: none; font-size: 14px; line-height: 1.7;
          color: var(--green-900); background: #fff; display: block;
        }
        .gcw-loading { padding: 40px; text-align: center; color: var(--green-600); font-size: 13px; }

        /* Panel footer */
        .gcw-panel-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 18px; background: #f9fefb;
          border-top: 1px solid var(--border);
          font-size: 11px; color: var(--green-600);
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .gcw-spin { animation: spin 1s linear infinite; }

        /* ── Modal ── */
        .gcw-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .gcw-modal {
          background: #fff; border-radius: 16px;
          width: 400px; max-width: 90vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: modalIn 0.2s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .gcw-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1.5px solid var(--border);
          background: var(--green-50);
        }
        .gcw-modal-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 700; color: var(--green-900);
        }
        .gcw-modal-close {
          background: none; border: none; cursor: pointer; color: var(--green-600);
          padding: 4px; border-radius: 6px; display: flex; align-items: center;
          transition: background 0.15s;
        }
        .gcw-modal-close:hover { background: var(--green-100); }
        .gcw-modal-body { padding: 20px; }
        .gcw-modal-desc { font-size: 13px; color: var(--green-700); margin-bottom: 18px; line-height: 1.5; }
        .gcw-modal-footer {
          display: flex; gap: 8px; justify-content: flex-end;
          padding: 14px 20px; border-top: 1.5px solid var(--border);
          background: var(--green-50);
        }

        /* Toggle list */
        .gcw-toggle-list { display: flex; flex-direction: column; gap: 12px; }
        .gcw-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-radius: 10px;
          border: 1.5px solid var(--border); background: var(--green-50);
        }
        .gcw-toggle-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 600; color: var(--green-800);
        }
        .gcw-toggle {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 10px 5px 6px; border-radius: 99px; border: none;
          cursor: pointer; font-size: 11px; font-weight: 700;
          transition: all 0.2s; position: relative;
        }
        .gcw-toggle.on  { background: var(--green-500); color: #fff; }
        .gcw-toggle.off { background: #e5e7eb; color: #6b7280; }
        .gcw-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .gcw-toggle-text { letter-spacing: 0.05em; }

        /* Buttons */
        .gcw-btn-primary {
          padding: 8px 20px; background: var(--green-600); color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
        }
        .gcw-btn-primary:hover { background: var(--green-700); }
        .gcw-btn-secondary {
          padding: 8px 16px; background: #fff; color: var(--green-800);
          border: 1.5px solid var(--border); border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .gcw-btn-secondary:hover { border-color: var(--green-500); }
      `}</style>

      {/* ── Header ── */}
      <header className="gcw-header">
        <div className="gcw-header-top">
          {/* Brand */}
          <div className="gcw-brand">
            <div className="gcw-logo">🌿</div>
            <div>
              <div className="gcw-brand-name">geni.crazy-week</div>
              <div className="gcw-brand-sub">
                <div className="gcw-status-dot" />
                <Calendar size={11} />
                <span>{currentWeekLabel()}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="gcw-tabs">
            {visibleTabs.map(t => (
              <button
                key={t.id}
                id={`gcw-tab-${t.id}`}
                className={`gcw-tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Admin */}
          <button
            id="gcw-admin-btn"
            className="gcw-admin-btn"
            onClick={() => setShowAdmin(true)}
            title="Admin Settings"
          >
            <Settings size={13} /> Admin
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="gcw-main">
        {activeTab === 'tech' && (
          <NotePanel tab="tech" week={week} label="Tech Notes"
            placeholder="Engineering tasks, bugs, PRs, decisions…" />
        )}
        {activeTab === 'biz' && adminSettings.showBiz && (
          <NotePanel tab="biz" week={week} label="Business Notes"
            placeholder="Business goals, stakeholder updates, deals, timelines…" />
        )}
        {activeTab === 'marketing' && adminSettings.showMarketing && (
          <NotePanel tab="marketing" week={week} label="Marketing Notes"
            placeholder="Campaigns, messaging, audiences, launch ideas…" />
        )}
        {activeTab === 'news' && adminSettings.showNews && (
          <NotePanel tab="news" week={week} label="AI News"
            placeholder="Noteworthy AI developments, articles, tools this week…" />
        )}
      </main>

      {/* ── Admin modal ── */}
      {showAdmin && (
        <AdminPanel
          settings={adminSettings}
          onChange={handleAdminChange}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
