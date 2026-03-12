import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Save, CheckCircle2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { saveWeekTab, loadCurrentWeek } from '../services/leadNotes';

const PIN_CODE = '2026';
const SESSION_KEY = 'crazy_fast_unlocked';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTab {
  id: string;
  label: string;
  content: string;
}

interface TabbedNotesPanelProps {
  mainTab: 'biz' | 'marketing';
  label: string;
  placeholder: string;
  defaultText?: string;
  onContextChange?: (text: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const storageKey = (tab: string) => `crazy_week_subtabs_${tab}`;
const newId = () => `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function loadFromLocalStorage(mainTab: string): { tabs: SubTab[]; activeTabId: string } | null {
  try {
    const raw = localStorage.getItem(storageKey(mainTab));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.tabs?.length) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(mainTab: string, tabs: SubTab[], activeTabId: string) {
  localStorage.setItem(storageKey(mainTab), JSON.stringify({ tabs, activeTabId }));
}

function combinedContext(tabs: SubTab[]): string {
  if (tabs.length === 1) return tabs[0].content;
  return tabs.map((t) => `[${t.label}]\n${t.content}`).join('\n\n');
}

// Debounce hook
function useDebounced<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]) as T;
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div
        className={`p-4 rounded-2xl transition-colors ${error ? 'bg-red-500/20' : 'bg-slate-800/60'} border ${error ? 'border-red-500/40' : 'border-slate-700/50'}`}
      >
        <Lock className={`w-8 h-8 mx-auto ${error ? 'text-red-400' : 'text-indigo-400'}`} />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-200">Access Code Required</h3>
        <p className="text-sm text-slate-500 mt-1">Enter the code to view this section.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-64">
        <div className="relative w-full">
          <input
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter code…"
            autoFocus
            className={`w-full text-center text-xl tracking-[0.4em] font-mono bg-slate-900 border rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-500/60 focus:ring-red-500/30 text-red-400'
                : 'border-slate-700 focus:ring-indigo-500/40 text-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">Incorrect code — try again.</p>}
        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TabbedNotesPanel({
  mainTab,
  label,
  placeholder,
  defaultText = '',
  onContextChange,
}: TabbedNotesPanelProps) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [tabs, setTabs] = useState<SubTab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved'>('loading');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  // ── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!unlocked) return;

    loadCurrentWeek().then((data) => {
      const serverRaw = data[mainTab as 'biz' | 'marketing'];

      // 1. Server has JSON sub-tab structure
      if (serverRaw) {
        try {
          const parsed = JSON.parse(serverRaw);
          if (parsed?.tabs?.length) {
            const activeId = parsed.activeTabId || parsed.tabs[0].id;
            setTabs(parsed.tabs);
            setActiveTabId(activeId);
            onContextChange?.(combinedContext(parsed.tabs));
            saveToLocalStorage(mainTab, parsed.tabs, activeId);
            setStatus('idle');
            return;
          }
        } catch {
          // not JSON — fall through to plain-text handling
        }

        // 2. Server has legacy plain text — seed a General tab
        const first: SubTab = { id: newId(), label: 'General', content: serverRaw };
        setTabs([first]);
        setActiveTabId(first.id);
        onContextChange?.(serverRaw);
        saveToLocalStorage(mainTab, [first], first.id);
        setStatus('idle');
        return;
      }

      // 3. No server data — try localStorage
      const stored = loadFromLocalStorage(mainTab);
      if (stored) {
        const activeId = stored.activeTabId || stored.tabs[0].id;
        setTabs(stored.tabs);
        setActiveTabId(activeId);
        onContextChange?.(combinedContext(stored.tabs));
        setStatus('idle');
        return;
      }

      // 4. Fresh start — use defaultText
      const first: SubTab = { id: newId(), label: 'General', content: defaultText };
      setTabs([first]);
      setActiveTabId(first.id);
      onContextChange?.(defaultText);
      saveToLocalStorage(mainTab, [first], first.id);
      setStatus('idle');
    });
  }, [mainTab, unlocked]);

  // ── Focus rename input ──────────────────────────────────────────────────

  useEffect(() => {
    if (editingTabId) editRef.current?.focus();
  }, [editingTabId]);

  // ── Auto-save to server (debounced) ─────────────────────────────────────

  const autoSaveToServer = useDebounced(
    useCallback((list: SubTab[], activeId: string) => {
      saveWeekTab(mainTab, JSON.stringify({ tabs: list, activeTabId: activeId }));
    }, [mainTab]),
    800,
  );

  // ── Persist helper (localStorage + debounced server) ─────────────────────

  const persist = useCallback(
    (list: SubTab[], active: string) => {
      saveToLocalStorage(mainTab, list, active);
      onContextChange?.(combinedContext(list));
      autoSaveToServer(list, active);
    },
    [mainTab, onContextChange, autoSaveToServer],
  );

  // ── Tab actions ─────────────────────────────────────────────────────────

  const handleContentChange = (value: string) => {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === activeTabId ? { ...t, content: value } : t));
      persist(updated, activeTabId);
      return updated;
    });
  };

  const addTab = () => {
    const tab: SubTab = { id: newId(), label: `Note ${tabs.length + 1}`, content: '' };
    const updated = [...tabs, tab];
    setTabs(updated);
    setActiveTabId(tab.id);
    persist(updated, tab.id);
  };

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const updated = tabs.filter((t) => t.id !== id);
    const next = activeTabId === id ? updated[0].id : activeTabId;
    setTabs(updated);
    setActiveTabId(next);
    persist(updated, next);
  };

  const startRename = (id: string, current: string) => {
    setEditingTabId(id);
    setEditLabel(current);
  };

  const commitRename = () => {
    if (!editingTabId) return;
    const trimmed = editLabel.trim();
    if (trimmed) {
      setTabs((prev) => {
        const updated = prev.map((t) => (t.id === editingTabId ? { ...t, label: trimmed } : t));
        persist(updated, activeTabId);
        return updated;
      });
    }
    setEditingTabId(null);
  };

  const handleSave = async () => {
    setStatus('saving');
    saveToLocalStorage(mainTab, tabs, activeTabId);
    await saveWeekTab(mainTab, JSON.stringify({ tabs, activeTabId }));
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // ── Gate ─────────────────────────────────────────────────────────────────

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">{label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Add tabs for different topics — everything auto-saves locally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              setUnlocked(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-sm"
            title="Lock section"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={status === 'saving' || status === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/25 text-sm font-medium"
          >
            {status === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : status === 'saved' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save
              </>
            )}
          </button>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* ── Sub-tab bar ── */}
          <div className="flex items-center gap-1 border-b border-purple-200/70">
            {tabs.map((t) => (
              <div
                key={t.id}
                className={`group relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-all select-none ${
                  activeTabId === t.id
                    ? 'bg-purple-100 text-purple-900 border-b-2 border-fuchsia-500'
                    : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50 border-b-2 border-transparent'
                }`}
                onClick={() => {
                  setActiveTabId(t.id);
                  persist(tabs, t.id);
                }}
              >
                {editingTabId === t.id ? (
                  <input
                    ref={editRef}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    className="bg-transparent border-none outline-none text-sm font-medium text-purple-900 w-24"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(t.id, t.label);
                    }}
                    title="Double-click to rename"
                  >
                    {t.label}
                  </span>
                )}

                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-purple-400 hover:text-red-500 transition-all ml-0.5"
                    title="Remove tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addTab}
              className="flex items-center gap-1 px-2.5 py-2 text-purple-400 hover:text-fuchsia-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
              title="Add new tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Text area for active tab ── */}
          {activeTab && (
            <textarea
              value={activeTab.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder={placeholder}
              rows={18}
              className="w-full bg-gradient-to-br from-fuchsia-50 via-purple-50 to-pink-50 border border-fuchsia-200 rounded-xl px-5 py-4 text-purple-950 text-sm leading-relaxed placeholder-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400 resize-none transition-all shadow-sm"
            />
          )}
        </>
      )}

      <p className="text-xs text-slate-600">
        Tip: ⌘S to save &middot; Double-click tab name to rename &middot; Content auto-saves locally.
      </p>
    </div>
  );
}
