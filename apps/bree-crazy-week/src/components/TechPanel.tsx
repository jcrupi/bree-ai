import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Sparkles, Loader2, Search, X, ArrowUp, ArrowDown, ExternalLink, RotateCcw, Clock, Search as SearchIcon, Zap, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus } from '../types/task';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  highlightedIds?: string[];
}

// Extract any GRE-xxx patterns from AI response
function extractTaskIds(text: string): string[] {
  const matches = text.match(/GRE-\d+/g);
  return matches ? [...new Set(matches)] : [];
}

// ─── Inline edit cell ─────────────────────────────────────────────────────────

function EditableCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const commit = () => { onSave(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <input ref={ref} value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        onBlur={commit}
        style={{
          width: '100%', fontSize: 13, fontWeight: 700, padding: '1px 4px',
          border: '1.5px solid #818cf8', borderRadius: 4, outline: 'none',
          background: '#fdf4ff', color: '#1e1b4b', fontFamily: 'inherit',
        }}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} title={value}
      style={{ display: 'block', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: '#94a3b8',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    icon: <Clock style={{ width: 12, height: 12 }} />,
  },
  investigating: {
    label: 'Investigating',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    icon: <SearchIcon style={{ width: 12, height: 12 }} />,
  },
  active: {
    label: 'Active',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#bfdbfe',
    icon: <Zap style={{ width: 12, height: 12 }} />,
  },
  complete: {
    label: 'Complete',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#a7f3d0',
    icon: <CheckCircle2 style={{ width: 12, height: 12 }} />,
  },
};

function StatusBadge({ status, onClick }: { status: TaskStatus; onClick?: () => void }) {
  const config = statusConfig[status];
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 99,
        color: config.color,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.opacity = '0.8'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

// ─── Status selector ──────────────────────────────────────────────────────────

function StatusSelector({ status, onSelect }: { status: TaskStatus; onSelect: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Calculate dropdown position using fixed positioning
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      });
    }
  }, [open]);

  const options: TaskStatus[] = ['pending', 'investigating', 'active', 'complete'];

  return (
    <>
      <div ref={buttonRef} style={{ position: 'relative', display: 'inline-block' }}>
        <StatusBadge status={status} onClick={() => setOpen(!open)} />
      </div>
      {open && (
        <div ref={dropdownRef} style={{
          ...dropdownStyle,
          background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(109,40,217,0.15)', overflow: 'hidden',
          minWidth: 140,
        }}>
          {options.map(opt => {
            const cfg = statusConfig[opt];
            return (
              <div
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  fontSize: 12, color: cfg.color, cursor: 'pointer',
                  background: opt === status ? '#f5f3ff' : '#fff',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                onMouseLeave={e => (e.currentTarget.style.background = opt === status ? '#f5f3ff' : '#fff')}
              >
                {cfg.icon}
                <span>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TechPanelProps {
  tasks: Task[];
  onDescriptionUpdate?: (id: string, description: string) => void;
  onAssigneeUpdate?: (id: string, assignee: string) => void;
  onStatusUpdate?: (id: string, status: TaskStatus) => void;
}

type SortCol = 'taskId' | 'description' | 'createdDate' | 'status' | 'assignee';

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function TechPanel({ tasks, onDescriptionUpdate, onAssigneeUpdate, onStatusUpdate }: TechPanelProps) {
  // ── AI state ──
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // ── Table state ──
  const [search,       setSearch]       = useState('');
  const [sortCol,      setSortCol]      = useState<SortCol>('createdDate');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc');
  const [descEdits,    setDescEdits]    = useState<Record<string, string>>({});
  const [assigneeEdits, setAssigneeEdits] = useState<Record<string, string>>({});

  // Suggestion chips
  const SUGGESTIONS = [
    'Which tasks are about wounds?',
    'Show me pending tasks',
    'What are the highest priority bugs?',
    'Which tasks are assigned to Alex?',
    'Summarize this sprint',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Build context string for AI from all tasks
  const contextStr = useMemo(() =>
    tasks.map(t =>
      `${t.taskId} | ${t.productName} | ${t.status} | assignee: ${t.assignee ?? 'unassigned'} | "${t.description}"`
    ).join('\n'),
    [tasks],
  );

  const SYSTEM_PROMPT = `You are a smart sprint assistant for Grelin AI's crazy-week task tracker.
You have access to the current week's full task list in the format:
ID | Product | Status | Assignee | Description

Task list:
${contextStr}

When the user asks about specific tasks (e.g. by topic, product, status, assignee), always:
1. Answer their question clearly and concisely.
2. List the relevant task IDs in the format GRE-XXX at the end of your response so they can be highlighted.

Be concise. Use bullet points when listing multiple items.`;

  const send = async (text = input.trim()) => {
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setHighlighted(new Set()); // clear old highlights

    try {
      const res = await fetch(`${API_BASE}/api/openai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          query: text,
          context: contextStr,
          options: {
            model: 'gpt-4o',
            temperature: 0.4,
            max_tokens: 600,
            systemPrompt: SYSTEM_PROMPT,
          },
        }),
      });
      const data = await res.json();
      const reply: string = data.response || data.error || 'No response received.';
      const ids = extractTaskIds(reply);
      if (ids.length > 0) setHighlighted(new Set(ids));
      setMessages(prev => [...prev, { role: 'assistant', content: reply, highlightedIds: ids }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not reach AI. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setHighlighted(new Set()); };

  // ── Table filtering / sorting ──
  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const rows = useMemo(() => {
    let list = tasks.map(t => ({
      ...t,
      _desc: descEdits[t.id] ?? t.description,
      _assignee: assigneeEdits[t.id] ?? t.assignee ?? 'unassigned'
    }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r._desc.toLowerCase().includes(q) ||
        r.taskId.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r._assignee.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '', vb = '';
      if (sortCol === 'taskId')      { va = a.taskId;      vb = b.taskId; }
      if (sortCol === 'description') { va = a._desc;       vb = b._desc; }
      if (sortCol === 'createdDate') { va = a.createdDate; vb = b.createdDate; }
      if (sortCol === 'status')      { va = a.status;      vb = b.status; }
      if (sortCol === 'assignee')    { va = a._assignee;   vb = b._assignee; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [tasks, search, sortCol, sortDir, descEdits, assigneeEdits]);

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const Arrow = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return null;
    const Icon = sortDir === 'asc' ? ArrowUp : ArrowDown;
    return <Icon style={{ width: 11, height: 11, marginLeft: 4, flexShrink: 0, color: '#a78bfa' }} />;
  };

  const hasHighlights = highlighted.size > 0;

  // ── Shared TD / TH styles ──
  const TH: React.CSSProperties = {
    padding: '11px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: '#a78bfa', background: '#f5f3ff',
    borderBottom: '1px solid #ede9fe', whiteSpace: 'nowrap',
    cursor: 'pointer', userSelect: 'none', textAlign: 'left',
  };
  const TD: React.CSSProperties = {
    padding: '11px 20px', fontSize: 13, borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle', overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ══ AI CHAT PANEL ══ */}
      <div style={{
        background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 1px 6px rgba(109,40,217,0.06)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 18px', borderBottom: '1.5px solid #ede9fe', background: '#faf5ff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 14, height: 14, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>AI Task Assistant</span>
            {hasHighlights && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd',
              }}>
                {highlighted.size} task{highlighted.size > 1 ? 's' : ''} highlighted ↓
              </span>
            )}
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: '1px solid #e5e7eb', borderRadius: 7,
              padding: '4px 10px', fontSize: 12, color: '#9ca3af', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <RotateCcw style={{ width: 11, height: 11 }} /> Clear
            </button>
          )}
        </div>

        {/* Suggestion chips (shown when empty) */}
        {messages.length === 0 && (
          <div style={{ padding: '14px 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: '5px 13px', fontSize: 12, fontWeight: 500,
                background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 99,
                color: '#6d28d9', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ede9fe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '84%', padding: '9px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                  ...(msg.role === 'user'
                    ? { background: '#7c3aed', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#f5f3ff', color: '#1e1b4b', border: '1px solid #ede9fe', borderBottomLeftRadius: 4 }
                  ),
                }}>
                  {msg.content}
                  {msg.highlightedIds && msg.highlightedIds.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {msg.highlightedIds.map(id => (
                        <span key={id} style={{
                          fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 99,
                          background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)',
                          color: '#fff', fontFamily: 'ui-monospace,monospace',
                        }}>{id}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 12, borderBottomLeftRadius: 4,
                  background: '#f5f3ff', border: '1px solid #ede9fe',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Loader2 style={{ width: 13, height: 13, color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12, color: '#a78bfa' }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8, padding: '10px 14px',
          borderTop: messages.length > 0 ? '1px solid #f3f0ff' : 'none',
          background: '#fff',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about tasks, wounds, blockers, assignees…"
            disabled={loading}
            style={{
              flex: 1, border: '1.5px solid #ede9fe', borderRadius: 8,
              padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              color: '#1e1b4b', background: '#faf5ff', transition: 'border 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#818cf8')}
            onBlur={e => (e.currentTarget.style.borderColor = '#ede9fe')}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              flexShrink: 0, width: 36, height: 36, border: 'none', borderRadius: 8,
              background: input.trim() && !loading ? '#7c3aed' : '#ede9fe',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Send style={{ width: 14, height: 14, color: input.trim() && !loading ? '#fff' : '#c4b5fd' }} />
          </button>
        </div>
      </div>

      {/* ══ TASK TABLE ══ */}
      <div style={{
        background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 1px 6px rgba(109,40,217,0.06)',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid #f3f0ff' }}>
          <Search style={{ width: 13, height: 13, color: '#c4b5fd', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#1e1b4b', background: 'transparent' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X style={{ width: 12, height: 12, color: '#c4b5fd' }} />
            </button>
          )}
          {hasHighlights && (
            <button onClick={() => setHighlighted(new Set())} style={{
              fontSize: 11, color: '#7c3aed', background: '#ede9fe', border: '1px solid #c4b5fd',
              borderRadius: 99, padding: '2px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>
              Clear highlights
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 120 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={TH} onClick={() => handleSort('taskId')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>ID<Arrow col="taskId" /></span>
                </th>
                <th style={TH} onClick={() => handleSort('description')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>NAME<Arrow col="description" /></span>
                </th>
                <th style={TH} onClick={() => handleSort('status')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>STATUS<Arrow col="status" /></span>
                </th>
                <th style={TH} onClick={() => handleSort('assignee')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>ASSIGNEE<Arrow col="assignee" /></span>
                </th>
                <th style={TH} onClick={() => handleSort('createdDate')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>CREATED<Arrow col="createdDate" /></span>
                </th>
                <th style={{ ...TH, cursor: 'default' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(task => {
                const isHighlighted = highlighted.has(task.taskId);
                return (
                  <tr key={task.id}
                    style={{
                      background: isHighlighted ? '#f0e7ff' : '#fff',
                      transition: 'background 0.15s',
                      outline: isHighlighted ? '2px solid #c4b5fd' : 'none',
                      outlineOffset: '-2px',
                    }}
                    onMouseEnter={e => { if (!isHighlighted) e.currentTarget.style.background = '#faf5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isHighlighted ? '#f0e7ff' : '#fff'; }}
                  >
                    {/* ID */}
                    <td style={TD}>
                      <span style={{
                        fontFamily: 'ui-monospace, monospace', fontSize: 12,
                        color: isHighlighted ? '#6d28d9' : '#9ca3af',
                        fontWeight: isHighlighted ? 700 : 400,
                      }}>
                        {task.taskId}
                      </span>
                    </td>

                    {/* NAME */}
                    <td style={{ ...TD, fontWeight: 700, color: '#1e1b4b' }}>
                      <EditableCell
                        value={task._desc}
                        onSave={v => { setDescEdits(p => ({ ...p, [task.id]: v })); onDescriptionUpdate?.(task.id, v); }}
                      />
                    </td>

                    {/* STATUS */}
                    <td style={TD}>
                      <StatusSelector
                        status={task.status}
                        onSelect={s => onStatusUpdate?.(task.id, s)}
                      />
                    </td>

                    {/* ASSIGNEE */}
                    <td style={{ ...TD, color: '#6b7280', fontSize: 13 }}>
                      <EditableCell
                        value={task._assignee}
                        onSave={v => {
                          const val = v.trim() || 'unassigned';
                          setAssigneeEdits(p => ({ ...p, [task.id]: val }));
                          onAssigneeUpdate?.(task.id, val === 'unassigned' ? '' : val);
                        }}
                      />
                    </td>

                    {/* CREATED */}
                    <td style={TD}>
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>{fmtDate(task.createdDate)}</span>
                    </td>

                    {/* LINK */}
                    <td style={{ ...TD, textAlign: 'center', padding: '11px 8px' }}>
                      <a href={task.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ExternalLink style={{ width: 12, height: 12, color: '#d8b4fe' }}
                          onMouseEnter={e => ((e.currentTarget as SVGElement).style.color = '#7c3aed')}
                          onMouseLeave={e => ((e.currentTarget as SVGElement).style.color = '#d8b4fe')}
                        />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...TD, textAlign: 'center', padding: 40, color: '#d8b4fe' }}>
                    No tasks match your search.{' '}
                    {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Clear</button>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '9px 20px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f0ff' }}>
          Showing {rows.length} {rows.length === 1 ? 'item' : 'items'}
          {hasHighlights && <span style={{ color: '#7c3aed', marginLeft: 8, fontWeight: 600 }}>· {highlighted.size} highlighted by AI</span>}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
