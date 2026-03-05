import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import { PageShell, Card, Button, Input, Spinner, HashChip, Badge } from '../components/ui';
import { queryTurns } from '../api';
import type { ConvoTurn, QueryResult } from '../types';

type Axis = 'all' | 'app' | 'org' | 'user' | 'ehash' | 'convo';

const AXES: { key: Axis; label: string; placeholder: string }[] = [
  { key: 'all',   label: 'All',    placeholder: '— showing all turns —' },
  { key: 'convo', label: 'Convo',  placeholder: 'e.g. convoId' },
  { key: 'app',   label: 'App',    placeholder: 'e.g. kat-ai' },
  { key: 'org',   label: 'Org',    placeholder: 'e.g. the-vineyard' },
  { key: 'user',  label: 'User',   placeholder: 'e.g. usr_01HZ...' },
  { key: 'ehash', label: 'eHash',  placeholder: 'a3f8c2d1...' },
];

function TurnDetail({ turn }: { turn: ConvoTurn }) {
  const meta = turn.metadata as any;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Row 1: IDs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
          {turn.turnId}
        </span>
        <Badge label={`convo: ${turn.convoId}`} color="var(--amber)" bg="var(--amber-dim)" />
        <Badge label={turn.appId}   color="var(--accent)"   bg="var(--accent-glow)" />
        <Badge label={turn.orgId}   color="var(--green)"    bg="var(--green-dim)" />
        <Badge label={`user: ${turn.userId}`} color="var(--text-secondary)" bg="var(--bg-raised)" />
      </div>

      {/* Row 2: hashes */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <HashChip hash={turn.questionEhash} label="Q" />
        <HashChip hash={turn.answerEhash}   label="A" />
      </div>

      {/* Row 3: extras */}
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        {meta?.topic && <span>🍇 {meta.topic}</span>}
        {turn.resourceIds.length > 0 && (
          <span>📎 {turn.resourceIds.join(', ')}</span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date(turn.ts).toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

export function TurnsPage() {
  const [axis,   setAxis]   = useState<Axis>('all');
  const [query,  setQuery]  = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [page,   setPage]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const LIMIT = 20;

  const fetchResult = useCallback(async (cur: string | null) => {
    setLoading(true);
    setError(null);
    try {
      let r: QueryResult;
      const val = query.trim();
      const opts: any = { limit: LIMIT, cursor: cur };
      
      if      (axis === 'convo') opts.convoId = val;
      else if (axis === 'app')   opts.appId   = val;
      else if (axis === 'org')   opts.orgId   = val;
      else if (axis === 'user')  opts.userId  = val;
      else if (axis === 'ehash') opts.ehash   = val;
      
      r = await queryTurns(opts);
      setResult(r);
      setCursor(r.nextCursor);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [axis, query]);

  useEffect(() => {
    setPage(0);
    setHistory([null]);
    fetchResult(null);
  }, [fetchResult]);

  const goNext = () => {
    const newHistory = [...history.slice(0, page + 1), cursor];
    setHistory(newHistory);
    setPage(page + 1);
    fetchResult(cursor);
  };

  const goPrev = () => {
    const prev = history[page - 1];
    setPage(page - 1);
    fetchResult(prev ?? null);
  };

  return (
    <PageShell
      title="Turn Explorer"
      subtitle="Query stored conversation intelligence turns by any index"
      actions={
        <Button variant="ghost" size="sm" onClick={() => fetchResult(history[page] ?? null)} loading={loading} icon={<RefreshCw size={13} />}>
          Refresh
        </Button>
      }
    >
      {/* Query bar */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Axis tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-raised)', borderRadius: 8, padding: 3 }}>
            {AXES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setAxis(key); setQuery(''); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  background: axis === key ? 'var(--accent)'    : 'transparent',
                  color:      axis === key ? '#fff'              : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search input */}
          {axis !== 'all' && (
            <div style={{ flex: 1, minWidth: 220 }}>
              <Input
                placeholder={AXES.find(a => a.key === axis)?.placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          )}

          <Button icon={<Search size={13} />} onClick={() => fetchResult(null)}>
            Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      <Card
        title={result ? `${result.total} turns ${axis !== 'all' ? `· ${axis}: "${query}"` : ''}` : 'Results'}
        actions={result && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {page + 1}</span>
            <Button variant="ghost" size="sm" onClick={goPrev} disabled={page === 0} icon={<ChevronLeft size={13} />} style={{ padding: '4px 8px' }} />
            <Button variant="ghost" size="sm" onClick={goNext} disabled={!cursor} icon={<ChevronRight size={13} />} style={{ padding: '4px 8px' }} />
          </div>
        )}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: 24, color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{error}</div>
        ) : result && result.turns.length > 0 ? (
          result.turns.map(t => <TurnDetail key={t.turnId} turn={t} />)
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No turns found.
          </div>
        )}
      </Card>
    </PageShell>
  );
}
