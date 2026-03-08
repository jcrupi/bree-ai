import React, { useState, useMemo } from 'react';
import { useTasks } from './hooks/useTasks';
import { TechPanel } from './components/TechPanel';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { LeadNotesTab } from './components/LeadNotesTab';
import { WeeklyNewsTab } from './components/WeeklyNewsTab';
import { TabChat } from './components/TabChat';
import { Task, ProductName } from './types/task';
import { Plus, RefreshCw, Code2, Briefcase, Megaphone, DollarSign, Newspaper, Calendar, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'tech' | 'biz' | 'marketing' | 'sales' | 'news';

const MAIN_TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
  { id: 'tech',      label: '⚡ Tech',      icon: <Code2      className="w-4 h-4" /> },
  { id: 'biz',       label: '💼 Biz',       icon: <Briefcase  className="w-4 h-4" /> },
  { id: 'marketing', label: '📣 Marketing', icon: <Megaphone  className="w-4 h-4" /> },
  { id: 'sales',     label: '💰 Sales',     icon: <DollarSign className="w-4 h-4" /> },
  { id: 'news',      label: '📰 AI News',   icon: <Newspaper  className="w-4 h-4" /> },
];

const PRODUCTS: Array<{ key: ProductName | 'all'; label: string }> = [
  { key: 'all',           label: 'All Products' },
  { key: 'Wound AI',       label: '🩹 Wound AI' },
  { key: 'Performance AI', label: '📊 Performance AI' },
  { key: 'Extraction AI',  label: '📄 Extraction AI' },
];

