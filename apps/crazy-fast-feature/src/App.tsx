import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskSpreadsheet } from './components/TaskSpreadsheet';
import { FilterBar } from './components/FilterBar';
import { StatsBar } from './components/StatsBar';
import { EditTaskModal } from './components/EditTaskModal';
import { AddTaskModal } from './components/AddTaskModal';
import { LeadNotesTab } from './components/LeadNotesTab';
import { Task } from './types/task';
import { Plus, Zap, RefreshCw, Code2, Briefcase, Megaphone, Calendar } from 'lucide-react';

type Tab = 'tech' | 'biz' | 'marketing';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'tech',      label: 'Tech',      icon: <Code2      className="w-4 h-4" /> },
  { id: 'biz',       label: 'Biz',       icon: <Briefcase  className="w-4 h-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone  className="w-4 h-4" /> },
];

const BIZ_DEFAULT = `1) We are having a preliminary call with an Interventional pain medicine specialist who heads the department in Univ Miami. It is planned for March 13th. They want to understand how we can improve their efficiency and decrease cancellations
2) We are actively onboarding an urgent care, will likely go live in a month or so.
3) We are signing the contract with Sprinto and will start HIPAA, GDPR & SOC2-Type2! I do not know how this will affect your development but we will need all the software that we interact for the audit
4) We are talking with Mount Sinai preliminary discussion completed and will likely have another meeting sometime soon for possible full RCM for a few of their entities. I will let you know on more details after the 2nd meeting
5) Meeting with Wasson Enterprises on Thursday. Will keep you all posted if they have anything aligned
6) Still awaiting response from DxTx and Pain care Florida, so slow, its painful.
7) Will likely learn from Rod about a potential collaboration with Diabetic and wound care center of America, a possible implementation of our woundai in their flagship GA location.`;

/** Returns the Mon–Fri date range for the current week, e.g. "Mar 3 – Mar 7, 2026" */
function currentWeekLabel(): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${fmt(monday)} – ${fmt(friday)}, ${friday.getFullYear()}`;
}

export function App() {
  const {
    tasks, filters, setFilters,
    updateTaskStatus, updateTask,
    addComment, deleteComment,
    addTask, deleteTask, stats,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<Tab>('tech');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Grelin AI</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  Crazy Week ⚡
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300 tracking-wide">
                    {currentWeekLabel()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'tech' && (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Syncing...' : 'Sync Linear'}
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/25"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 mt-4 bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-800/50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'tech' && (
          <div className="space-y-6">
            <StatsBar stats={stats} />
            <FilterBar filters={filters} onFiltersChange={setFilters} />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-200">Tasks ({tasks.length})</h2>
              </div>
              <TaskSpreadsheet
                tasks={tasks}
                onStatusChange={updateTaskStatus}
                onEdit={setEditingTask}
                onDelete={deleteTask}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
              />
            </div>
          </div>
        )}

        {activeTab === 'biz' && (
          <LeadNotesTab
            field="bizText"
            label="Business Notes"
            placeholder="Enter business context, goals, stakeholder notes, ROI considerations, budget, timelines…"
            defaultText={BIZ_DEFAULT}
          />
        )}

        {activeTab === 'marketing' && (
          <LeadNotesTab
            field="marketingText"
            label="Marketing Notes"
            placeholder="Enter marketing angles, messaging, target audience, campaigns, launch ideas…"
          />
        )}
      </main>

      {/* Modals */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
      />
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
      />
    </div>
  );
}

export default App;

