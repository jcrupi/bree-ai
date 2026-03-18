import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { Task, TaskStatus } from '../types/task';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
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
      style={{ display: 'block', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: '#1e1b4b' }}>
      {value}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TaskTrackingTableProps {
  tasks: Task[];
  onDescriptionUpdate?: (id: string, description: string) => void;
  onAssigneeUpdate?: (id: string, assignee: string) => void;
}

// ─── Table ────────────────────────────────────────────────────────────────────

type SortCol = 'taskId' | 'description' | 'createdDate';

export function TaskTrackingTable({ tasks, onDescriptionUpdate }: TaskTrackingTableProps) {
  const [search,  setSearch]  = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('createdDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [descEdits, setDescEdits] = useState<Record<string, string>>({});

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const rows = useMemo(() => {
    let list = tasks.map(t => ({
      ...t,
      _desc: descEdits[t.id] ?? t.description,
    }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r._desc.toLowerCase().includes(q) ||
        r.taskId.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '', vb = '';
      if (sortCol === 'taskId')      { va = a.taskId;     vb = b.taskId; }
      if (sortCol === 'description') { va = a._desc;      vb = b._desc; }
      if (sortCol === 'createdDate') { va = a.createdDate; vb = b.createdDate; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [tasks, search, sortCol, sortDir, descEdits]);

  const Arrow = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return null;
    const Icon = sortDir === 'asc' ? ArrowUp : ArrowDown;
    return <Icon style={{ width: 11, height: 11, marginLeft: 4, flexShrink: 0, color: '#a78bfa' }} />;
  };

  // ── Shared styles ──
  const TH_BASE: React.CSSProperties = {
    padding: '11px 20px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: '#a78bfa',
    background: '#f5f3ff',
    borderBottom: '1px solid #ede9fe',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'left',
  };

  const TD_BASE: React.CSSProperties = {
    padding: '11px 20px',
    fontSize: 13,
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
    overflow: 'hidden',
  };

  return (
    <div>
      {/* ── Search ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px', borderBottom: '1px solid #f3f0ff',
      }}>
        <Search style={{ width: 13, height: 13, color: '#c4b5fd', flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks…"
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit',
            color: '#1e1b4b', background: 'transparent', lineHeight: 1.4,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
            <X style={{ width: 12, height: 12, color: '#c4b5fd' }} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 160 }} />
            <col />
            <col style={{ width: 140 }} />
            <col style={{ width: 36 }} />
          </colgroup>

          <thead>
            <tr>
              <th style={TH_BASE} onClick={() => handleSort('taskId')}>
                <span style={{ display: 'flex', alignItems: 'center' }}>ID<Arrow col="taskId" /></span>
              </th>
              <th style={TH_BASE} onClick={() => handleSort('description')}>
                <span style={{ display: 'flex', alignItems: 'center' }}>NAME<Arrow col="description" /></span>
              </th>
              <th style={TH_BASE} onClick={() => handleSort('createdDate')}>
                <span style={{ display: 'flex', alignItems: 'center' }}>CREATED<Arrow col="createdDate" /></span>
              </th>
              <th style={{ ...TH_BASE, cursor: 'default' }}></th>
            </tr>
          </thead>

          <tbody>
            {rows.map(task => (
              <tr key={task.id}
                style={{ background: '#fff', transition: 'background 0.08s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                {/* ID */}
                <td style={TD_BASE}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>
                    {task.taskId}
                  </span>
                </td>

                {/* NAME */}
                <td style={TD_BASE}>
                  <EditableCell
                    value={task._desc}
                    onSave={v => { setDescEdits(p => ({ ...p, [task.id]: v })); onDescriptionUpdate?.(task.id, v); }}
                  />
                </td>

                {/* CREATED */}
                <td style={TD_BASE}>
                  <span style={{ color: '#9ca3af', fontSize: 13 }}>{fmtDate(task.createdDate)}</span>
                </td>

                {/* LINK */}
                <td style={{ ...TD_BASE, textAlign: 'center', padding: '11px 8px' }}>
                  <a href={task.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink style={{ width: 12, height: 12, color: '#d8b4fe' }}
                      onMouseEnter={e => ((e.currentTarget as SVGElement).style.color = '#7c3aed')}
                      onMouseLeave={e => ((e.currentTarget as SVGElement).style.color = '#d8b4fe')}
                    />
                  </a>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...TD_BASE, textAlign: 'center', padding: 40, color: '#d8b4fe' }}>
                  No tasks match your search.{' '}
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>Clear</button>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '9px 20px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f0ff' }}>
        Showing {rows.length} {rows.length === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
}