const BIZ_DEFAULT = `1) Preliminary call with Interventional Pain Medicine – Univ. Miami, March 13th
2) Actively onboarding an urgent care – go-live in ~1 month
3) Signing contract with Sprinto for HIPAA, GDPR & SOC2-Type2
4) Mount Sinai – preliminary discussion complete, second meeting TBD
5) Meeting with Wasson Enterprises Thursday
6) Awaiting response from DxTx and Pain Care Florida
7) Potential collaboration with Diabetic & Wound Care Center of America`;

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

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const {
    tasks, updateTask, addTask, deleteTask,
    updateTaskStatus, addComment, deleteComment, stats,
  } = useTasks();

  const [mainTab, setMainTab]           = useState<MainTab>('tech');
  const [productFilter, setProductFilter] = useState<ProductName | 'all'>('all');
  const [viewMode, setViewMode]         = useState<'table' | 'json'>('table');
  const [editingTask, setEditingTask]   = useState<Task | null>(null);
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bizContext, setBizContext]     = useState('');
  const [marketingContext, setMarketingContext] = useState('');
  const [salesContext, setSalesContext] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  const filteredTasks = useMemo(() =>
    productFilter === 'all' ? tasks : tasks.filter(t => t.productName === productFilter),
    [tasks, productFilter],
  );

  // Summary counts for the panel footer
  const counts = useMemo(() => ({
    pending:   filteredTasks.filter(t => t.status === 'pending').length,
    active:    filteredTasks.filter(t => t.status === 'active' || t.status === 'investigating').length,
    complete:  filteredTasks.filter(t => t.status === 'complete').length,
  }), [filteredTasks]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #f8fafc)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Global styles ── */}
      <style>{`
        :root {
          --bg-primary: #f5f3ff;
          --bg-card: #ffffff;
          --surface: #ffffff;
          --border-soft: #ede9fe;
          --text-primary: #1e1b4b;
          --text-secondary: #6b7280;
          --accent: #7c3aed;
          --radius: 12px;
          --radius-sm: 8px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg-primary); }

        /* Header */
        .cw-header {
          background: #fff;
          border-bottom: 1.5px solid var(--border-soft);
          position: sticky; top: 0; z-index: 100;
          padding: 0 24px;
        }
        .cw-header-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0 10px;
        }
        .cw-brand { display: flex; align-items: center; gap: 12px; }
        .cw-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .cw-brand-name { font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; }
        .cw-brand-sub  { font-size: 12px; color: var(--text-secondary); margin-top: 1px; display: flex; align-items: center; gap: 5px; }
        .cw-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }

        /* Main tab nav */
        .cw-main-tabs { display: flex; gap: 4px; }
        .cw-main-tab {
          padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          border: none; cursor: pointer; transition: all 0.15s;
          color: var(--text-secondary); background: transparent;
        }
        .cw-main-tab.active {
          background: rgba(99,102,241,0.12); color: #6366f1;
        }
        .cw-main-tab:hover:not(.active) { background: #f1f5f9; color: var(--text-primary); }

        /* Product sub-tabs */
        .cw-sub-tabs {
          display: flex; gap: 2px; border-top: 1px solid var(--border-soft);
          padding: 4px 0;
        }
        .cw-sub-tab {
          padding: 5px 14px; font-size: 12px; font-weight: 600; border-radius: 6px;
          border: none; cursor: pointer; transition: all 0.15s;
          color: var(--text-secondary); background: transparent;
        }
        .cw-sub-tab.active { background: #6366f1; color: #fff; }
        .cw-sub-tab:hover:not(.active) { background: #f1f5f9; color: var(--text-primary); }

        /* Main layout */
        .cw-main { max-width: 1280px; margin: 0 auto; padding: 24px 20px; }

        /* Panel card */
        .cw-panel {
          background: var(--bg-card);
          border: 1.5px solid #ede9fe;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(109,40,217,0.06);
        }
        .cw-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1.5px solid #ede9fe;
          background: #faf5ff;
        }
        .cw-panel-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .cw-panel-actions { display: flex; align-items: center; gap: 8px; }

        /* View toggle */
        .cw-view-toggle {
          display: flex; background: #f1f5f9; border-radius: 6px; padding: 2px;
        }
        .cw-view-btn {
          padding: 4px 12px; border: none; border-radius: 5px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.12s; color: var(--text-secondary); background: transparent;
        }
        .cw-view-btn.active { background: #fff; color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        /* Buttons */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #6366f1; color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover { background: #4f46e5; }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; background: #fff; color: var(--text-secondary);
          border: 1.5px solid var(--border-soft); border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: #6366f1; color: #6366f1; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Panel footer */
        .cw-panel-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 18px; background: #fafbfc;
          border-top: 1px solid var(--border-soft);
          font-size: 12px; color: var(--text-secondary);
        }
        .cw-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
          border: 1px solid;
        }
        .badge-pending  { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
        .badge-active   { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
        .badge-complete { background: #f0fdf4; border-color: #86efac; color: #166534; }

        /* JSON viewer */
        .json-view {
          background: #0f172a; color: #94a3b8; font-family: 'JetBrains Mono', monospace;
          font-size: 12px; line-height: 1.6; padding: 20px 24px;
          overflow: auto; max-height: 70vh;
        }

        /* Search bar */
        .cw-search {
          width: 100%; padding: 12px 18px;
          border-bottom: 1px solid var(--border-soft);
          display: flex; align-items: center; gap: 10px;
        }
        .cw-search-input {
          flex: 1; padding: 8px 12px; background: #f8fafc;
          border: 1.5px solid var(--border-soft); border-radius: 8px;
          font-size: 13px; color: var(--text-primary); outline: none; font-family: inherit;
        }
        .cw-search-input:focus { border-color: #6366f1; background: #fff; }
      `}</style>

      {/* ── Header ── */}
      <header className="cw-header">
        <div className="cw-header-top">
          {/* Brand */}
          <div className="cw-brand">
            <div className="cw-logo">⚡</div>
            <div>
              <div className="cw-brand-name">crazy-week.ai</div>
              <div className="cw-brand-sub">
                <div className="cw-status-dot" />
                <span>Grelin Health &nbsp;·&nbsp;</span>
                <Calendar size={11} />
                <span>{currentWeekLabel()}</span>
              </div>
            </div>
          </div>

          {/* Main tabs */}
          <div className="cw-main-tabs">
            {MAIN_TABS.map(t => (
              <button key={t.id} className={`cw-main-tab${mainTab === t.id ? ' active' : ''}`}
                onClick={() => setMainTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {mainTab === 'tech' && (
              <>
                <button className="btn-secondary" disabled={isRefreshing} onClick={handleRefresh}>
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Syncing…' : 'Sync Linear'}
                </button>
                <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
                  <Plus size={14} /> Add Task
                </button>
              </>
            )}
          </div>
        </div>

        {/* Product sub-tabs — only on Tech */}
        {mainTab === 'tech' && (
          <div className="cw-sub-tabs">
            {PRODUCTS.map(p => (
              <button key={p.key}
                className={`cw-sub-tab${productFilter === p.key ? ' active' : ''}`}
                onClick={() => setProductFilter(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="cw-main">

        {/* ── TECH TAB ── */}
        {mainTab === 'tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TechPanel
              tasks={filteredTasks}
              onDescriptionUpdate={(id, desc) => updateTask(id, { description: desc })}
              onAssigneeUpdate={(id, assignee) => updateTask(id, { assignee })}
            />
          </div>
        )}

        {/* ── BIZ TAB ── */}
        {mainTab === 'biz' && (
          <>
            <LeadNotesTab field="bizText" label="Business Notes"
              placeholder="Enter business context, goals, stakeholder notes, ROI, timelines…"
              defaultText={BIZ_DEFAULT} onContextChange={setBizContext} />
            <TabChat tab="biz" context={bizContext} />
          </>
        )}

        {/* ── MARKETING TAB ── */}
        {mainTab === 'marketing' && (
          <>
            <LeadNotesTab field="marketingText" label="Marketing Notes"
              placeholder="Enter marketing angles, messaging, audience, campaigns, launch ideas…"
              onContextChange={setMarketingContext} />
            <TabChat tab="marketing" context={marketingContext} />
          </>
        )}

        {/* ── SALES TAB ── */}
        {mainTab === 'sales' && (
          <>
            <LeadNotesTab field="salesText" label="Sales Notes"
              placeholder="Enter leads, pipeline, deal stages, follow-ups, objections, close dates…"
              onContextChange={setSalesContext} />
            <TabChat tab="sales" context={salesContext} />
          </>
        )}

        {/* ── NEWS TAB ── */}
        {mainTab === 'news' && <WeeklyNewsTab />}
      </main>

      {/* ── Modals ── */}
      <EditTaskModal task={editingTask} isOpen={!!editingTask}
        onClose={() => setEditingTask(null)} onSave={updateTask} />
      <AddTaskModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={addTask} />
    </div>
  );
}

export default App;
