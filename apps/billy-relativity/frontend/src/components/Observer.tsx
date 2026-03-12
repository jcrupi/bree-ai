/**
 * Observer — Workspace Observation & AI Analysis for Billy Relativity
 * Adapted from HabitAware's Observer. All names lowercased to "t."
 * AI context is Relativity-specific: workspaces, matters, compliance, users.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Observable {
  id: string;
  text: string;
  category: string;
  tags: string[];
  createdAt: string;
  app?: string;            // scoped to 'billy-relativity' on server
  source?: 'observer' | 'feedback';
  metadata?: { name?: string; email?: string; };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHAT_KEY = 'billyrelativity_observer_chat';
// Observations are stored SERVER-SIDE at /api/observations (scoped to billy-relativity)
// localStorage is only used for the AI chat history.

const CATEGORIES = [
  { value: 'workspace',   label: '🗄️ Workspace Issue',    color: '#6366f1' },
  { value: 'matter',      label: '📁 Matter/Number',       color: '#f59e0b' },
  { value: 'compliance',  label: '🚨 Compliance Flag',     color: '#ef4444' },
  { value: 'user-access', label: '👤 User/Access',         color: '#10b981' },
  { value: 'performance', label: '⚡ Performance',          color: '#8b5cf6' },
  { value: 'general',     label: '📝 General',              color: '#64748b' },
];

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function loadChat(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? '[]'); } catch { return []; }
}
function saveChat(msgs: ChatMessage[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs)); }

async function fetchObservablesFromServer(): Promise<Observable[]> {
  const res = await fetch('/api/observations');
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return (data.data ?? []) as Observable[];
}

async function postObservableToServer(payload: { text: string; category: string; tags: string[] }): Promise<Observable> {
  const res = await fetch('/api/observations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.observation as Observable;
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitModal({ onClose, onSaved }: { onClose: () => void; onSaved: (obs: Observable) => void }) {
  const [text, setText]         = useState('');
  const [category, setCategory] = useState('general');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput('');
  }

  async function handleSave() {
    if (!text.trim()) return;
    try {
      const obs = await postObservableToServer({ text: text.trim(), category, tags });
      onSaved(obs);
      onClose();
    } catch (e) {
      // Fallback: create locally if server unreachable
      const obs: Observable = {
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(), category, tags,
        createdAt: new Date().toISOString(),
        app: 'billy-relativity',
        source: 'observer',
      };
      onSaved(obs);
      onClose();
    }
  }

  const catMeta = getCat(category);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔭</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>New Observation</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Saved to server — scoped to Billy Relativity</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#94a3b8', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Category pills */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  style={{ padding: '6px 12px', borderRadius: 99, border: category === c.value ? `1.5px solid ${c.color}` : '1.5px solid rgba(255,255,255,0.1)', background: category === c.value ? `${c.color}22` : 'transparent', color: category === c.value ? c.color : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                >{c.label}</button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Observation</label>
            <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
              placeholder="What did you notice? e.g. Acme workspace shows wrong matter number, user dpark@acme.com missing from domain admin group…"
              rows={5}
              style={{ width: '100%', marginTop: 8, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9', fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tags</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {tags.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99, fontSize: 12, color: '#a5b4fc' }}>
                  #{t}
                  <button onClick={() => setTags(p => p.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                  placeholder="acme, matter-num…"
                  style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 12, width: 120 }}
                />
                <button onClick={addTag} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>+ Add</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={!text.trim()}
              style={{ padding: '10px 24px', background: text.trim() ? catMeta.color : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, color: text.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
            >Save Observation</button>
          </div>
          <div style={{ textAlign: 'right', marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>⌘↵ to save</div>
        </div>
      </div>
    </div>
  );
}

// ─── Observations List ────────────────────────────────────────────────────────

function ObservationsList({ observables, onRefresh }: { observables: Observable[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');

  const filtered = observables.filter(o =>
    !search ||
    o.text.toLowerCase().includes(search.toLowerCase()) ||
    o.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search observations…"
          style={{ flex: 1, minWidth: 180, padding: '9px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#111827', fontSize: 14 }}
        />
        <button onClick={onRefresh}
          style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#64748b', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >🔄 Refresh</button>
      </div>

      {observables.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔭</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No observations yet</div>
          <div style={{ fontSize: 14 }}>Tap the 🔭 button to record a workspace issue, matter number problem, or access concern.</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(obs => {
          const cat = getCat(obs.category);
          return (
            <div key={obs.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${cat.color}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 9px', borderRadius: 99, background: `${cat.color}18`, color: cat.color, fontSize: 11, fontWeight: 700, border: `1px solid ${cat.color}44` }}>{cat.label}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{formatDate(obs.createdAt)}</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.65, color: '#111827', whiteSpace: 'pre-wrap' }}>{obs.text}</p>
              {obs.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {obs.tags.map(t => (
                    <span key={t} style={{ padding: '2px 8px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 99, fontSize: 11, color: '#4f46e5' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && search && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: 14 }}>No observations match "{search}".</div>
        )}
      </div>
    </div>
  );
}

// ─── AI Chat (Relativity-context) ─────────────────────────────────────────────

function ObserverChat({ observables }: { observables: Observable[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat());
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  function buildContext() {
    if (observables.length === 0) return 'No observations recorded yet.';
    return observables.map((o, i) => {
      const cat  = getCat(o.category);
      const tags = o.tags.length ? ` | Tags: ${o.tags.map(t => `#${t}`).join(', ')}` : '';
      return `[${i + 1}] ${cat.label} — ${formatDate(o.createdAt)}${tags}\n${o.text}`;
    }).join('\n\n');
  }

  async function sendMessage() {
    const q = input.trim();
    if (!q || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: q };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChat(updated);
    setInput('');
    setLoading(true);

    try {
      // Build a Relativity-domain system context
      const context = buildContext();
      const systemContext = observables.length > 0
        ? `You are an expert Relativity eDiscovery system analyst assistant embedded in the Billy Relativity workspace management tool.

The user has recorded the following workspace observations (issues, matter number problems, access concerns, compliance flags):

${context}

---

Answer the following question in the context of Relativity workspaces, matters, compliance rules (matter number format: E-########), client domain administration, and eDiscovery operations. Be specific and actionable.

Question: ${q}`
        : `You are an expert Relativity eDiscovery system analyst. Answer this question about Relativity workspaces, matters, compliance, and administration:\n\n${q}`;

      // Try bree-api; fall back to a simple response if unreachable
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev'}/api/habitaware/chat/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: systemContext,
          history: updated.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      let replyText: string;
      if (res.ok) {
        const data = await res.json();
        replyText = data.response ?? 'No response from AI.';
      } else {
        replyText = `⚠️ Could not reach AI (HTTP ${res.status}). Check that \`bree-api\` is running and VITE_API_URL is correct.`;
      }

      const final = [...updated, { role: 'assistant' as const, content: replyText }];
      setMessages(final);
      saveChat(final);
    } catch (e) {
      const final = [...updated, { role: 'assistant' as const, content: `⚠️ Network error: ${e instanceof Error ? e.message : String(e)}. Is the bree-api reachable?` }];
      setMessages(final);
      saveChat(final);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    'What compliance issues have I recorded?',
    'Which clients have matter number problems?',
    'Summarize all workspace observations by category',
    'What access issues have been flagged?',
    'What should I prioritize fixing first?',
    'Which matters are missing the E-######## format?',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
      {/* Context banner */}
      <div style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🔭</span>
        <span>Analyzing <strong>{observables.length}</strong> Relativity observation{observables.length !== 1 ? 's' : ''} — AI context is workspace &amp; compliance aware</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ padding: '24px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>Ask anything about your Relativity observations</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '82%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize: 14, lineHeight: 1.65, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(n => (
                <span key={n} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: `obs-bounce 1.2s ${n * 0.2}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask about your Relativity observations…" disabled={loading}
          style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          style={{ padding: '12px 20px', background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
        >Ask AI ↑</button>
      </div>
      {messages.length > 0 && (
        <button onClick={() => { setMessages([]); saveChat([]); }} style={{ marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', textAlign: 'right', width: '100%' }}>
          Clear conversation
        </button>
      )}
      <style>{`@keyframes obs-bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// ─── Observer Panel ────────────────────────────────────────────────────────

function ObserverPanel({ observables, onRefresh, loadError }: { observables: Observable[]; onRefresh: () => void; loadError?: string }) {
  const [activeView, setActiveView] = useState<'list' | 'chat'>('list');

  const categoryStats = CATEGORIES.map(c => ({
    ...c, count: observables.filter(o => o.category === c.value).length,
  })).filter(c => c.count > 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🔭</span> <span>Observer</span>
        </h2>
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
          Record workspace issues, matter problems &amp; compliance flags — saved to server
        </p>
        {loadError && (
          <div style={{ marginTop: 8, padding: '6px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
            ⚠️ Could not load from server: {loadError}
          </div>
        )}
      </div>

      {categoryStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          {categoryStats.map(c => (
            <div key={c.value} style={{ padding: '14px 16px', background: `${c.color}12`, border: `1px solid ${c.color}44`, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.count}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {(['list', 'chat'] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: activeView === v ? '#fff' : 'transparent', color: activeView === v ? '#4f46e5' : '#6b7280', fontWeight: activeView === v ? 700 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', boxShadow: activeView === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
          >
            {v === 'list' ? `📋 Observations (${observables.length})` : '🧠 AI Analysis'}
          </button>
        ))}
      </div>

      {activeView === 'list'
        ? <ObservationsList observables={observables} onRefresh={onRefresh} />
        : <ObserverChat observables={observables} />
      }
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ObserverProps {
  panelMode?: boolean;
}

export default function Observer({ panelMode = false }: ObserverProps) {
  const [observables, setObservables] = useState<Observable[]>([]);
  const [loadError, setLoadError]     = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [pulse, setPulse]             = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchObservablesFromServer();
      setObservables(data);
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load observations');
    }
  }, []);

  // Fetch on mount when panel is open
  useEffect(() => {
    if (panelMode) refresh();
  }, [panelMode, refresh]);

  function handleSaved(obs: Observable) {
    // Optimistically prepend then re-fetch to sync with server
    setObservables(prev => [obs, ...prev]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    // Background re-fetch so count stays in sync
    refresh();
  }

  const Panel = ObserverPanel;

  return (
    <>
      {/* Floating Action Button — always visible */}
      <button
        id="observer-fab"
        onClick={() => setShowModal(true)}
        title="New Observation"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 8888,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          boxShadow: pulse
            ? '0 0 0 8px rgba(99,102,241,0.25), 0 8px 24px rgba(99,102,241,0.5)'
            : '0 4px 20px rgba(99,102,241,0.4)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          transition: 'box-shadow 0.3s ease, transform 0.15s ease',
          transform: pulse ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        🔭
        {observables.length > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#10b981', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 6px', minWidth: 18, textAlign: 'center', border: '2px solid #0f172a' }}>
            {observables.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {panelMode && <Panel observables={observables} onRefresh={refresh} loadError={loadError} />}

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSaved={obs => handleSaved(obs)}
        />
      )}
    </>
  );
}
